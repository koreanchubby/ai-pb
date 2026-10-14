#!/usr/bin/env python3
"""데일리 시황용 국내 뉴스 후보 목록 (내 PC에서만 실행, 결과는 GitHub에 올리지 않음).

한국투자증권 Open API '종합 시황/공시(제목)'에서 최근 기사 제목을 받아, 금융·시장 관련 제목만 골라 보여 준다.
- 제목은 시황을 쓸 때 '무슨 기사를 원문으로 찾아볼지' 정하는 후보로만 쓴다.
  앱 화면이나 저장소에는 올리지 않는다(뉴스 재배포 금지, docs/DECISIONS.md 2026-10-14).
- 응답에 기사 링크가 없으므로, 시황에 쓰려면 원문을 직접 찾아 날짜를 확인한다.
- 키는 환경변수나 저장소 루트의 .env(KIS_APP_KEY, KIS_APP_SECRET, KIS_ENV)에서 읽는다.
- 결과와 접근 토큰은 .local/ 폴더(.gitignore)에만 저장한다. 토큰은 만료 전까지 다시 쓴다.

실행:  python scripts/kis_news_candidates.py --morning    # 아침 시황: 전날 15:30 ~ 오늘 08:00
       python scripts/kis_news_candidates.py --afternoon  # 오후 시황: 오늘 08:00 ~ 16:00
       python scripts/kis_news_candidates.py              # 최근 3시간 (--hours로 조절)
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fetch_news as fn  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / ".local"
TOKEN_FILE = LOCAL / "kis_token.json"

# 금융·시장 관련 제목만 남기는 단어 (fetch_news 분류 단어 + 국내 시황에서 자주 쓰는 말). 설정값이며 논문 근거 아님.
MARKET_WORDS = sorted({w for words in fn.CATEGORIES.values() for w in words} | {
    "코스피", "코스닥", "증시", "주가", "지수", "외국인", "순매수", "순매도", "연준", "한은", "한국은행",
    "물가", "cpi", "고용", "수출", "무역", "채권", "금값", "달러", "엔화", "위안", "나스닥", "다우", "s&p",
    "실적", "영업이익", "경기 침체", "경기침체", "성장률", "gdp", "부동산", "가계부채", "빚투", "공매도"})
# 후보를 받을 언론사 (한국투자증권 API의 제공처 코드, 2026-10-14 응답에서 확인). 종합·경제 통신·신문 위주.
PROVIDERS = [("6", "연합뉴스"), ("2", "한국경제신문"), ("A", "매일경제"), ("L", "한국투자증권")]


def load_env() -> None:
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())


def token(base: str) -> str:
    now = dt.datetime.now()
    if TOKEN_FILE.exists():
        cached = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
        if cached.get("base") == base and dt.datetime.fromisoformat(cached["expires"]) > now + dt.timedelta(minutes=10):
            return cached["token"]
    got = fn.kis_request("POST", base + "/oauth2/tokenP", {"content-type": "application/json"},
                         {"grant_type": "client_credentials", "appkey": os.environ["KIS_APP_KEY"],
                          "appsecret": os.environ["KIS_APP_SECRET"]})
    if not got.get("access_token"):
        raise SystemExit("접근 토큰 발급 실패: " + fn.redact(str(got.get("error_description") or got))[:200])
    expires = got.get("access_token_token_expired") or (now + dt.timedelta(hours=23)).strftime("%Y-%m-%d %H:%M:%S")
    LOCAL.mkdir(exist_ok=True)
    TOKEN_FILE.write_text(json.dumps({"base": base, "token": got["access_token"],
                                      "expires": dt.datetime.strptime(expires, "%Y-%m-%d %H:%M:%S").isoformat()}),
                          encoding="utf-8")
    return got["access_token"]


def is_market(title: str) -> bool:
    lowered = title.lower()
    return any(word in lowered for word in MARKET_WORDS)


def window(args: argparse.Namespace, now: dt.datetime) -> tuple[dt.datetime, dt.datetime]:
    """아침 시황: 전날 15:30(국내 장 마감) ~ 오늘 08:00 / 오후 시황: 오늘 08:00 ~ 16:00."""
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if args.afternoon:
        return today.replace(hour=8), today.replace(hour=16)
    if args.morning:
        prev = today - dt.timedelta(days=3 if today.weekday() == 0 else 1)   # 월요일은 금요일 장 마감부터
        return prev.replace(hour=15, minute=30), today.replace(hour=8)
    return now - dt.timedelta(hours=args.hours), now


def fetch_provider(base: str, headers: dict, code: str, since: dt.datetime, until: dt.datetime,
                   max_pages: int) -> list[dict]:
    """한 언론사의 제목을 until부터 since까지 거꾸로 넘겨 가며 받는다 (한 번에 40건)."""
    rows, cursor = [], until
    for _ in range(max_pages):
        params = {k: "" for k in ("FID_NEWS_OFER_ENTP_CODE", "FID_COND_MRKT_CLS_CODE", "FID_INPUT_ISCD",
                                  "FID_TITL_CNTT", "FID_INPUT_DATE_1", "FID_INPUT_HOUR_1",
                                  "FID_RANK_SORT_CLS_CODE", "FID_INPUT_SRNO")}
        params.update(FID_NEWS_OFER_ENTP_CODE=code, FID_INPUT_DATE_1=cursor.strftime("%Y%m%d"),
                      FID_INPUT_HOUR_1=cursor.strftime("%H%M%S"))
        time.sleep(1.1)   # 모의투자 서버는 초당 요청 수가 적다
        payload = fn.kis_request("GET", base + "/uapi/domestic-stock/v1/quotations/news-title?"
                                 + urllib.parse.urlencode(params), headers)
        if payload.get("rt_cd") not in (None, "0"):
            raise SystemExit(f"조회 실패({code}): {payload.get('msg_cd')} {payload.get('msg1')}")
        page = payload.get("output") or []
        if not page:
            break
        for row in page:
            at = dt.datetime.strptime(row["data_dt"] + row["data_tm"], "%Y%m%d%H%M%S").replace(tzinfo=fn.KST)
            if since <= at <= until:
                rows.append((at, row))
        oldest = dt.datetime.strptime(page[-1]["data_dt"] + page[-1]["data_tm"], "%Y%m%d%H%M%S").replace(tzinfo=fn.KST)
        if oldest <= since or oldest >= cursor:
            break
        cursor = oldest - dt.timedelta(seconds=1)
    return rows


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--morning", action="store_true", help="아침 시황: 전날 15:30 ~ 오늘 08:00")
    group.add_argument("--afternoon", action="store_true", help="오후 시황: 오늘 08:00 ~ 16:00")
    parser.add_argument("--hours", type=float, default=3, help="기간을 안 정하면 최근 몇 시간 (기본 3)")
    parser.add_argument("--max-pages", type=int, default=10, help="언론사별 최대 쪽수(쪽당 40건)")
    parser.add_argument("--all", action="store_true", help="금융 단어로 거르지 않음")
    args = parser.parse_args(argv)

    load_env()
    if not fn.kis_configured():
        print(".env에 KIS_APP_KEY·KIS_APP_SECRET이 없습니다.", file=sys.stderr)
        return 1
    base = fn.kis_base()   # 기본값 mock (fetch_news.KIS_DEFAULT_ENV)
    headers = {"content-type": "application/json; charset=utf-8", "authorization": "Bearer " + token(base),
               "appkey": os.environ["KIS_APP_KEY"], "appsecret": os.environ["KIS_APP_SECRET"],
               "tr_id": "FHKST01011800", "custtype": "P"}
    since, until = window(args, dt.datetime.now(fn.KST))
    print(f"기간: {since:%m/%d %H:%M} ~ {until:%m/%d %H:%M} (KST)")

    picked, seen, total = [], set(), 0
    for code, name in PROVIDERS:
        rows = fetch_provider(base, headers, code, since, until, args.max_pages)
        total += len(rows)
        for at, row in rows:
            title = (row.get("hts_pbnt_titl_cntt") or "").strip()
            key = fn.normalize_title(title)[:40]
            if not title or key in seen or (not args.all and not is_market(title)):
                continue
            seen.add(key)
            picked.append({"at": at.isoformat(), "provider": name, "title": title, "categories": fn.classify(title)})
    picked.sort(key=lambda i: i["at"], reverse=True)

    print(f"받은 제목 {total}건 중 후보 {len(picked)}건 (원문은 직접 찾아 날짜 확인 후 사용)")
    for item in picked:
        print(f"{item['at'][5:16].replace('T', ' ')}  [{item['provider']}] {item['title']}")
    LOCAL.mkdir(exist_ok=True)
    out = LOCAL / f"news_candidates_{dt.datetime.now(fn.KST):%Y%m%d_%H%M}.json"
    out.write_text(json.dumps(picked, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"저장: {out.relative_to(ROOT)} (GitHub에 올라가지 않음)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
