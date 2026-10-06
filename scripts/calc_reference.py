#!/usr/bin/env python3
"""app.js 핵심 계산을 Python으로 다시 구현한 '참조 모델' (재현용).

목적
- 교수님 지침(재현 가능한 계산)에 맞춰, 화면 코드(app.js)와 독립적으로 같은 결과가 나오는지 확인한다.
- 데모 고객 결과는 docs/CALC_EXAMPLES.md에 손계산과 함께 정리되어 있고, tests/test_calc_reference.py가 대조한다.
- app.js의 공식이나 상수를 바꾸면 이 파일도 같이 바꾼다(DECISIONS 기록).

실행: python scripts/calc_reference.py  → 데모 고객 계산 결과를 출력
"""
from __future__ import annotations

import json
import math

# ---- app.js 상수와 같은 값 (2026-10-04 기준, PR #7 + 보완 커밋) ----
PROFILES = {
    1: {"name": "안정형", "mix": {"equity": 0.15, "bond": 0.65, "alt": 0.05, "cash": 0.15}, "equity_cap": 20},
    2: {"name": "안정추구형", "mix": {"equity": 0.35, "bond": 0.50, "alt": 0.08, "cash": 0.07}, "equity_cap": 35},
    3: {"name": "위험중립형", "mix": {"equity": 0.55, "bond": 0.32, "alt": 0.10, "cash": 0.03}, "equity_cap": 50},
    4: {"name": "적극투자형", "mix": {"equity": 0.70, "bond": 0.18, "alt": 0.10, "cash": 0.02}, "equity_cap": 70},
    5: {"name": "공격투자형", "mix": {"equity": 0.85, "bond": 0.05, "alt": 0.10, "cash": 0.0}, "equity_cap": 90},
}
SURVEY_CUTS = (20, 28, 37, 45)          # 이하이면 1, 2, 3, 4단계 (권고안: 19, 28, 36, 45)
ASSUMPTIONS = {                          # 변동성, 기대수익, 스트레스 손실, 과세 분배율 (%)
    "kretf": (18, 6.0, -32, 2.0),
    "globaletf": (16, 6.8, -30, 1.5),
    "govbond": (5, 3.0, 3, 3.0),
    "corpbond": (6, 3.8, -4, 4.0),
    "alternative": (13, 4.5, -15, 2.0),
    "pef": (18, 8.0, -25, 0.0),
    "cash": (0.5, 2.6, 0, 3.0),
}
LOW_COUPON_INCOME = 1.5
TAA_TILT = 0.02
BAND = 0.3
TRADE_KEYS = ["kretf", "globaletf", "govbond", "corpbond", "alternative", "pef", "cash"]


def round1(x: float) -> float:
    """JS Math.round(x*10)/10 와 같게(0.5는 올림)."""
    return math.floor(x * 10 + 0.5) / 10


# ---- 성향 ----
def age_score(age: int) -> int:
    return 5 if age < 40 else 4 if age < 50 else 3 if age < 60 else 2 if age < 70 else 1


def survey_level(age: int, answer_points: list[int], loss_point: int, cuts=SURVEY_CUTS) -> dict:
    score = age_score(age) + sum(answer_points)
    declared = next((i + 1 for i, c in enumerate(cuts) if score <= c), 5)
    return {"score": score, "declared": declared, "loss": loss_point, "level": min(declared, loss_point)}


# ---- 은퇴 버킷 (만원/월 → 억원) ----
def retirement_buckets(spend: float, pension: float) -> dict:
    gap = max(0.0, spend - pension)
    emergency = spend * 6 / 10000
    bucket1 = gap * 24 / 10000 + emergency
    bucket2 = gap * 60 / 10000
    return {"gap": gap, "emergency": emergency, "bucket1": bucket1, "bucket2": bucket2}


# ---- 상속 ----
def legal_shares(spouse: int, children: int) -> list[float]:
    weights = ([1.5] if spouse else []) + [1.0] * children
    total = sum(weights)
    return [w / total * 100 for w in weights]


def inheritance_tax_rate(base: float) -> float:
    if base <= 1:
        return base * 0.1
    if base <= 5:
        return base * 0.2 - 0.1
    if base <= 10:
        return base * 0.3 - 0.6
    if base <= 30:
        return base * 0.4 - 1.6
    return base * 0.5 - 4.6


def estimate_estate_tax(net: float, financial: float, spouse_share_pct: float | None, spouse_legal_pct: float | None) -> dict:
    lump = 5.0
    spouse = 0.0
    if spouse_share_pct is not None:
        spouse = max(5.0, min(net * spouse_share_pct / 100, net * spouse_legal_pct / 100, 30.0))
    if financial <= 0.2:
        fin = financial
    elif financial <= 1:
        fin = 0.2
    else:
        fin = min(2.0, financial * 0.2)
    base = max(0.0, net - lump - spouse - fin)
    tax = round1(max(0.0, inheritance_tax_rate(base)) * 0.97)
    return {"lump": lump, "spouse": spouse, "financial": fin, "base": base, "tax": tax}


# ---- 포트폴리오 ----
def corr(a: str, b: str) -> float:
    risky = {"kretf", "globaletf", "corpbond", "alternative", "pef"}
    if a == b:
        return 1.0
    if "cash" in (a, b):
        return 0.0
    if "govbond" in (a, b):
        return -0.2 if ("etf" in a or "etf" in b) else 0.2
    if a in risky and b in risky:
        return 0.8 if ("etf" in a and "etf" in b) else 0.5
    return 0.0


def portfolio_stats(h: dict) -> dict:
    total = sum(h.get(k, 0) for k in ASSUMPTIONS)
    w = {k: h.get(k, 0) / total for k in ASSUMPTIONS}
    var = sum(w[a] * w[b] * ASSUMPTIONS[a][0] * ASSUMPTIONS[b][0] * corr(a, b) for a in ASSUMPTIONS for b in ASSUMPTIONS)
    return {"vol": math.sqrt(var), "ret": sum(w[k] * ASSUMPTIONS[k][1] for k in w),
            "stress": sum(w[k] * ASSUMPTIONS[k][2] for k in w), "equity_pct": (w["kretf"] + w["globaletf"]) * 100}


def financial_income(h: dict, current_govbond: float, low_coupon: bool) -> float:
    income = 0.0
    for k, (_, _, _, rate) in ASSUMPTIONS.items():
        if k == "govbond" and low_coupon:
            kept = min(current_govbond, h["govbond"])
            added = max(0.0, h["govbond"] - current_govbond)
            income += kept * rate / 100 + added * LOW_COUPON_INCOME / 100
        else:
            income += h.get(k, 0) * rate / 100
    return income


def compute_plan(a: dict, level: int, buckets: dict, estate_need: float, *, retirement: bool = True,
                 use_taa: bool = False, use_band: bool = True) -> dict:
    financial = sum(a[k] for k in ("kretf", "globaletf", "govbond", "corpbond", "pef", "alternative", "cash"))
    investable = financial - a["pef"]
    cash_floor = buckets["bucket1"] if retirement else buckets["emergency"]
    bond_floor = (buckets["bucket2"] if retirement else 0) + estate_need
    floor_total = cash_floor + bond_floor
    if floor_total > investable and floor_total > 0:
        scale = investable / floor_total
        cash_floor *= scale
        bond_floor *= scale
    pool = max(0.0, investable - cash_floor - bond_floor)
    mix = PROFILES[level]["mix"]
    equity = pool * mix["equity"]
    raw = {"kretf": equity * 0.3, "globaletf": equity * 0.7, "govbond": bond_floor + pool * mix["bond"] * 0.5,
           "corpbond": pool * mix["bond"] * 0.5, "alternative": pool * mix["alt"], "pef": a["pef"],
           "cash": cash_floor + pool * mix["cash"]}
    saa = {k: (a["pef"] if k == "pef" else round1(raw[k])) for k in TRADE_KEYS if k != "cash"}
    saa["cash"] = max(0.0, round1(financial - sum(saa.values())))
    if use_taa:
        tilt = round1(min(TAA_TILT * financial, raw["globaletf"]))
        raw["globaletf"] -= tilt
        raw["govbond"] += round1(tilt / 2)
        raw["cash"] += round1(tilt - round1(tilt / 2))
    target, skipped, net_trade = {}, [], 0.0
    for k in TRADE_KEYS:
        if k == "cash":
            continue
        value = a["pef"] if k == "pef" else round1(raw[k])
        diff = abs(value - a[k])
        if use_band and k != "pef" and 0 < diff < BAND:
            value = a[k]
            skipped.append(k)
        target[k] = value
        net_trade += value - a[k]
    target["cash"] = max(0.0, round1(a["cash"] - net_trade))
    current = {k: a[k] for k in TRADE_KEYS}
    return {"financial": financial, "investable": investable, "cash_floor": cash_floor, "bond_floor": bond_floor,
            "pool": pool, "saa": saa, "target": target, "skipped": skipped,
            "turnover": sum(abs(target[k] - current[k]) for k in TRADE_KEYS) / 2,
            "stats_now": portfolio_stats(current), "stats_target": portfolio_stats(target),
            "income_now": financial_income(current, a["govbond"], False),
            "income_target": financial_income(target, a["govbond"], True)}


# ---- 데모 고객 (app.js 기본값) ----
DEMO = {
    "age": 62,
    "answer_points": [5, 4, 4, 3, 4, 1, 3, 3, 3, 3],   # DEMO_ANSWERS가 고른 선택지의 점수
    "loss_point": 3,                                      # 9번 문항(손실 감내) 점수
    "spend": 500, "pension": 280,
    "spouse": 1, "children": 2, "desired_shares": [40, 35, 25],
    "assets": {"realestate": 25, "kretf": 4, "globaletf": 6, "govbond": 3, "corpbond": 2, "pef": 4,
               "alternative": 2, "cash": 4, "debt": 3},
}


def demo() -> dict:
    d = DEMO
    profile = survey_level(d["age"], d["answer_points"], d["loss_point"])
    buckets = retirement_buckets(d["spend"], d["pension"])
    a = d["assets"]
    financial = sum(v for k, v in a.items() if k not in ("realestate", "debt"))
    net = financial + a["realestate"] - a["debt"]
    legal = legal_shares(d["spouse"], d["children"])
    estate = estimate_estate_tax(net, financial, d["desired_shares"][0], legal[0])
    plan = compute_plan(a, profile["level"], buckets, estate["tax"])
    return {"profile": profile, "buckets": buckets, "net": net, "legal_shares": legal, "estate": estate, "plan": plan}


if __name__ == "__main__":
    print(json.dumps(demo(), ensure_ascii=False, indent=2))
