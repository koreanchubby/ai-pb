"""AI 예측 파이프라인(scripts/ai_predict.py) 테스트 — 네트워크 없이 합성 데이터로 확인."""
import datetime as dt
import math
import random
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import ai_predict as ap  # noqa: E402


def synthetic_raw(months: int = 90, seed: int = 1) -> dict:
    """월말 하루씩만 있는 가짜 시계열 (FRED와 같은 모양)."""
    rnd = random.Random(seed)
    raw = {sid: [] for sid in ap.SERIES}
    sp, oil, fx = 2000.0, 60.0, 1100.0
    for i in range(months):
        y, m = 2015 + (i // 12), i % 12 + 1
        first_next = dt.date(y + (m == 12), 1 if m == 12 else m + 1, 1)
        day = first_next - dt.timedelta(days=1)   # 그 달 말일
        sp *= 1 + rnd.gauss(0.008, 0.04)
        oil *= 1 + rnd.gauss(0, 0.08)
        fx *= 1 + rnd.gauss(0, 0.02)
        raw["SP500"].append((day, sp))
        raw["DGS10"].append((day, 2 + rnd.random()))
        raw["DGS3MO"].append((day, 1 + rnd.random()))
        raw["T10Y2Y"].append((day, rnd.gauss(0.5, 0.3)))
        raw["DCOILWTICO"].append((day, oil))
        raw["DEXKOUS"].append((day, fx))
    return raw


class ParseTests(unittest.TestCase):
    def test_fred_csv_skips_missing_dot(self):
        rows = ap.parse_fred_csv("observation_date,DGS10\n2026-01-02,4.1\n2026-01-03,.\n2026-01-05,4.2\n")
        self.assertEqual(rows, [(dt.date(2026, 1, 2), 4.1), (dt.date(2026, 1, 5), 4.2)])

    def test_month_end_takes_last_observation(self):
        m = ap.month_end([(dt.date(2026, 1, 30), 2.0), (dt.date(2026, 1, 5), 1.0), (dt.date(2026, 2, 2), 3.0)])
        self.assertEqual(m, {"2026-01": 2.0, "2026-02": 3.0})


class DatasetTests(unittest.TestCase):
    def setUp(self):
        self.raw = synthetic_raw()
        months = sorted(ap.month_end(self.raw["SP500"]))
        self.last = months[-1]
        self.rows = ap.build_dataset(self.raw, self.last)

    def test_label_is_next_month_return(self):
        sp = ap.month_end(self.raw["SP500"])
        row = self.rows[5]
        nxt = ap.next_month(row["month"])
        self.assertAlmostEqual(row["next_return"], sp[nxt] / sp[row["month"]] - 1)
        self.assertEqual(row["label"], 1 if row["next_return"] > 0 else 0)

    def test_last_row_has_no_label(self):
        self.assertIsNone(self.rows[-1]["label"])
        self.assertEqual(self.rows[-1]["month"], self.last)

    def test_incomplete_month_is_dropped(self):
        months = sorted(ap.month_end(self.raw["SP500"]))
        rows = ap.build_dataset(self.raw, months[-2])
        self.assertEqual(rows[-1]["month"], months[-2])

    def test_features_use_only_past(self):
        sp = ap.month_end(self.raw["SP500"])
        row = self.rows[10]
        y, m = map(int, row["month"].split("-"))
        prev = f"{y - (m == 1)}-{12 if m == 1 else m - 1:02d}"
        self.assertAlmostEqual(row["r1"], math.log(sp[row["month"]] / sp[prev]))


class ModelTests(unittest.TestCase):
    def test_logistic_learns_separable_signal(self):
        rnd = random.Random(3)
        X = [[rnd.gauss(0, 1), rnd.gauss(0, 1)] for _ in range(200)]
        y = [1 if x[0] > 0 else 0 for x in X]
        model = ap.Logistic().fit(X, y)
        acc = sum((model.predict_proba(x) > 0.5) == (t == 1) for x, t in zip(X, y)) / len(X)
        self.assertGreater(acc, 0.9)
        self.assertGreater(abs(model.w[0]), abs(model.w[1]))

    def test_solve(self):
        x = ap.solve([[2.0, 1.0], [1.0, 3.0]], [3.0, 5.0])
        self.assertAlmostEqual(x[0], 0.8)
        self.assertAlmostEqual(x[1], 1.4)


class BacktestTests(unittest.TestCase):
    def setUp(self):
        raw = synthetic_raw()
        self.rows = ap.build_dataset(raw, sorted(ap.month_end(raw["SP500"]))[-1])

    def test_walk_forward_has_no_lookahead(self):
        """i번째 예측은 i 이후 라벨을 바꿔도 그대로여야 한다."""
        base = ap.walk_forward(self.rows, min_train=30)
        changed = [dict(r) for r in self.rows]
        labeled_idx = [i for i, r in enumerate(changed) if r["label"] is not None]
        cut = labeled_idx[40]
        for i in labeled_idx[41:]:
            changed[i]["label"] = 1 - changed[i]["label"]
        after = ap.walk_forward(changed, min_train=30)
        k = 40 - 30  # cut 위치의 예측 번호
        for a, b in zip(base[: k + 1], after[: k + 1]):
            self.assertAlmostEqual(a["p_up"], b["p_up"])
        self.assertEqual(base[k]["month"], changed[cut]["month"])

    def test_buy_and_hold_total_return(self):
        preds = ap.walk_forward(self.rows, min_train=30)
        expected = 1.0
        for p in preds:
            expected *= 1 + p["next_return"]
        result = ap.evaluate(preds)
        self.assertAlmostEqual(result["buy_and_hold"]["total_return"], round(expected - 1, 4))
        self.assertEqual(result["months"], len(preds))

    def test_always_in_market_strategy_matches_buy_and_hold(self):
        preds = [dict(p, p_up=0.9) for p in ap.walk_forward(self.rows, min_train=30)]
        result = ap.evaluate(preds)
        self.assertEqual(result["strategy"], result["buy_and_hold"])

    def test_run_produces_signal_and_disclaimer(self):
        raw = synthetic_raw(months=100)
        today = dt.date(2023, 6, 15)
        result, rows = ap.run(raw, today)
        self.assertTrue(0 <= result["latest"]["p_up"] <= 1)
        self.assertIn("투자 권유가 아닙니다", result["disclaimer"])
        self.assertEqual(result["latest"]["target_month"], ap.next_month(result["latest"]["as_of_month"]))


class LogTests(unittest.TestCase):
    def test_update_log_fills_actual_later(self):
        rows = [{"month": "2026-08", "label": 1}, {"month": "2026-09", "label": None}]
        log = ap.update_log([], {"target_month": "2026-09", "as_of_month": "2026-08", "p_up": 0.7}, rows)
        self.assertEqual(log[0]["actual_up"], 1)
        self.assertTrue(log[0]["hit"])
        log = ap.update_log(log, {"target_month": "2026-10", "as_of_month": "2026-09", "p_up": 0.4}, rows)
        self.assertEqual(len(log), 2)
        self.assertIsNone(log[1]["actual_up"])


class FetchTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(__file__).resolve().parent / "_tmp_raw"
        self.tmp.mkdir(exist_ok=True)
        self._old = ap.RAW_DIR
        ap.RAW_DIR = self.tmp
        for f in self.tmp.glob("*.csv"):
            f.unlink()

    def tearDown(self):
        for f in self.tmp.glob("*.csv"):
            f.unlink()
        self.tmp.rmdir()
        ap.RAW_DIR = self._old

    def test_waits_between_requests_and_retries_once(self):
        calls, sleeps = [], []
        failed = {"DGS10": 1}

        def fake_get(url):
            sid = url.split("id=")[1]
            calls.append(sid)
            if failed.get(sid):
                failed[sid] -= 1
                raise OSError("down")
            return b"observation_date,X\n2026-01-30,1.0\n"

        ap.fetch_series(get=fake_get, sleep=sleeps.append, today=dt.date(2026, 2, 1))
        self.assertEqual(calls.count("DGS10"), 2)                 # 한 번만 다시
        self.assertIn(60, sleeps)                                  # 60초 쉰 뒤
        gaps = [s for s in sleeps if s != 60]
        self.assertEqual(len(gaps), len(ap.SERIES) - 1)            # 요청 사이마다
        self.assertTrue(all(s >= 5 for s in gaps))                 # 5초 이상

    def test_second_failure_stops(self):
        def always_down(url):
            raise OSError("down")
        with self.assertRaises(OSError):
            ap.fetch_series(get=always_down, sleep=lambda s: None, today=dt.date(2026, 2, 1))

    def test_reuses_files_fetched_today(self):
        for sid in ap.SERIES:
            (self.tmp / f"{sid}.csv").write_text("observation_date,X\n2026-01-30,1.0\n", encoding="utf-8")
        calls = []
        ap.fetch_series(get=lambda u: calls.append(u) or b"", sleep=lambda s: None, today=dt.date.today())
        self.assertEqual(calls, [])


if __name__ == "__main__":
    unittest.main()
