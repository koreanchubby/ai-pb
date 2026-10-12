#!/usr/bin/env python3
"""AI PB 예측 파이프라인 (이슈 #22, 마일스톤 8 초안).

예측 → 데이터셋 → 라벨링 → 백테스트 → 검증 순서를 한 파일에 담는다. 설명은 docs/AI_SPEC.md.

- 예측 대상: 다음 달 미국 주식(S&P 500) 월간 수익률이 0보다 클지(상승=1, 하락=0)
- 입력: FRED 공개 데이터의 월말 값(금리·장단기 금리차·유가·원/달러·주가 모멘텀)
- 모델: 로지스틱 회귀(L2). 표준 라이브러리만으로 구현 (설치할 패키지 없음, LIBRARIES.md 원칙)
- 백테스트: walk-forward. 매달 "그 시점까지 결과가 확정된 데이터"로만 다시 학습해 다음 달을 예측
- 결과: data/ai_signal.json (최신 예측 + 백테스트 지표), data/ai_signal_log.json (매달 예측 기록 → 실전 검증)
- 결과는 하우스뷰 화면의 참고 근거로만 쓰고, 비중 숫자를 정하지 않는다 (PROJECT_BRIEF 4장)

데이터 저작권: S&P 500 지수(SP500)는 S&P Dow Jones Indices 저작물이라 원자료를 저장소에 올리지 않는다.
실행할 때 받아서 data/raw/(.gitignore)에만 두고, 저장소에는 가공된 지표·예측만 남긴다.

실행:  python scripts/ai_predict.py              # 데이터 받기(5초 간격) → 학습·백테스트 → JSON 저장
       python scripts/ai_predict.py --offline    # data/raw 에 받아 둔 파일만 사용
       python scripts/ai_predict.py --dry-run    # 저장하지 않고 결과만 출력
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import math
import random
import sys
import time
import urllib.request
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUTPUT = ROOT / "data" / "ai_signal.json"
LOG = ROOT / "data" / "ai_signal_log.json"
USER_AGENT = "ai-pb-ai-bot/1.0 (+https://github.com/koreanchubby/ai-pb)"
TIMEOUT = 30
FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv?id={sid}"

# FRED 시리즈: (id, 설명). 모두 일별 → 월말 값으로 줄여 쓴다.
SERIES = {
    "SP500": "S&P 500 지수 (예측 대상)",
    "DGS10": "미국 10년 국채금리 (%)",
    "DGS3MO": "미국 3개월 국채금리 (%) — 현금 수익률로도 사용",
    "T10Y2Y": "장단기 금리차 10년-2년 (%p)",
    "DCOILWTICO": "WTI 유가 (달러/배럴)",
    "DEXKOUS": "원/달러 환율 (원)",
}

FEATURES = ["r1", "r3", "r12", "dgs10", "d_dgs10", "t10y2y", "d_tb3", "oil_r1", "fx_r1"]
FEATURE_LABELS = {
    "r1": "주가 1개월 수익률", "r3": "주가 3개월 수익률", "r12": "주가 12개월 수익률(모멘텀)",
    "dgs10": "10년 금리 수준", "d_dgs10": "10년 금리 1개월 변화", "t10y2y": "장단기 금리차",
    "d_tb3": "3개월 금리 1개월 변화", "oil_r1": "유가 1개월 수익률", "fx_r1": "원/달러 1개월 변화율",
}

MIN_TRAIN = 48          # 첫 예측 전에 필요한 학습 개월 수 (4년)
RECENT_MONTHS = 24      # 최근 구간 별도 검증 길이
SWITCH_COST = 0.001     # 주식↔현금 전환 1회 비용 0.1% (거래비용·스프레드 가정)
L2 = 1.0                # 로지스틱 회귀 규제 강도(표본이 100개 안팎이라 과적합 방지용으로 약하게 둠)
NEWTON_STEPS = 25


# ---------------------------------------------------------------------------
# 1) 데이터 받기 (차단 방지: 요청 사이 5초 이상, 오류 시 60초 뒤 1회만 재시도, 받은 파일은 재사용)
# ---------------------------------------------------------------------------

def http_get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:  # noqa: S310 (고정된 공개 URL만 호출)
        return resp.read()


def fetch_series(offline: bool = False, get: Callable[[str], bytes] = http_get,
                 sleep: Callable[[float], None] = time.sleep, today: dt.date | None = None) -> dict[str, list[tuple[dt.date, float]]]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    today = today or dt.date.today()
    out: dict[str, list[tuple[dt.date, float]]] = {}
    first_request = True
    for sid in SERIES:
        path = RAW_DIR / f"{sid}.csv"
        fresh = path.exists() and dt.date.fromtimestamp(path.stat().st_mtime) == today
        if not (offline or fresh):
            if not first_request:
                sleep(5 + random.uniform(0, 2))
            first_request = False
            url = FRED_CSV.format(sid=sid)
            try:
                body = get(url)
            except Exception as error:  # 연결 오류: 60초 쉬고 딱 한 번만 다시
                print(f"{sid} 받기 실패({error}) → 60초 뒤 한 번만 다시 시도", file=sys.stderr)
                sleep(60)
                body = get(url)  # 두 번째도 실패하면 예외가 그대로 올라가 실행을 멈춘다
            path.write_bytes(body)
        if not path.exists():
            raise FileNotFoundError(f"{path} 없음 (--offline 은 미리 받아 둔 파일이 필요)")
        out[sid] = parse_fred_csv(path.read_text(encoding="utf-8"))
    return out


def parse_fred_csv(text: str) -> list[tuple[dt.date, float]]:
    rows = []
    reader = csv.reader(io.StringIO(text))
    next(reader, None)  # 머리글(observation_date, 시리즈 id)
    for row in reader:
        if len(row) < 2 or row[1] in ("", "."):
            continue  # FRED는 휴일·결측을 "." 로 표시
        try:
            rows.append((dt.date.fromisoformat(row[0]), float(row[1])))
        except ValueError:
            continue
    return rows


# ---------------------------------------------------------------------------
# 2) 데이터셋 (월말 값) + 3) 라벨링
# ---------------------------------------------------------------------------

def month_end(series: list[tuple[dt.date, float]]) -> dict[str, float]:
    """일별 값 → {'YYYY-MM': 그 달 마지막 관측값}"""
    out: dict[str, float] = {}
    for day, value in sorted(series):
        out[day.strftime("%Y-%m")] = value
    return out


def build_dataset(raw: dict[str, list[tuple[dt.date, float]]], last_complete_month: str) -> list[dict]:
    """월별 행: 그 달 말에 알 수 있는 특징값 + 라벨(다음 달 수익률 > 0).

    미래 정보 차단: 특징은 해당 월말까지의 값만, 라벨은 다음 달 값으로 만든다.
    last_complete_month 이후(진행 중인 달)는 월말 값이 아니므로 버린다.
    """
    m = {sid: month_end(rows) for sid, rows in raw.items()}
    months = sorted(k for k in m["SP500"] if k <= last_complete_month)
    rows = []
    for i, ym in enumerate(months):
        if i < 12:
            continue
        need = ["DGS10", "DGS3MO", "T10Y2Y", "DCOILWTICO", "DEXKOUS"]
        prev, prev3, prev12 = months[i - 1], months[i - 3], months[i - 12]
        if any(ym not in m[s] or prev not in m[s] for s in need):
            continue
        sp = m["SP500"]
        row = {
            "month": ym,
            "r1": math.log(sp[ym] / sp[prev]),
            "r3": math.log(sp[ym] / sp[prev3]),
            "r12": math.log(sp[ym] / sp[prev12]),
            "dgs10": m["DGS10"][ym],
            "d_dgs10": m["DGS10"][ym] - m["DGS10"][prev],
            "t10y2y": m["T10Y2Y"][ym],
            "d_tb3": m["DGS3MO"][ym] - m["DGS3MO"][prev],
            "oil_r1": math.log(m["DCOILWTICO"][ym] / m["DCOILWTICO"][prev]) if m["DCOILWTICO"][prev] > 0 and m["DCOILWTICO"][ym] > 0 else 0.0,
            "fx_r1": m["DEXKOUS"][ym] / m["DEXKOUS"][prev] - 1,
            "cash_rate": m["DGS3MO"][ym] / 100,
            "next_return": None,
            "label": None,
        }
        if i + 1 < len(months):
            nxt = months[i + 1]
            row["next_return"] = sp[nxt] / sp[ym] - 1
            row["label"] = 1 if row["next_return"] > 0 else 0
        rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# 모델: 로지스틱 회귀 (L2, 경사하강법) — 학습 구간의 평균·표준편차로만 표준화
# ---------------------------------------------------------------------------

def sigmoid(z: float) -> float:
    if z >= 0:
        return 1 / (1 + math.exp(-z))
    e = math.exp(z)
    return e / (1 + e)


def solve(a: list[list[float]], b: list[float]) -> list[float]:
    """가우스 소거법으로 a·x = b 풀기 (작은 행렬 전용)"""
    n = len(b)
    m = [row[:] + [b[i]] for i, row in enumerate(a)]
    for col in range(n):
        piv = max(range(col, n), key=lambda r: abs(m[r][col]))
        m[col], m[piv] = m[piv], m[col]
        if abs(m[col][col]) < 1e-12:
            continue
        for r in range(n):
            if r != col:
                f = m[r][col] / m[col][col]
                m[r] = [x - f * y for x, y in zip(m[r], m[col])]
    return [m[i][n] / m[i][i] if abs(m[i][i]) > 1e-12 else 0.0 for i in range(n)]


class Logistic:
    def fit(self, X: list[list[float]], y: list[int]) -> "Logistic":
        n, k = len(X), len(X[0])
        self.mu = [sum(r[j] for r in X) / n for j in range(k)]
        self.sd = [max(1e-9, math.sqrt(sum((r[j] - self.mu[j]) ** 2 for r in X) / n)) for j in range(k)]
        Z = [[1.0] + self._scale(r) for r in X]   # 맨 앞 1.0 = 절편
        d = k + 1
        beta = [0.0] * d
        # 뉴턴법(IRLS): 몇 번 만에 수렴해 walk-forward로 수십 번 다시 학습해도 빠르다. 절편은 규제하지 않음.
        for _ in range(NEWTON_STEPS):
            grad = [0.0] * d
            hess = [[0.0] * d for _ in range(d)]
            for z, t in zip(Z, y):
                p = sigmoid(sum(bj * zj for bj, zj in zip(beta, z)))
                wgt = p * (1 - p)
                for a in range(d):
                    grad[a] += (p - t) * z[a]
                    for c in range(d):
                        hess[a][c] += wgt * z[a] * z[c]
            for a in range(1, d):
                grad[a] += L2 * beta[a]
                hess[a][a] += L2
            step = solve(hess, grad)
            beta = [bj - sj for bj, sj in zip(beta, step)]
            if max(abs(s) for s in step) < 1e-8:
                break
        self.b, self.w = beta[0], beta[1:]
        return self

    def _scale(self, r: list[float]) -> list[float]:
        return [(v - m) / s for v, m, s in zip(r, self.mu, self.sd)]

    def predict_proba(self, r: list[float]) -> float:
        return sigmoid(self.b + sum(w * z for w, z in zip(self.w, self._scale(r))))


def features(row: dict) -> list[float]:
    return [row[f] for f in FEATURES]


# ---------------------------------------------------------------------------
# 4) 백테스트 (walk-forward) + 5) 검증 지표
# ---------------------------------------------------------------------------

def walk_forward(rows: list[dict], min_train: int = MIN_TRAIN) -> list[dict]:
    """rows[i]를 예측할 때는 rows[0..i-1]만 학습(그 라벨은 i 시점에 이미 확정)."""
    labeled = [r for r in rows if r["label"] is not None]
    preds = []
    for i in range(min_train, len(labeled)):
        train = labeled[:i]
        model = Logistic().fit([features(r) for r in train], [r["label"] for r in train])
        p = model.predict_proba(features(labeled[i]))
        preds.append({"month": labeled[i]["month"], "p_up": p, "label": labeled[i]["label"],
                      "next_return": labeled[i]["next_return"], "cash_rate": labeled[i]["cash_rate"],
                      "train_up_rate": sum(r["label"] for r in train) / len(train)})
    return preds


def auc(scores: list[float], labels: list[int]) -> float | None:
    pos = [s for s, t in zip(scores, labels) if t == 1]
    neg = [s for s, t in zip(scores, labels) if t == 0]
    if not pos or not neg:
        return None
    wins = sum((p > q) + 0.5 * (p == q) for p in pos for q in neg)
    return wins / (len(pos) * len(neg))


def evaluate(preds: list[dict]) -> dict:
    if not preds:
        return {"months": 0}
    n = len(preds)
    hits = sum((p["p_up"] > 0.5) == (p["label"] == 1) for p in preds)
    always_up = sum(p["label"] for p in preds)
    majority = sum((p["train_up_rate"] >= 0.5) == (p["label"] == 1) for p in preds)
    brier = sum((p["p_up"] - p["label"]) ** 2 for p in preds) / n

    def equity(strategy: bool) -> tuple[list[float], list[float]]:
        value, values, rets, invested = 1.0, [1.0], [], None
        for p in preds:
            hold = p["p_up"] > 0.5 if strategy else True
            r = p["next_return"] if hold else p["cash_rate"] / 12
            if strategy and invested is not None and hold != invested:
                r -= SWITCH_COST
            invested = hold
            value *= 1 + r
            values.append(value)
            rets.append(r)
        return values, rets

    def stats(values: list[float], rets: list[float]) -> dict:
        years = len(rets) / 12
        cagr = values[-1] ** (1 / years) - 1 if years > 0 else 0.0
        mean = sum(rets) / len(rets)
        vol = math.sqrt(sum((r - mean) ** 2 for r in rets) / max(1, len(rets) - 1)) * math.sqrt(12)
        excess = [r - p["cash_rate"] / 12 for r, p in zip(rets, preds)]
        ex_mean = sum(excess) / len(excess)
        ex_sd = math.sqrt(sum((e - ex_mean) ** 2 for e in excess) / max(1, len(excess) - 1))
        peak, mdd = values[0], 0.0
        for v in values:
            peak = max(peak, v)
            mdd = min(mdd, v / peak - 1)
        return {"cagr": round(cagr, 4), "volatility": round(vol, 4),
                "sharpe": round(ex_mean / ex_sd * math.sqrt(12), 2) if ex_sd > 0 else None,
                "max_drawdown": round(mdd, 4), "total_return": round(values[-1] - 1, 4)}

    sv, sr = equity(True)
    bv, br = equity(False)
    return {
        "months": n, "from": preds[0]["month"], "to": preds[-1]["month"],
        "accuracy": round(hits / n, 3),
        "baseline_always_up": round(always_up / n, 3),
        "baseline_majority": round(majority / n, 3),
        "auc": None if auc([p["p_up"] for p in preds], [p["label"] for p in preds]) is None
               else round(auc([p["p_up"] for p in preds], [p["label"] for p in preds]), 3),
        "brier": round(brier, 3),
        "months_in_market": sum(p["p_up"] > 0.5 for p in preds),
        "strategy": stats(sv, sr),
        "buy_and_hold": stats(bv, br),
    }


# ---------------------------------------------------------------------------
# 최신 예측 + 실전 검증 기록
# ---------------------------------------------------------------------------

def latest_prediction(rows: list[dict]) -> dict:
    labeled = [r for r in rows if r["label"] is not None]
    model = Logistic().fit([features(r) for r in labeled], [r["label"] for r in labeled])
    last = rows[-1]
    p = model.predict_proba(features(last))
    contrib = sorted(((f, w) for f, w in zip(FEATURES, model.w)), key=lambda x: -abs(x[1]))
    return {
        "as_of_month": last["month"],
        "target_month": next_month(last["month"]),
        "p_up": round(p, 3),
        "signal": "상승 우위" if p >= 0.55 else "하락 우위" if p <= 0.45 else "중립",
        "top_factors": [{"feature": f, "label": FEATURE_LABELS[f], "weight": round(w, 3)} for f, w in contrib[:3]],
        "train_months": len(labeled),
    }


def next_month(ym: str) -> str:
    y, m = map(int, ym.split("-"))
    return f"{y + (m == 12)}-{1 if m == 12 else m + 1:02d}"


def update_log(log: list[dict], latest: dict, rows: list[dict]) -> list[dict]:
    """매달 예측을 남기고, 결과가 확정된 지난 예측에는 실제 결과를 채운다(실전 검증)."""
    actual = {next_month(r["month"]): r["label"] for r in rows if r["label"] is not None}
    by_target = {e["target_month"]: e for e in log}
    if latest["target_month"] not in by_target:
        by_target[latest["target_month"]] = {"target_month": latest["target_month"], "as_of_month": latest["as_of_month"],
                                             "p_up": latest["p_up"], "actual_up": None}
    for e in by_target.values():
        if e.get("actual_up") is None and e["target_month"] in actual:
            e["actual_up"] = actual[e["target_month"]]
            e["hit"] = (e["p_up"] > 0.5) == (e["actual_up"] == 1)
    return sorted(by_target.values(), key=lambda e: e["target_month"])


def last_complete_month(today: dt.date) -> str:
    first = today.replace(day=1)
    return (first - dt.timedelta(days=1)).strftime("%Y-%m")


def run(raw: dict, today: dt.date) -> tuple[dict, list[dict]]:
    rows = build_dataset(raw, last_complete_month(today))
    if len([r for r in rows if r["label"] is not None]) < MIN_TRAIN + 12:
        raise RuntimeError(f"학습 데이터 부족: 라벨 있는 달 {len(rows)}개")
    preds = walk_forward(rows)
    latest = latest_prediction(rows)
    result = {
        "schema_version": 1,
        "generated_at": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "model": {"type": "logistic_regression_l2", "features": FEATURES, "min_train_months": MIN_TRAIN,
                  "switch_cost": SWITCH_COST, "threshold": 0.5},
        "data": {"source": "FRED (St. Louis Fed)", "series": SERIES, "months": len(rows),
                 "from": rows[0]["month"], "to": rows[-1]["month"]},
        "latest": latest,
        "backtest": {"all": evaluate(preds), "recent": evaluate(preds[-RECENT_MONTHS:])},
        "disclaimer": "이 예측은 과거 거시지표로 만든 통계 모형의 참고 신호이며 투자 권유가 아닙니다. "
                      "과거 백테스트 성과는 미래 수익을 보장하지 않으며, 실제 투자 결정은 담당 PB와 상담 후 하세요.",
    }
    return result, rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()
    today = dt.date.today()
    raw = fetch_series(offline=args.offline, today=today)
    result, rows = run(raw, today)
    text = json.dumps(result, ensure_ascii=False, indent=2)
    if args.dry_run:
        print(text)
        return 0
    OUTPUT.write_text(text + "\n", encoding="utf-8")
    log = json.loads(LOG.read_text(encoding="utf-8")) if LOG.exists() else []
    LOG.write_text(json.dumps(update_log(log, result["latest"], rows), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    b = result["backtest"]["all"]
    print(f"최신 예측 {result['latest']['target_month']}: 상승 확률 {result['latest']['p_up']} ({result['latest']['signal']}) | "
          f"백테스트 {b['months']}개월 정확도 {b['accuracy']} (항상 상승 {b['baseline_always_up']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
