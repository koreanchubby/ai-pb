#!/usr/bin/env python3
"""하우스뷰 합의 계산 (DECISIONS 2026-09-30).

사람이 월 1회 data/house_view_input.json에 증권사별 의견(+1 확대 / 0 중립 / -1 축소)을 적으면,
이 스크립트가 자산군별 '동일가중 합의'를 계산해 data/house_view.json을 만든다.

규칙
- 동일가중 평균: 여러 기관 전망을 같은 비중으로 결합 (Timmermann, 2006, Handbook of Economic Forecasting Ch.4;
  단순 평균이 정교한 가중보다 자주 낫다는 '예측 결합 퍼즐').
- 의견 불일치: 같은 자산에 +1과 -1이 함께 있으면 합의는 0(중립)으로 두고 disagreement=true로 표시.
- 그 외: 평균을 가장 가까운 정수로 (|평균| > 0.5면 ±1, 아니면 0) = 과반 원칙.  ← 실무 규칙(데모 가정)
- 원문·표·차트는 저장하지 않는다. 점수와 출처(기관명·자료명·발간일·링크)만.
- 참고 기관 목록은 고정(결과 좋은 곳만 고르는 선택 편향 방지): 목록 변경은 DECISIONS에 기록.

실행: python scripts/house_view.py [--input data/house_view_input.json] [--output data/house_view.json] [--check]
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "data" / "house_view_input.json"
OUTPUT = ROOT / "data" / "house_view.json"
SCHEMA_VERSION = 1

ASSETS = {  # key: (화면 이름, app.js HOUSE_VIEW의 asset 이름)
    "kr_equity": "국내 주식",
    "global_equity": "해외 주식",
    "govbond": "국채",
    "corpbond": "회사채",
    "alternative": "금·리츠",
    "cash": "현금성",
}
VIEW_LABEL = {1: "확대", 0: "중립", -1: "축소"}
TONE = {1: "buy", 0: "hold", -1: "sell"}
MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class InputError(ValueError):
    """입력 파일 형식 오류 (어느 칸이 왜 틀렸는지 사람이 읽을 수 있게)."""


def validate(data: dict) -> list[dict]:
    if not isinstance(data, dict):
        raise InputError("파일 전체가 { } 객체여야 합니다")
    month = data.get("month", "")
    if not MONTH_RE.match(str(month)):
        raise InputError(f"month는 '2026-10' 형식이어야 합니다 (지금: {month!r})")
    sources = data.get("sources")
    if not isinstance(sources, list) or not sources:
        raise InputError("sources에 기관을 1곳 이상 적어야 합니다")
    seen = set()
    for i, src in enumerate(sources, 1):
        where = f"sources {i}번째"
        if not isinstance(src, dict):
            raise InputError(f"{where}: {{ }} 객체여야 합니다")
        for field in ("id", "name", "title", "published"):
            if not str(src.get(field, "")).strip():
                raise InputError(f"{where}: {field} 칸이 비어 있습니다")
        if src["id"] in seen:
            raise InputError(f"{where}: id '{src['id']}'가 중복입니다")
        seen.add(src["id"])
        try:
            if not DATE_RE.match(str(src["published"])):
                raise ValueError
            dt.date.fromisoformat(str(src["published"]))  # 2026-02-30 같은 없는 날짜도 거부
        except ValueError:
            raise InputError(f"{where}: published는 실제 날짜를 '2026-10-01' 형식으로 적어야 합니다") from None
        url = src.get("url")
        if url and not str(url).startswith("https://"):
            raise InputError(f"{where}: url은 https://로 시작해야 합니다")
        views = src.get("views")
        if not isinstance(views, dict):
            raise InputError(f"{where}: views가 없습니다")
        unknown = set(views) - set(ASSETS)
        if unknown:
            raise InputError(f"{where}: 모르는 자산 {sorted(unknown)} (쓸 수 있는 것: {list(ASSETS)})")
        for key, value in views.items():
            if type(value) is not int or value not in (-1, 0, 1):  # 1.0, true 같은 값도 거부
                raise InputError(f"{where}: {key} 값은 -1, 0, 1 중 하나여야 합니다 (지금: {value!r})")
    return sources


def consensus(sources: list[dict]) -> dict:
    result = {}
    for key, label in ASSETS.items():
        votes = [s["views"][key] for s in sources if key in s["views"]]
        if not votes:
            result[key] = {"asset": label, "n": 0, "mean": None, "view": 0, "label": "자료 없음",
                           "tone": "hold", "disagreement": False, "votes": {}}
            continue
        mean = sum(votes) / len(votes)
        disagreement = 1 in votes and -1 in votes
        if disagreement:
            view = 0
        elif mean > 0.5:
            view = 1
        elif mean < -0.5:
            view = -1
        else:
            view = 0
        result[key] = {
            "asset": label,
            "n": len(votes),
            "mean": round(mean, 4),
            "view": view,
            "label": "의견 불일치" if disagreement else VIEW_LABEL[view],
            "tone": TONE[view],
            "disagreement": disagreement,
            "votes": {s["id"]: s["views"][key] for s in sources if key in s["views"]},
        }
    return result


def build(data: dict, now: dt.datetime | None = None) -> dict:
    sources = validate(data)
    now = now or dt.datetime.now(dt.timezone.utc)
    return {
        "schema_version": SCHEMA_VERSION,
        "month": data["month"],
        "generated_at": now.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "demo": bool(data.get("demo", False)),
        "method": "동일가중 평균(Timmermann, 2006). +1과 -1이 함께 있으면 0(의견 불일치), 그 외 |평균|>0.5면 ±1",
        "sources": [{k: s.get(k) for k in ("id", "name", "title", "published", "url")} for s in sources],
        "consensus": consensus(sources),
        "notice": "증권사 자료의 원문·표·차트는 싣지 않고 자산군별 의견 점수와 출처만 사용합니다. 투자 권유가 아닙니다.",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="하우스뷰 합의 계산")
    parser.add_argument("--input", type=Path, default=INPUT)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    parser.add_argument("--check", action="store_true", help="형식만 검사하고 파일은 쓰지 않음")
    args = parser.parse_args(argv)
    try:
        data = json.loads(args.input.read_text(encoding="utf-8"))
        result = build(data)
    except (json.JSONDecodeError, InputError) as error:
        print(f"입력 오류: {error}", file=sys.stderr)
        return 1
    for item in result["consensus"].values():
        flag = " ⚠ 의견 불일치" if item["disagreement"] else ""
        print(f"{item['asset']}: {item['label']} (평균 {item['mean']}, {item['n']}곳){flag}")
    if args.check:
        return 0
    old = None
    if args.output.exists():
        try:
            old = json.loads(args.output.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            old = None
    if old and {k: v for k, v in old.items() if k != "generated_at"} == {k: v for k, v in result.items() if k != "generated_at"}:
        print("변화 없음")
        return 0
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"저장: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
