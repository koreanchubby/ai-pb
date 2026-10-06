#!/usr/bin/env python3
"""AI PB 뉴스·시장 데이터 수집 스크립트 (가이드 4단계, 이슈 #2 결정 반영).

GitHub Actions가 1시간마다 실행해 data/news.json을 갱신한다.
- 표준 라이브러리만 사용한다 (설치할 패키지 없음).
- 출처 하나가 실패해도 나머지는 계속 수집한다.
- 기사 원문은 저장하지 않고 제목·링크·출처·시각만 저장한다 (docs/DECISIONS.md 2026-10-03).
- API 키는 환경변수(GitHub Actions Secrets)에서만 읽는다. 키가 없으면 그 출처는 건너뛴다.

실행:  python scripts/fetch_news.py            # data/news.json 갱신
       python scripts/fetch_news.py --dry-run  # 결과만 출력
"""
from __future__ import annotations

import argparse
import datetime as dt
import email.utils
import hashlib
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"
SCHEMA_VERSION = 1
KST = dt.timezone(dt.timedelta(hours=9))
USER_AGENT = "ai-pb-news-bot/1.0 (+https://github.com/koreanchubby/ai-pb)"
TIMEOUT = 20
MAX_ITEMS = 40          # news.json에 남길 최대 기사 수
KEEP_HOURS = {"news": 72, "official": 24 * 14, "market": 24 * 7}  # 유형별 보관 시간(시간). 공식 발표 2주, 시장 지표 1주(주말·장애 대비)

# ---------------------------------------------------------------------------
# 분류 규칙: 가이드 6.1의 6개 분류 (금리, 환율, 유가, ETF, 반도체, 지정학)
# 키워드는 실무 표준(뉴스 분류 관행)이며 논문 근거가 아닌 설정값이다.
# ---------------------------------------------------------------------------
CATEGORIES: dict[str, list[str]] = {
    "rates": ["금리", "기준금리", "국채", "통화정책", "fomc", "interest rate", "rate cut", "rate hike",
              "treasury", "yield", "monetary policy", "federal funds"],
    "fx": ["환율", "원화", "달러", "원·달러", "exchange rate", "dollar", "korean won", "currency"],
    "oil": ["유가", "원유", "opec", "oil", "crude", "brent", "wti"],
    "etf": ["etf", "상장지수", "인덱스펀드", "index fund"],
    "semis": ["반도체", "삼성전자", "sk하이닉스", "엔비디아", "semiconductor", "chip", "chips", "chipmaker", "nvidia", "tsmc", "hbm"],
    "geopolitics": ["전쟁", "분쟁", "제재", "관세", "지정학", "war", "sanction", "tariff", "conflict", "geopolitic", "missile"],
}
CATEGORY_LABELS = {"rates": "금리", "fx": "환율", "oil": "유가", "etf": "ETF", "semis": "반도체", "geopolitics": "지정학"}

# 출처 유형별 기본 중요도 (공식 > 시장 데이터 > 뉴스). 가이드 6.4의 "사건 중요도 점수" 입력값.
SOURCE_WEIGHT = {"official": 3, "market": 2, "news": 1}

GDELT_QUERIES = [
    ("rates", '("interest rate" OR "central bank") (Korea OR Fed)'),
    ("fx", '("Korean won" OR "exchange rate") Korea'),
    ("oil", '("oil price" OR crude OR OPEC)'),
    ("semis", '(semiconductor OR chip) (Samsung OR "SK hynix" OR Nvidia)'),
    ("geopolitics", '(sanctions OR tariff OR war) (market OR economy)'),
]

# ---------------------------------------------------------------------------
# 공통 도구
# ---------------------------------------------------------------------------

def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:  # noqa: S310 (고정된 공개 URL만 호출)
        return resp.read()


def now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso(ts: dt.datetime) -> str:
    return ts.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _keyword_pattern(word: str) -> re.Pattern:
    """영문 키워드는 단어 단위로만 찾는다(software의 war, turmoil의 oil 같은 오분류 방지).
    한글 키워드는 조사가 붙으므로 부분 일치로 찾는다."""
    if re.fullmatch(r"[a-z0-9 .\-]+", word):
        return re.compile(r"(?<![a-z0-9])" + re.escape(word) + r"(?![a-z0-9])")
    return re.compile(re.escape(word))


_CATEGORY_PATTERNS = {key: [_keyword_pattern(w) for w in words] for key, words in CATEGORIES.items()}


def classify(text: str) -> list[str]:
    lower = text.lower()
    return [key for key, patterns in _CATEGORY_PATTERNS.items() if any(p.search(lower) for p in patterns)]


def normalize_title(title: str) -> str:
    """중복 제거용: 공백·문장부호·대소문자를 지운 제목."""
    return re.sub(r"[\W_]+", "", title.lower())


def make_item(*, title: str, url: str, source: str, source_type: str, published: dt.datetime,
              categories: list[str] | None = None, value: dict | None = None) -> dict:
    cats = categories if categories is not None else classify(title)
    item = {
        "id": "",
        "title": title.strip(),
        "url": url,
        "source": source,
        "source_type": source_type,      # official | market | news
        "published_at": iso(published),
        "categories": cats,
        "importance": 0,
        "facts": None,                   # AI 요약 단계에서 채움 (확인된 사실)
        "ai_interpretation": None,       # AI 해석
        "asset_impact": None,            # 내 자산 영향 (쉬운 말)
        "counter_evidence": None,        # 반대 근거
        "change_condition": None,        # 판단 변경 조건
    }
    if value is not None:
        item["value"] = value
    item["importance"] = importance(item)
    # id: 같은 기사(같은 URL·같은 날짜의 수치)는 매번 같은 id → 이전 AI 설명 재사용에 쓰임
    digest = hashlib.sha1(f"{url}|{(value or {}).get('date', '')}".encode("utf-8")).hexdigest()[:12]
    item["id"] = f"{source_type}-{digest}"
    return item


def importance(item: dict) -> int:
    """0~10 점. 공식 출처·여러 분류에 걸친 사건일수록 높다 (가이드 6.4 큰 사건 알림 기준의 입력값)."""
    score = SOURCE_WEIGHT.get(item["source_type"], 1) * 2
    score += min(len(item["categories"]), 2)
    value = item.get("value") or {}
    change = value.get("change")
    if isinstance(change, (int, float)):
        threshold = value.get("alert_threshold", 0)
        if threshold and abs(change) >= threshold:
            score += 2
    return max(0, min(10, score))


# ---------------------------------------------------------------------------
# 출처별 수집기. 각 함수는 item 리스트를 돌려주고, 실패하면 예외를 던진다.
# ---------------------------------------------------------------------------

def parse_rss(xml_bytes: bytes, *, source: str, source_type: str, default_categories: list[str] | None = None) -> list[dict]:
    root = ET.fromstring(xml_bytes)
    items = []
    for node in root.iter("item"):
        title = (node.findtext("title") or "").strip()
        link = (node.findtext("link") or "").strip()
        pub = node.findtext("pubDate")
        if not title or not link:
            continue
        try:
            published = email.utils.parsedate_to_datetime(pub) if pub else now_utc()
        except (TypeError, ValueError):
            published = now_utc()
        if published.tzinfo is None:
            published = published.replace(tzinfo=dt.timezone.utc)
        cats = classify(title) or list(default_categories or [])
        items.append(make_item(title=title, url=link, source=source, source_type=source_type,
                               published=published, categories=cats))
    return items


def fetch_fed(get: Callable[[str], bytes] = http_get) -> list[dict]:
    """미 연준 통화정책 보도자료 RSS (퍼블릭 도메인, 출처 표기)."""
    data = get("https://www.federalreserve.gov/feeds/press_monetary.xml")
    return parse_rss(data, source="Federal Reserve", source_type="official", default_categories=["rates"])


def parse_gdelt(json_bytes: bytes, category: str) -> list[dict]:
    text = json_bytes.decode("utf-8", errors="replace").strip() or "{}"
    if not text.startswith("{"):
        # GDELT는 호출 한도 초과 등 오류를 JSON이 아닌 일반 문장으로 돌려준다
        raise RuntimeError("GDELT 응답 오류: " + text[:120])
    payload = json.loads(text, strict=False)  # 제목 안 제어문자 허용
    items = []
    for art in payload.get("articles", []):
        title, url = art.get("title"), art.get("url")
        if not title or not url:
            continue
        seen = art.get("seendate", "")
        try:
            published = dt.datetime.strptime(seen, "%Y%m%dT%H%M%SZ").replace(tzinfo=dt.timezone.utc)
        except ValueError:
            published = now_utc()
        cats = classify(title)
        if category not in cats:
            cats = [category] + cats
        items.append(make_item(title=title, url=url, source=art.get("domain") or "GDELT",
                               source_type="news", published=published, categories=cats))
    return items


GDELT_DELAY_SECONDS = 6  # GDELT는 짧은 간격의 연속 호출을 거절한다(약 5초에 1회 권장) → 호출 사이 대기


def fetch_gdelt(get: Callable[[str], bytes] = http_get, sleep: Callable[[float], None] = time.sleep) -> list[dict]:
    """GDELT DOC 2.0 (상업 포함 무제한 이용, GDELT 인용·링크 필수).

    분류별 검색 하나가 실패해도 나머지는 살린다. 전부 실패할 때만 오류를 낸다.
    """
    items: list[dict] = []
    errors: list[str] = []
    for index, (category, query) in enumerate(GDELT_QUERIES):
        if index:
            sleep(GDELT_DELAY_SECONDS)
        params = urllib.parse.urlencode({"query": query, "mode": "artlist", "maxrecords": 15,
                                         "format": "json", "timespan": "24h", "sort": "datedesc"})
        try:
            items += parse_gdelt(get("https://api.gdeltproject.org/api/v2/doc/doc?" + params), category)
        except Exception as error:  # noqa: BLE001
            errors.append(f"{category}: {type(error).__name__}: {error}")
    if errors and len(errors) == len(GDELT_QUERIES):
        raise RuntimeError("GDELT 전체 실패 — " + " / ".join(errors))
    if errors:
        print("GDELT 일부 실패: " + " / ".join(errors), file=sys.stderr)
    return items


# 한국은행 ECOS 통계표 코드 (ECOS 개발가이드 기준).
ECOS_SERIES = [
    # (이름, 통계표, 주기, 항목코드, 분류, 단위, 알림 기준 변동폭)
    ("한국은행 기준금리", "722Y001", "D", "0101000", "rates", "%", 0.25),
    ("원/달러 환율(매매기준율)", "731Y001", "D", "0000001", "fx", "원", 15.0),
]


def parse_ecos(json_bytes: bytes, name: str, category: str, unit: str, threshold: float, table: str = "") -> list[dict]:
    payload = json.loads(json_bytes.decode("utf-8"))
    result = payload.get("RESULT")
    if result and result.get("CODE") != "INFO-200":  # INFO-200 = 해당 데이터 없음(정상)
        # 인증키 오류(INFO-100) 등은 조용히 넘기지 않고 출처 실패로 기록한다
        raise RuntimeError(f"ECOS {result.get('CODE')}: {result.get('MESSAGE')}")
    rows = (payload.get("StatisticSearch") or {}).get("row") or []
    rows = [r for r in rows if r.get("DATA_VALUE") not in (None, "")]
    if not rows:
        return []
    rows.sort(key=lambda r: r["TIME"])
    last = rows[-1]
    prev = rows[-2] if len(rows) > 1 else last
    latest, before = float(last["DATA_VALUE"]), float(prev["DATA_VALUE"])
    change = round(latest - before, 4)
    published = dt.datetime.strptime(last["TIME"][:8], "%Y%m%d").replace(tzinfo=KST)
    sign = "+" if change > 0 else ""
    change_unit = "%p" if unit == "%" else unit   # 금리 변화는 %p
    title = f"{name} {latest:g}{unit} (직전 대비 {sign}{change:g}{change_unit})"
    # ECOS는 통계표별 고정 주소가 없어 첫 화면으로 연결한다. #뒤 통계표 코드는 지표 구분용(중복 제거·교체 기준)
    url = f"https://ecos.bok.or.kr/#{table}" if table else "https://ecos.bok.or.kr/"
    return [make_item(title=title, url=url, source="한국은행 ECOS", source_type="market",
                      published=published, categories=[category],
                      value={"latest": latest, "previous": before, "change": change, "unit": unit,
                             "date": last["TIME"], "alert_threshold": threshold})]


def fetch_ecos(get: Callable[[str], bytes] = http_get) -> list[dict]:
    key = os.environ.get("ECOS_API_KEY")
    if not key:
        raise SkipSource("ECOS_API_KEY 없음")
    end = now_utc().astimezone(KST).date()
    start = end - dt.timedelta(days=14)
    items: list[dict] = []
    errors: list[str] = []
    for name, table, cycle, code, category, unit, threshold in ECOS_SERIES:
        url = (f"https://ecos.bok.or.kr/api/StatisticSearch/{key}/json/kr/1/30/{table}/{cycle}/"
               f"{start:%Y%m%d}/{end:%Y%m%d}/{code}")
        try:
            items += parse_ecos(get(url), name, category, unit, threshold, table)
        except Exception as error:  # noqa: BLE001 - 한 지표가 실패해도 다른 지표는 살린다
            errors.append(f"{table}: {type(error).__name__}: {error}")
    if errors and len(errors) == len(ECOS_SERIES):
        raise RuntimeError("ECOS 전체 실패 — " + " / ".join(errors))
    if errors:
        print("ECOS 일부 실패: " + redact(" / ".join(errors)), file=sys.stderr)
    return items


FRED_SERIES = [
    ("미국 10년물 국채금리", "DGS10", "rates", "%", 0.15),
    ("WTI 원유 가격", "DCOILWTICO", "oil", "달러", 3.0),
]


def parse_fred(json_bytes: bytes, name: str, series: str, category: str, unit: str, threshold: float) -> list[dict]:
    payload = json.loads(json_bytes.decode("utf-8"))
    obs = [o for o in payload.get("observations", []) if o.get("value") not in (None, "", ".")]
    if not obs:
        return []
    obs.sort(key=lambda o: o["date"])
    last, prev = obs[-1], obs[-2] if len(obs) > 1 else obs[-1]
    latest, before = float(last["value"]), float(prev["value"])
    change = round(latest - before, 4)
    published = dt.datetime.strptime(last["date"], "%Y-%m-%d").replace(tzinfo=dt.timezone.utc)
    sign = "+" if change > 0 else ""
    change_unit = "%p" if unit == "%" else unit
    title = f"{name} {latest:g}{unit} (직전 대비 {sign}{change:g}{change_unit})"
    return [make_item(title=title, url=f"https://fred.stlouisfed.org/series/{series}", source="FRED",
                      source_type="market", published=published, categories=[category],
                      value={"latest": latest, "previous": before, "change": change, "unit": unit,
                             "date": last["date"], "alert_threshold": threshold})]


def fetch_fred(get: Callable[[str], bytes] = http_get) -> list[dict]:
    key = os.environ.get("FRED_API_KEY")
    if not key:
        raise SkipSource("FRED_API_KEY 없음")
    start = (now_utc() - dt.timedelta(days=14)).date().isoformat()
    items: list[dict] = []
    errors: list[str] = []
    for name, series, category, unit, threshold in FRED_SERIES:
        params = urllib.parse.urlencode({"series_id": series, "api_key": key, "file_type": "json",
                                         "observation_start": start})
        try:
            items += parse_fred(get("https://api.stlouisfed.org/fred/series/observations?" + params),
                                name, series, category, unit, threshold)
        except Exception as error:  # noqa: BLE001
            errors.append(f"{series}: {type(error).__name__}: {error}")
    if errors and len(errors) == len(FRED_SERIES):
        raise RuntimeError("FRED 전체 실패 — " + " / ".join(errors))
    if errors:
        print("FRED 일부 실패: " + redact(" / ".join(errors)), file=sys.stderr)
    return items


class SkipSource(Exception):
    """키가 없는 등 의도적으로 건너뛰는 출처."""


SOURCES: list[tuple[str, Callable[..., list[dict]]]] = [
    ("Federal Reserve", fetch_fed),
    ("GDELT", fetch_gdelt),
    ("한국은행 ECOS", fetch_ecos),
    ("FRED", fetch_fred),
]

# ---------------------------------------------------------------------------
# 합치기
# ---------------------------------------------------------------------------

AI_FIELDS = ("facts", "ai_interpretation", "asset_impact", "counter_evidence", "change_condition",
             "ai_generated", "ai_attempts")
REQUIRED_KEYS = ("id", "title", "url", "source_type", "published_at", "importance", "categories")


def dedupe(items: list[dict]) -> list[dict]:
    """같은 URL 또는 거의 같은 제목(재송고)은 하나만 남긴다. 중요도가 높은 쪽, AI 설명이 있는 쪽을 우선."""
    items = sorted(items, key=lambda i: (-i["importance"], 0 if i.get("facts") else 1, i["published_at"]))
    seen_urls, seen_titles, result = set(), set(), []
    for item in items:
        key_title = normalize_title(item["title"])[:60]
        if item["url"] in seen_urls or (key_title and key_title in seen_titles):
            continue
        seen_urls.add(item["url"])
        seen_titles.add(key_title)
        result.append(item)
    return result


def merge_with_previous(new_items: list[dict], previous: dict | None, now: dt.datetime) -> list[dict]:
    """이전 news.json의 AI 요약을 재사용하고, 오래된 기사는 버린다."""
    prev_items = previous.get("items", []) if isinstance(previous, dict) else []
    prev_by_id = {i["id"]: i for i in prev_items
                  if isinstance(i, dict) and all(k in i for k in REQUIRED_KEYS)}  # 깨진 이전 항목은 무시
    merged = []
    for item in new_items:
        old = prev_by_id.get(item["id"])
        if old:
            for field in AI_FIELDS:
                if item.get(field) is None and old.get(field) is not None:
                    item[field] = old[field]
        merged.append(item)
    # 이번에 못 받은 이전 기사도 보관 시간 안이면 유지 (출처 일시 장애 대비)
    new_ids = {i["id"] for i in merged}
    new_urls = {i["url"] for i in merged}
    # 시장 데이터는 같은 지표(URL)의 새 값이 있으면 이전 값을 버린다
    merged += [old for old in prev_by_id.values()
               if old["id"] not in new_ids and not (old["source_type"] == "market" and old["url"] in new_urls)]

    def fresh(item: dict) -> bool:
        # 새로 받은 시장 데이터(일별 최신값)는 날짜와 관계없이 유지
        if item["source_type"] == "market" and item["id"] in new_ids:
            return True
        try:
            published = dt.datetime.fromisoformat(item["published_at"].replace("Z", "+00:00"))
        except ValueError:
            return False
        return published >= now - dt.timedelta(hours=KEEP_HOURS.get(item["source_type"], 72))

    merged = dedupe([i for i in merged if fresh(i)])  # 이전 회차 기사와 새 재송고 기사도 한 번 더 중복 제거
    merged.sort(key=lambda i: i["published_at"], reverse=True)   # 최신순
    merged.sort(key=lambda i: i["importance"], reverse=True)     # 중요도 우선 (안정 정렬)
    return merged[:MAX_ITEMS]


SECRET_ENV = ("ECOS_API_KEY", "FRED_API_KEY", "ANTHROPIC_API_KEY")


def redact(text: str) -> str:
    """오류 메시지에 API 키가 섞여 공개 news.json에 올라가지 않도록 가린다."""
    for name in SECRET_ENV:
        value = os.environ.get(name)
        if value and len(value) >= 6:
            text = text.replace(value, "***")
    return text


def same_content(new: dict, old: dict | None) -> bool:
    """수집 시각만 다르고 내용이 같으면 True (불필요한 커밋 방지)."""
    if not old:
        return False
    keys = ("schema_version", "demo", "items", "sources")
    return all(new.get(k) == old.get(k) for k in keys)


def build(sources=SOURCES, previous: dict | None = None, now: dt.datetime | None = None) -> dict:
    now = now or now_utc()
    collected: list[dict] = []
    status = []
    for name, fn in sources:
        try:
            got = fn()
            collected += got
            status.append({"source": name, "ok": True, "count": len(got)})
        except SkipSource as skip:
            status.append({"source": name, "ok": False, "skipped": True, "reason": str(skip)})
        except Exception as error:  # noqa: BLE001 - 출처 하나의 실패가 전체를 멈추지 않게
            status.append({"source": name, "ok": False, "reason": redact(f"{type(error).__name__}: {error}")[:200]})
    items = merge_with_previous(dedupe(collected), previous, now)
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": iso(now),
        "demo": False,
        "attribution": [
            "뉴스 헤드라인: The GDELT Project (https://www.gdeltproject.org/)",
            "미 연준 자료: Board of Governors of the Federal Reserve System",
            "This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.",
            "출처: 한국은행 경제통계시스템(ECOS)",
        ],
        "notice": "기사 원문은 저장하지 않고 제목·링크·출처·시각만 표시합니다. 투자 권유가 아닙니다.",
        "categories": CATEGORY_LABELS,
        "sources": status,
        "items": items,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="파일을 쓰지 않고 결과만 출력")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args(argv)

    previous = None
    if args.output.exists():
        try:
            previous = json.loads(args.output.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            previous = None
    if not isinstance(previous, dict):
        previous = None
    result = build(previous=previous if previous and not previous.get("demo") else None)

    ok_sources = [s for s in result["sources"] if s["ok"]]
    print(json.dumps(result["sources"], ensure_ascii=False))
    if not ok_sources:
        print("모든 출처 수집 실패: 기존 news.json을 유지합니다.", file=sys.stderr)
        return 1
    if same_content(result, previous):
        print("내용 변화 없음: news.json을 그대로 둡니다.")
        return 0
    text = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.dry_run:
        print(text)
        return 0
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8")
    print(f"저장: {args.output} ({len(result['items'])}건)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
