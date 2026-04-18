"""
Premier League Player Prop Prediction Model
Estimates expected Shots and Shots on Target (SOT) for individual PL players.
Computes edge% and hit probability vs. a given prop line.
"""

from __future__ import annotations

import argparse
import csv
import itertools
import json
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
from scipy.stats import poisson

# ---------------------------------------------------------------------------
# League-Specific Shot Baselines (per 90 min, 2025/26 season averages)
# ---------------------------------------------------------------------------

PL_TEAM_BASE_SHOTS: dict[str, float] = {
    "Manchester City":   15.2,
    "Arsenal":           14.8,
    "Liverpool":         15.5,
    "Chelsea":           13.9,
    "Manchester United": 12.8,
    "Tottenham":         13.4,
    "Newcastle":         13.1,
    "Aston Villa":       13.0,
    "Brighton":          14.2,
    "Brentford":         11.8,
    "DEFAULT_TOP6":      14.5,
    "DEFAULT_MID":       12.0,
    "DEFAULT_BOTTOM":    10.0,
}

HOME_AWAY_MULT: dict[str, float] = {
    "home": 1.13,
    "away": 0.87,
}

COMPETITION_MULT: dict[str, float] = {
    "PL":    1.00,
    "FA_CUP":  0.95,
    "EFL_CUP": 0.90,
    "UCL":   1.05,
    "UEL":   0.98,
    "UECL":  0.95,
}

URGENCY_MULT: dict[str, float] = {
    "neutral":             1.00,
    "must_win_top4":       1.10,
    "must_win_title":      1.12,
    "must_win_relegation": 1.08,
    "nothing_to_play_for": 0.88,
    "dead_rubber":         0.82,
    "revenge_fixture":     1.04,
}

PL_POSITION_SHOT_SHARE: dict[str, float] = {
    "CF":           0.220,
    "SS":           0.165,
    "WF_inside":    0.190,
    "WF_wide":      0.140,
    "AM":           0.125,
    "CM_box":       0.085,
    "CM_deep":      0.050,
    "DM":           0.035,
    "FB_attacking": 0.045,
    "FB_defensive": 0.025,
    "CB_aerial":    0.030,
    "CB_defensive": 0.015,
    "GK":           0.000,
}

PL_SOT_RATE: dict[str, float] = {
    "CF":           0.44,
    "SS":           0.41,
    "WF_inside":    0.42,
    "WF_wide":      0.35,
    "AM":           0.37,
    "CM_box":       0.30,
    "CM_deep":      0.24,
    "DM":           0.22,
    "FB_attacking": 0.20,
    "FB_defensive": 0.16,
    "CB_aerial":    0.18,
    "CB_defensive": 0.12,
    "GK":           0.00,
}

PL_ROLE_OVERRIDE_KEYWORDS: dict[str, str] = {
    "false 9":       "SS",
    "no.10":         "AM",
    "number 10":     "AM",
    "inside forward":"WF_inside",
    "inverted winger":"WF_inside",
    "wide":          "WF_wide",
    "right back":    "FB_defensive",
    "left back":     "FB_defensive",
    "rb":            "FB_defensive",
    "lb":            "FB_defensive",
    "wingback":      "FB_attacking",
    "wing back":     "FB_attacking",
    "iwb":           "FB_attacking",
    "deep":          "CM_deep",
    "pivot":         "CM_deep",
    "box to box":    "CM_box",
    "b2b":           "CM_box",
    "center back":   "CB_aerial",
    "cb":            "CB_defensive",
    "defensive mid": "DM",
    "holding":       "DM",
}

LEAGUE_AVG_SHOTS_CONCEDED = 12.2

TIER_ORDER = {"S 🔥": 0, "A ✅": 1, "B 💰": 2, "C ⚠️": 3, "D ❌": 4}


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class PLPlayerPropInput:
    name: str
    team: str
    opponent: str
    role: str
    is_home: bool
    team_possession_pct: float
    is_confirmed_starter: bool
    minutes_expected: float
    prop_line_shots: Optional[float]
    prop_line_sot: Optional[float]
    competition: str
    urgency_context: str
    player_l5_avg_shots: Optional[float]
    player_l5_avg_sot: Optional[float]
    player_season_avg_shots: Optional[float]
    opponent_shots_conceded_avg: Optional[float]
    positional_note: Optional[str]


@dataclass
class PLPropResult:
    player: str
    team: str
    opponent: str
    is_home: bool
    role_resolved: str
    prop_type: str
    direction: str
    exp_value: float
    prop_line: float
    edge_pct: float
    hit_prob: float
    tier: str
    is_starter: bool
    minutes_expected: float
    note: str


# ---------------------------------------------------------------------------
# Core calculation helpers
# ---------------------------------------------------------------------------

def possession_mult(poss_pct: float) -> float:
    result = 1.0 + (poss_pct - 50) * 0.018
    return max(0.80, min(1.25, result))


def minutes_adj(exp_base: float, minutes_expected: float) -> float:
    return exp_base * (minutes_expected / 90)


def opp_defensive_adj(
    base_exp: float,
    opp_shots_conceded_avg: Optional[float],
    league_avg: float = LEAGUE_AVG_SHOTS_CONCEDED,
) -> float:
    if opp_shots_conceded_avg is None:
        return base_exp
    ratio = opp_shots_conceded_avg / league_avg
    ratio = max(0.75, min(1.25, ratio))
    return base_exp * ratio


def resolve_role(player: PLPlayerPropInput) -> str:
    if player.positional_note:
        note_lower = player.positional_note.lower()
        for keyword, override_role in PL_ROLE_OVERRIDE_KEYWORDS.items():
            if keyword in note_lower:
                return override_role
    return player.role


def p_over(lam: float, line: float) -> float:
    if lam <= 0:
        return 0.001
    threshold = int(line + 0.5)
    return float(1 - poisson.cdf(threshold - 1, lam))


def p_under(lam: float, line: float) -> float:
    return float(1 - p_over(lam, line))


def edge_pct(exp: float, line: float) -> float:
    if line == 0:
        return 0.0
    return round((exp - line) / line * 100, 1)


def tier(hit: float) -> str:
    if hit >= 0.90:
        return "S 🔥"
    if hit >= 0.75:
        return "A ✅"
    if hit >= 0.65:
        return "B 💰"
    if hit >= 0.55:
        return "C ⚠️"
    return "D ❌"


# ---------------------------------------------------------------------------
# Expected value pipeline
# ---------------------------------------------------------------------------

def compute_expected(
    player: PLPlayerPropInput,
    verbose: bool = False,
) -> tuple[float, float]:
    if not player.is_confirmed_starter:
        if verbose:
            print(f"  [{player.name}] Not confirmed starter — returning 0.0, 0.0")
        return 0.0, 0.0

    team_base = PL_TEAM_BASE_SHOTS.get(player.team, PL_TEAM_BASE_SHOTS["DEFAULT_MID"])

    ha_mult = HOME_AWAY_MULT["home" if player.is_home else "away"]
    poss_m = max(0.80, min(1.25, possession_mult(player.team_possession_pct)))
    comp_m = COMPETITION_MULT.get(player.competition, 1.00)
    urg_m = URGENCY_MULT.get(player.urgency_context, 1.00)

    team_exp = team_base * ha_mult * poss_m * comp_m * urg_m

    role = resolve_role(player)
    share = PL_POSITION_SHOT_SHARE.get(role, 0.08)
    model_shots = team_exp * share

    if player.player_l5_avg_shots is not None:
        if player.player_season_avg_shots is not None:
            hist = 0.65 * player.player_l5_avg_shots + 0.35 * player.player_season_avg_shots
        else:
            hist = player.player_l5_avg_shots
        exp_shots_pre_opp = 0.60 * hist + 0.40 * model_shots
    else:
        exp_shots_pre_opp = model_shots

    exp_shots_pre_min = opp_defensive_adj(exp_shots_pre_opp, player.opponent_shots_conceded_avg)
    exp_shots = minutes_adj(exp_shots_pre_min, player.minutes_expected)

    sot_model_rate = PL_SOT_RATE.get(role, 0.30)
    if player.player_l5_avg_sot is not None:
        exp_sot_pre_min = 0.60 * player.player_l5_avg_sot + 0.40 * (exp_shots * sot_model_rate)
    else:
        exp_sot_pre_min = exp_shots * sot_model_rate

    exp_sot = min(exp_sot_pre_min, exp_shots)

    if verbose:
        print(f"\n  {'─'*50}")
        print(f"  Player        : {player.name}  ({role})")
        print(f"  Team base     : {team_base:.2f} shots/90")
        print(f"  H/A mult      : {ha_mult:.3f} ({'home' if player.is_home else 'away'})")
        print(f"  Possession    : {player.team_possession_pct}% → mult {poss_m:.3f}")
        print(f"  Competition   : {player.competition} → mult {comp_m:.2f}")
        print(f"  Urgency       : {player.urgency_context} → mult {urg_m:.2f}")
        print(f"  Team expected : {team_exp:.2f}")
        print(f"  Role share    : {share:.3f}")
        print(f"  Model shots   : {model_shots:.2f}")
        if player.player_l5_avg_shots is not None:
            print(f"  L5 avg shots  : {player.player_l5_avg_shots}")
            if player.player_season_avg_shots is not None:
                print(f"  Season avg    : {player.player_season_avg_shots}")
                print(f"  Hist blend    : {0.65*player.player_l5_avg_shots + 0.35*player.player_season_avg_shots:.2f}")
            print(f"  After hist blend: {exp_shots_pre_opp:.2f}")
        if player.opponent_shots_conceded_avg is not None:
            ratio = min(1.25, max(0.75, player.opponent_shots_conceded_avg / LEAGUE_AVG_SHOTS_CONCEDED))
            print(f"  Opp def adj   : {player.opponent_shots_conceded_avg} conceded/game → ratio {ratio:.3f}")
        print(f"  After opp adj : {exp_shots_pre_min:.2f}")
        print(f"  Minutes adj   : {player.minutes_expected}/90 → {exp_shots:.2f}")
        print(f"  SOT rate      : {sot_model_rate:.2f}")
        print(f"  ► Exp Shots   : {round(exp_shots, 2)}")
        print(f"  ► Exp SOT     : {round(exp_sot, 2)}")

    return round(exp_shots, 2), round(exp_sot, 2)


# ---------------------------------------------------------------------------
# Result builder
# ---------------------------------------------------------------------------

def build_results(
    players: list[PLPlayerPropInput],
    verbose: bool = False,
) -> list[PLPropResult]:
    results: list[PLPropResult] = []

    for p in players:
        role = resolve_role(p)
        exp_shots, exp_sot = compute_expected(p, verbose=verbose)

        if not p.is_confirmed_starter:
            note = "NOT CONFIRMED STARTER"
        else:
            note = ""

        # Shots prop
        if p.prop_line_shots is not None:
            line = p.prop_line_shots
            hit = p_over(exp_shots, line)
            direction = "OVER" if exp_shots > line else "UNDER"
            if direction == "UNDER":
                hit = p_under(exp_shots, line)
            ep = edge_pct(exp_shots, line)
            results.append(PLPropResult(
                player=p.name,
                team=p.team,
                opponent=p.opponent,
                is_home=p.is_home,
                role_resolved=role,
                prop_type="Shots",
                direction=direction,
                exp_value=exp_shots,
                prop_line=line,
                edge_pct=ep,
                hit_prob=round(hit, 3),
                tier=tier(hit),
                is_starter=p.is_confirmed_starter,
                minutes_expected=p.minutes_expected,
                note=note,
            ))

        # SOT prop
        if p.prop_line_sot is not None:
            line = p.prop_line_sot
            hit = p_over(exp_sot, line)
            direction = "OVER" if exp_sot > line else "UNDER"
            if direction == "UNDER":
                hit = p_under(exp_sot, line)
            ep = edge_pct(exp_sot, line)
            results.append(PLPropResult(
                player=p.name,
                team=p.team,
                opponent=p.opponent,
                is_home=p.is_home,
                role_resolved=role,
                prop_type="SOT",
                direction=direction,
                exp_value=exp_sot,
                prop_line=line,
                edge_pct=ep,
                hit_prob=round(hit, 3),
                tier=tier(hit),
                is_starter=p.is_confirmed_starter,
                minutes_expected=p.minutes_expected,
                note=note,
            ))

    results.sort(key=lambda r: (TIER_ORDER.get(r.tier, 5), -r.hit_prob))
    return results


# ---------------------------------------------------------------------------
# Parlay builder
# ---------------------------------------------------------------------------

def build_optimal_parlay(
    results: list[PLPropResult],
    size: int,
    payout_mult: Optional[dict[int, float]] = None,
) -> tuple[list[PLPropResult], float, float]:
    if payout_mult is None:
        payout_mult = {2: 3.0, 3: 5.0, 4: 10.0, 5: 20.0, 6: 40.0}

    pool = [r for r in results if r.hit_prob >= 0.55]

    if len(pool) < size:
        return [], 0.0, 0.0

    best_combo: Optional[tuple[PLPropResult, ...]] = None
    best_ev = -999.0
    best_prob = 0.0

    for combo in itertools.combinations(pool, size):
        seen_player_type: set[tuple[str, str]] = set()
        match_counts: dict[tuple, int] = {}
        team_counts: dict[str, int] = {}
        valid = True

        for r in combo:
            key = (r.player, r.prop_type)
            match_key = (tuple(sorted([r.team, r.opponent])), r.prop_type)
            if key in seen_player_type:
                valid = False
                break
            seen_player_type.add(key)
            match_counts[match_key] = match_counts.get(match_key, 0) + 1
            team_counts[r.team] = team_counts.get(r.team, 0) + 1
            if match_counts[match_key] > 2 or team_counts[r.team] > 2:
                valid = False
                break

        if not valid:
            continue

        prob = 1.0
        for r in combo:
            prob *= r.hit_prob
        for cnt in match_counts.values():
            if cnt > 1:
                prob *= 0.95 ** (cnt - 1)

        ev = prob * payout_mult.get(size, 1.0)
        if ev > best_ev:
            best_ev = ev
            best_combo = combo
            best_prob = prob

    if best_combo is None:
        return [], 0.0, 0.0

    return list(best_combo), round(best_prob, 3), round(best_ev, 3)


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def print_summary_table(results: list[PLPropResult]) -> None:
    header = (
        f"{'#':<3} {'Player':<22} {'Team':<18} {'vs':<18} "
        f"{'Type':<6} {'Dir':<6} {'Exp':>5} {'Line':>5} "
        f"{'Edge%':>7} {'Hit%':>6}  {'Tier':<8}  {'Min':>4}  Note"
    )
    sep = "─" * len(header)
    print(f"\n{'═'*len(header)}")
    print("  PREMIER LEAGUE PROP RECOMMENDATIONS")
    print(f"{'═'*len(header)}")
    print(header)
    print(sep)
    for i, r in enumerate(results, 1):
        venue = "H" if r.is_home else "A"
        print(
            f"{i:<3} {r.player:<22} {r.team:<18} {r.opponent:<18} "
            f"{r.prop_type:<6} {r.direction:<6} {r.exp_value:>5.2f} {r.prop_line:>5.1f} "
            f"{r.edge_pct:>+7.1f}% {r.hit_prob*100:>5.1f}%  {r.tier:<8}  {r.minutes_expected:>4.0f}  {r.note}"
        )
    print(sep)
    print(f"  Total props: {len(results)}")
    print(f"{'═'*len(header)}\n")


def print_parlay(
    legs: list[PLPropResult],
    prob: float,
    ev: float,
    size: int,
) -> None:
    print(f"\n  ── OPTIMAL {size}-LEG PARLAY ──")
    for i, r in enumerate(legs, 1):
        print(
            f"  {i}. {r.player} ({r.team}) — {r.prop_type} "
            f"{r.direction} {r.prop_line}  [{r.tier}  {r.hit_prob*100:.1f}%]"
        )
    print(f"  Combined Prob: {prob*100:.1f}%   EV: {ev:.2f}x\n")


def save_csv(results: list[PLPropResult], path: str) -> None:
    rows = [asdict(r) for r in results]
    if not rows:
        print("  No results to save.")
        return
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"  Results saved → {path}")


# ---------------------------------------------------------------------------
# Tier filter helper
# ---------------------------------------------------------------------------

TIER_RANK = {"S 🔥": 0, "A ✅": 1, "B 💰": 2, "C ⚠️": 3, "D ❌": 4}
MIN_TIER_MAP = {"S": 0, "A": 1, "B": 2, "C": 3, "D": 4}


def filter_by_tier(results: list[PLPropResult], min_tier: str) -> list[PLPropResult]:
    cutoff = MIN_TIER_MAP.get(min_tier.upper(), 4)
    return [r for r in results if TIER_RANK.get(r.tier, 4) <= cutoff]


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Premier League Player Prop Prediction Model",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--players", required=True,
        help="Path to input JSON file containing player prop inputs",
    )
    parser.add_argument(
        "--output", default=None,
        help="Path for output CSV file (optional)",
    )
    parser.add_argument(
        "--parlay", action="store_true",
        help="Generate optimal parlay recommendations (2–6 legs)",
    )
    parser.add_argument(
        "--min-tier", default=None, metavar="TIER",
        help="Filter output to minimum tier: S, A, B, C, or D",
    )
    parser.add_argument(
        "--match", default=None, metavar="MATCH",
        help='Filter to a specific match, e.g. "Arsenal vs Chelsea"',
    )
    parser.add_argument(
        "--verbose", action="store_true",
        help="Print intermediate calculation steps for each player",
    )
    return parser.parse_args(argv)


def load_players(path: str) -> list[PLPlayerPropInput]:
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    players: list[PLPlayerPropInput] = []
    for item in raw:
        players.append(PLPlayerPropInput(
            name=item["name"],
            team=item["team"],
            opponent=item["opponent"],
            role=item["role"],
            is_home=bool(item["is_home"]),
            team_possession_pct=float(item["team_possession_pct"]),
            is_confirmed_starter=bool(item["is_confirmed_starter"]),
            minutes_expected=float(item["minutes_expected"]),
            prop_line_shots=item.get("prop_line_shots"),
            prop_line_sot=item.get("prop_line_sot"),
            competition=item.get("competition", "PL"),
            urgency_context=item.get("urgency_context", "neutral"),
            player_l5_avg_shots=item.get("player_l5_avg_shots"),
            player_l5_avg_sot=item.get("player_l5_avg_sot"),
            player_season_avg_shots=item.get("player_season_avg_shots"),
            opponent_shots_conceded_avg=item.get("opponent_shots_conceded_avg"),
            positional_note=item.get("positional_note"),
        ))
    return players


def filter_by_match(
    players: list[PLPlayerPropInput], match_str: str
) -> list[PLPlayerPropInput]:
    teams = [t.strip() for t in match_str.replace(" vs ", "|").replace(" v ", "|").split("|")]
    teams_lower = [t.lower() for t in teams]
    return [
        p for p in players
        if any(t in p.team.lower() or t in p.opponent.lower() for t in teams_lower)
    ]


def main(argv: Optional[list[str]] = None) -> None:
    args = parse_args(argv)

    print(f"\n  Loading players from: {args.players}")
    players = load_players(args.players)

    if args.match:
        players = filter_by_match(players, args.match)
        print(f"  Filtered to match '{args.match}': {len(players)} players")

    if args.verbose:
        print("\n  ── VERBOSE CALCULATION LOG ──")

    results = build_results(players, verbose=args.verbose)

    if args.min_tier:
        results = filter_by_tier(results, args.min_tier)
        print(f"  Filtered to min tier '{args.min_tier}': {len(results)} props")

    print_summary_table(results)

    if args.output:
        save_csv(results, args.output)

    if args.parlay:
        for size in (2, 3, 4, 5, 6):
            legs, prob, ev = build_optimal_parlay(results, size)
            if legs:
                print_parlay(legs, prob, ev, size)
            else:
                print(f"  Could not build a valid {size}-leg parlay from current pool.")


if __name__ == "__main__":
    main()
