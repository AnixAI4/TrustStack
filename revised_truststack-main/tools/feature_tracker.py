#!/usr/bin/env python3
"""The dynamic feature tracker (F-61) — check the feature register against the code.

    python3 tools/feature_tracker.py            # check against origin/main (fetches first)
    python3 tools/feature_tracker.py --ref HEAD # check against the current checkout's commit
    python3 tools/feature_tracker.py --strict   # exit 1 if any row disagrees with the code
    python3 tools/feature_tracker.py --note "Step 3: Sentinel design"   # add a line to the Updates log

Reads `docs/reference/feature_register.json` (the single source, edited by hand)
and writes `docs/reference/feature_tracker.json` (generated — never edit it):
every row as a flat `rows` list (what the tracker page reads) plus totals.

The rule: a row marked `built` or `partial` names the files that prove it
(`checks`). Each is looked up in the git tree of the ref — so the answer is the
same whichever branch is checked out. A named file that is missing, or a built
row that names nothing, is a WARNING: the tracker says so instead of showing a
status the code does not back.

It also writes `docs/reference/FEATURE_TRACKER.html` — one self-contained page
(open it in any browser, no sign-in) with the rows and the Updates log
(`docs/reference/feature_tracker_log.json`). Run it, with --note, at the end of
every prompt or feature, and in every Sync Step (PLAYBOOK §6.5).
"""
from __future__ import annotations

import argparse
import collections
import datetime as dt
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REGISTER = ROOT / "docs/reference/feature_register.json"
OUT = ROOT / "docs/reference/feature_tracker.json"
LOG = ROOT / "docs/reference/feature_tracker_log.json"
TEMPLATE = ROOT / "tools/feature_tracker_template.html"
PAGE = ROOT / "docs/reference/FEATURE_TRACKER.html"
STATUSES = ("built", "partial", "not_built", "dropped")
DECISIONS = ("KEEP", "MERGE", "NEW", "PARK", "DROP")


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True, text=True).stdout


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ref", default="origin/main", help="git ref whose tree is checked (default origin/main)")
    ap.add_argument("--no-fetch", action="store_true", help="do not fetch before checking origin/*")
    ap.add_argument("--strict", action="store_true", help="exit 1 when any row has a warning")
    ap.add_argument("--note", help="one line for the page's Updates log: what this prompt or feature changed")
    a = ap.parse_args()

    if a.ref.startswith("origin/") and not a.no_fetch:
        subprocess.run(["git", "-C", str(ROOT), "fetch", "-q", "origin"], check=False)
    commit = git("rev-parse", "--short", a.ref).strip()
    committed = git("log", "-1", "--format=%cI", a.ref).strip()
    files = set(git("ls-tree", "-r", "--name-only", a.ref).splitlines())

    reg = json.loads(REGISTER.read_text(encoding="utf-8"))
    rows, warnings = [], 0
    for f in reg["features"]:
        assert f["status"] in STATUSES, f"{f['id']}: unknown status {f['status']}"
        assert f["decision"] in DECISIONS, f"{f['id']}: unknown decision {f['decision']}"
        found = [p for p in f["checks"] if p in files]
        missing = [p for p in f["checks"] if p not in files]
        issues = []
        if f["status"] in ("built", "partial"):
            if not f["checks"]:
                issues.append(f"marked {f['status']} but names no code to check")
            issues += [f"not found on {a.ref}: {p}" for p in missing]
        elif found:
            issues.append(f"marked {f['status']} but code exists: {', '.join(found)}")
        warnings += bool(issues)
        rows.append({**f, "codeCheck": {"ok": not issues, "found": found, "missing": missing, "issues": issues}})

    def count(key: str) -> dict[str, int]:
        return dict(collections.Counter(r[key] for r in rows))

    out_time = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    out = {
        "generatedAt": out_time,
        "ref": a.ref,
        "commit": commit,
        "commitDate": committed,
        "register": str(REGISTER.relative_to(ROOT)),
        "totals": {
            "features": len(rows),
            "byStatus": count("status"),
            "byDecision": count("decision"),
            "byFamily": count("family"),
            "bySide": count("side"),
            "sentinel": sum(1 for r in rows if r["sentinel"]),
            "warnings": warnings,
        },
        # Flat rows — what the tracker page reads (one column per field, text only).
        "rows": [
            {
                "id": r["id"],
                "name": r["name"],
                "family": r["family"],
                "status": r["status"],
                "decision": r["decision"],
                "where": r["where"],
                "side": r["side"],
                "sentinel": "yes" if r["sentinel"] else "no",
                "oldApp": r["oldApp"] or "",
                "oldStatus": r["oldStatus"],
                "newApp": r["newApp"] or "",
                "basis": r["basis"],
                "note": r["note"],
                "checks": "; ".join(r["checks"]),
                "codeOk": "yes" if r["codeCheck"]["ok"] else "no",
                "codeIssues": "; ".join(r["codeCheck"]["issues"]),
                "checkedRef": a.ref,
                "checkedCommit": commit,
                "checkedAt": out_time,
            }
            for r in rows
        ],
    }
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # The standalone page: the same rows, plus the Updates log, in one HTML file.
    log = json.loads(LOG.read_text(encoding="utf-8")) if LOG.exists() else []
    if a.note:
        log.append({"at": out_time, "note": a.note.strip(), "commit": commit})
        LOG.write_text(json.dumps(log, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    page_data = {k: out[k] for k in ("generatedAt", "ref", "commit", "commitDate", "totals", "rows")} | {"log": log}
    embedded = json.dumps(page_data, ensure_ascii=False).replace("</", "<\\/")
    PAGE.write_text(TEMPLATE.read_text(encoding="utf-8").replace("__DATA__", embedded), encoding="utf-8")

    t = out["totals"]
    print(f"{t['features']} features checked against {a.ref} @ {commit}")
    print("  status:  " + " · ".join(f"{k} {t['byStatus'].get(k, 0)}" for k in STATUSES))
    print("  decision: " + " · ".join(f"{k} {t['byDecision'].get(k, 0)}" for k in DECISIONS))
    print(f"  warnings: {warnings}")
    for r in rows:
        for i in r["codeCheck"]["issues"]:
            print(f"  ! {r['id']} {r['name']}: {i}")
    print(f"wrote {OUT.relative_to(ROOT)} and {PAGE.relative_to(ROOT)}")
    return 1 if a.strict and warnings else 0


if __name__ == "__main__":
    sys.exit(main())
