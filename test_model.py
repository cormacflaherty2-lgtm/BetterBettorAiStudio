"""
Tests for the Premier League Player Prop Prediction Model.
Run with: python test_model.py
"""

from __future__ import annotations

import math
import sys
import unittest

from pl_prop_model import (
    PLPlayerPropInput,
    PLPropResult,
    build_optimal_parlay,
    build_results,
    compute_expected,
    edge_pct,
    filter_by_tier,
    opp_defensive_adj,
    p_over,
    p_under,
    possession_mult,
    resolve_role,
    tier,
)


def _make_player(**overrides) -> PLPlayerPropInput:
    """Factory with sensible defaults for Erling Haaland-style CF."""
    defaults = dict(
        name="Test Player",
        team="Manchester City",
        opponent="Brentford",
        role="CF",
        is_home=True,
        team_possession_pct=55.0,
        is_confirmed_starter=True,
        minutes_expected=90.0,
        prop_line_shots=3.5,
        prop_line_sot=1.5,
        competition="PL",
        urgency_context="neutral",
        player_l5_avg_shots=4.0,
        player_l5_avg_sot=1.8,
        player_season_avg_shots=3.8,
        opponent_shots_conceded_avg=12.2,
        positional_note=None,
    )
    defaults.update(overrides)
    return PLPlayerPropInput(**defaults)


class TestPossessionMult(unittest.TestCase):
    def test_at_50_is_1(self):
        self.assertAlmostEqual(possession_mult(50), 1.0)

    def test_above_50_increases(self):
        self.assertGreater(possession_mult(60), 1.0)

    def test_below_50_decreases(self):
        self.assertLess(possession_mult(40), 1.0)

    def test_clamped_at_maximum(self):
        self.assertAlmostEqual(possession_mult(100), 1.25)

    def test_clamped_at_minimum(self):
        self.assertAlmostEqual(possession_mult(0), 0.80)

    def test_linear_scaling(self):
        # +10% possession = +0.18 multiplier (50→60 is within unclamped range)
        m50 = possession_mult(50)
        m60 = possession_mult(60)
        self.assertAlmostEqual(m60 - m50, 0.18, places=5)


class TestOppDefensiveAdj(unittest.TestCase):
    def test_none_returns_base(self):
        self.assertAlmostEqual(opp_defensive_adj(3.0, None), 3.0)

    def test_league_avg_unchanged(self):
        self.assertAlmostEqual(opp_defensive_adj(3.0, 12.2), 3.0, places=4)

    def test_weak_defence_increases(self):
        self.assertGreater(opp_defensive_adj(3.0, 15.0), 3.0)

    def test_strong_defence_decreases(self):
        self.assertLess(opp_defensive_adj(3.0, 9.0), 3.0)

    def test_upper_clamp(self):
        result = opp_defensive_adj(3.0, 999.0)
        self.assertAlmostEqual(result, 3.0 * 1.25)

    def test_lower_clamp(self):
        result = opp_defensive_adj(3.0, 0.1)
        self.assertAlmostEqual(result, 3.0 * 0.75)


class TestProbabilityFunctions(unittest.TestCase):
    def test_p_over_adds_to_1_with_p_under(self):
        lam, line = 3.5, 2.5
        self.assertAlmostEqual(p_over(lam, line) + p_under(lam, line), 1.0, places=5)

    def test_p_over_zero_lam(self):
        self.assertAlmostEqual(p_over(0, 2.5), 0.001)

    def test_p_over_high_lam_near_1(self):
        self.assertGreater(p_over(10.0, 1.5), 0.95)

    def test_p_over_positive(self):
        self.assertGreater(p_over(3.5, 2.5), 0.0)
        self.assertLess(p_over(3.5, 2.5), 1.0)


class TestEdgePct(unittest.TestCase):
    def test_positive_edge(self):
        self.assertGreater(edge_pct(4.0, 3.0), 0)

    def test_negative_edge(self):
        self.assertLess(edge_pct(2.0, 3.0), 0)

    def test_zero_edge_at_line(self):
        self.assertAlmostEqual(edge_pct(3.0, 3.0), 0.0)

    def test_zero_line_safe(self):
        self.assertEqual(edge_pct(3.0, 0.0), 0.0)


class TestTier(unittest.TestCase):
    def test_s_tier(self):
        self.assertEqual(tier(0.92), "S 🔥")

    def test_a_tier(self):
        self.assertEqual(tier(0.80), "A ✅")

    def test_b_tier(self):
        self.assertEqual(tier(0.70), "B 💰")

    def test_c_tier(self):
        self.assertEqual(tier(0.60), "C ⚠️")

    def test_d_tier(self):
        self.assertEqual(tier(0.40), "D ❌")

    def test_boundary_90(self):
        self.assertEqual(tier(0.90), "S 🔥")

    def test_boundary_75(self):
        self.assertEqual(tier(0.75), "A ✅")


class TestResolveRole(unittest.TestCase):
    def test_no_override_returns_role(self):
        p = _make_player(role="CF", positional_note=None)
        self.assertEqual(resolve_role(p), "CF")

    def test_inverted_winger_override(self):
        p = _make_player(role="WF_wide", positional_note="inverted winger on the left")
        self.assertEqual(resolve_role(p), "WF_inside")

    def test_false_9_override(self):
        p = _make_player(role="CF", positional_note="plays as false 9")
        self.assertEqual(resolve_role(p), "SS")

    def test_cb_override(self):
        p = _make_player(role="CB_aerial", positional_note="strong cb, stays back")
        self.assertEqual(resolve_role(p), "CB_defensive")

    def test_case_insensitive(self):
        p = _make_player(role="CM_deep", positional_note="Box To Box midfielder")
        self.assertEqual(resolve_role(p), "CM_box")


class TestComputeExpected(unittest.TestCase):
    def test_non_starter_returns_zero(self):
        p = _make_player(is_confirmed_starter=False)
        shots, sot = compute_expected(p)
        self.assertEqual(shots, 0.0)
        self.assertEqual(sot, 0.0)

    def test_sot_le_shots(self):
        p = _make_player()
        shots, sot = compute_expected(p)
        self.assertLessEqual(sot, shots)

    def test_returns_floats(self):
        p = _make_player()
        shots, sot = compute_expected(p)
        self.assertIsInstance(shots, float)
        self.assertIsInstance(sot, float)

    def test_home_advantage(self):
        home = _make_player(is_home=True)
        away = _make_player(is_home=False)
        h_shots, _ = compute_expected(home)
        a_shots, _ = compute_expected(away)
        self.assertGreater(h_shots, a_shots)

    def test_partial_minutes(self):
        full = _make_player(minutes_expected=90)
        partial = _make_player(minutes_expected=45)
        f_shots, _ = compute_expected(full)
        p_shots, _ = compute_expected(partial)
        self.assertAlmostEqual(p_shots, f_shots * 0.5, places=1)

    def test_no_historical_data_uses_model(self):
        p = _make_player(
            player_l5_avg_shots=None,
            player_l5_avg_sot=None,
            player_season_avg_shots=None,
        )
        shots, sot = compute_expected(p)
        self.assertGreater(shots, 0.0)
        self.assertGreater(sot, 0.0)

    def test_urgency_must_win_title_higher(self):
        neutral = _make_player(urgency_context="neutral")
        urgent = _make_player(urgency_context="must_win_title")
        n_shots, _ = compute_expected(neutral)
        u_shots, _ = compute_expected(urgent)
        self.assertGreater(u_shots, n_shots)

    def test_dead_rubber_lower(self):
        neutral = _make_player(urgency_context="neutral")
        dead = _make_player(urgency_context="dead_rubber")
        n_shots, _ = compute_expected(neutral)
        d_shots, _ = compute_expected(dead)
        self.assertLess(d_shots, n_shots)

    def test_haaland_example(self):
        """Sanity check: Haaland vs Brentford (from spec example)."""
        p = PLPlayerPropInput(
            name="Erling Haaland",
            team="Manchester City",
            opponent="Brentford",
            role="CF",
            is_home=True,
            team_possession_pct=64,
            is_confirmed_starter=True,
            minutes_expected=90,
            prop_line_shots=3.5,
            prop_line_sot=1.5,
            competition="PL",
            urgency_context="must_win_title",
            player_l5_avg_shots=4.2,
            player_l5_avg_sot=1.9,
            player_season_avg_shots=4.0,
            opponent_shots_conceded_avg=14.8,
            positional_note=None,
        )
        shots, sot = compute_expected(p)
        # Haaland should show strong expected output as a top CF
        self.assertGreater(shots, 3.0)
        self.assertGreater(sot, 1.0)
        self.assertLessEqual(sot, shots)

    def test_saka_example_inverted_winger(self):
        """Bukayo Saka — role override to WF_inside from positional_note."""
        p = PLPlayerPropInput(
            name="Bukayo Saka",
            team="Arsenal",
            opponent="Man United",
            role="WF_inside",
            is_home=True,
            team_possession_pct=58,
            is_confirmed_starter=True,
            minutes_expected=90,
            prop_line_shots=2.5,
            prop_line_sot=0.5,
            competition="PL",
            urgency_context="must_win_top4",
            player_l5_avg_shots=3.1,
            player_l5_avg_sot=1.2,
            player_season_avg_shots=2.9,
            opponent_shots_conceded_avg=11.4,
            positional_note="inverted winger, cuts in on left foot",
        )
        shots, sot = compute_expected(p)
        self.assertGreater(shots, 2.0)
        self.assertGreater(sot, 0.5)
        self.assertLessEqual(sot, shots)


class TestBuildResults(unittest.TestCase):
    def setUp(self):
        self.players = [
            _make_player(name="PlayerA", prop_line_shots=3.5, prop_line_sot=1.5),
            _make_player(name="PlayerB", team="Arsenal", prop_line_shots=2.5, prop_line_sot=None),
        ]

    def test_returns_list(self):
        results = build_results(self.players)
        self.assertIsInstance(results, list)

    def test_each_result_is_pl_prop_result(self):
        results = build_results(self.players)
        for r in results:
            self.assertIsInstance(r, PLPropResult)

    def test_both_prop_types_for_player_a(self):
        results = build_results(self.players)
        player_a = [r for r in results if r.player == "PlayerA"]
        types = {r.prop_type for r in player_a}
        self.assertIn("Shots", types)
        self.assertIn("SOT", types)

    def test_only_shots_for_player_b(self):
        results = build_results(self.players)
        player_b = [r for r in results if r.player == "PlayerB"]
        types = {r.prop_type for r in player_b}
        self.assertIn("Shots", types)
        self.assertNotIn("SOT", types)

    def test_sorted_by_tier(self):
        results = build_results(self.players)
        tier_ranks = [TIER_ORDER_MAP.get(r.tier, 5) for r in results]
        self.assertEqual(tier_ranks, sorted(tier_ranks))

    def test_non_starter_note(self):
        players = [_make_player(name="Bench", is_confirmed_starter=False, prop_line_shots=1.5)]
        results = build_results(players)
        self.assertTrue(all("NOT CONFIRMED STARTER" in r.note for r in results))


TIER_ORDER_MAP = {"S 🔥": 0, "A ✅": 1, "B 💰": 2, "C ⚠️": 3, "D ❌": 4}


class TestFilterByTier(unittest.TestCase):
    def _make_result(self, tier_str: str) -> PLPropResult:
        return PLPropResult(
            player="X", team="T", opponent="O", is_home=True,
            role_resolved="CF", prop_type="Shots", direction="OVER",
            exp_value=3.0, prop_line=2.5, edge_pct=20.0,
            hit_prob=0.80, tier=tier_str, is_starter=True,
            minutes_expected=90.0, note="",
        )

    def test_filter_a_excludes_b_c_d(self):
        results = [
            self._make_result("S 🔥"),
            self._make_result("A ✅"),
            self._make_result("B 💰"),
            self._make_result("D ❌"),
        ]
        filtered = filter_by_tier(results, "A")
        tiers = {r.tier for r in filtered}
        self.assertNotIn("B 💰", tiers)
        self.assertNotIn("D ❌", tiers)
        self.assertIn("S 🔥", tiers)
        self.assertIn("A ✅", tiers)


class TestBuildOptimalParlay(unittest.TestCase):
    def _make_result(self, player: str, prop_type: str, hit: float) -> PLPropResult:
        return PLPropResult(
            player=player, team="Arsenal", opponent="Chelsea",
            is_home=True, role_resolved="CF", prop_type=prop_type,
            direction="OVER", exp_value=3.0, prop_line=2.5,
            edge_pct=20.0, hit_prob=hit, tier=tier(hit),
            is_starter=True, minutes_expected=90.0, note="",
        )

    def test_2_leg_returns_legs(self):
        results = [
            self._make_result("A", "Shots", 0.80),
            self._make_result("B", "Shots", 0.75),
            self._make_result("C", "SOT", 0.70),
        ]
        legs, prob, ev = build_optimal_parlay(results, 2)
        self.assertEqual(len(legs), 2)
        self.assertGreater(prob, 0)
        self.assertGreater(ev, 0)

    def test_insufficient_pool(self):
        results = [self._make_result("A", "Shots", 0.80)]
        legs, prob, ev = build_optimal_parlay(results, 3)
        self.assertEqual(legs, [])
        self.assertEqual(prob, 0.0)
        self.assertEqual(ev, 0.0)

    def test_duplicate_player_prop_excluded(self):
        """Same player + prop_type combination should not appear twice."""
        results = [
            self._make_result("A", "Shots", 0.80),
            self._make_result("A", "Shots", 0.75),  # duplicate
            self._make_result("B", "Shots", 0.70),
            self._make_result("C", "SOT",   0.65),
        ]
        legs, prob, ev = build_optimal_parlay(results, 2)
        seen = set()
        for r in legs:
            key = (r.player, r.prop_type)
            self.assertNotIn(key, seen)
            seen.add(key)

    def test_below_55_excluded_from_pool(self):
        results = [
            self._make_result("A", "Shots", 0.50),
            self._make_result("B", "SOT",   0.45),
        ]
        legs, prob, ev = build_optimal_parlay(results, 2)
        self.assertEqual(legs, [])


class TestVerboseMode(unittest.TestCase):
    """Ensure verbose=True doesn't raise and returns same values."""

    def test_verbose_same_output(self):
        import io
        from contextlib import redirect_stdout

        p = _make_player()
        buf = io.StringIO()
        with redirect_stdout(buf):
            shots_v, sot_v = compute_expected(p, verbose=True)
        shots, sot = compute_expected(p, verbose=False)
        self.assertEqual(shots_v, shots)
        self.assertEqual(sot_v, sot)
        self.assertGreater(len(buf.getvalue()), 0)


if __name__ == "__main__":
    result = unittest.main(verbosity=2, exit=False)
    sys.exit(0 if result.result.wasSuccessful() else 1)
