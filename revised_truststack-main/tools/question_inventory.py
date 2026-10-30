#!/usr/bin/env python3
"""Inventory and validate the industry question packs.

Reads every docs/question_packs/industry/*.md, extracts question rows from the
Markdown tables regardless of which of the six authored column layouts a file
uses, and checks the invariants that must hold before Slice 3 seeds them:

  * every question code is unique across all packs
  * every question resolves to at least one of the 16 Compass domains
  * every industry file covers all 16 domains

This is an interim validator. The production seeder lives in packages/core
(Slice 3) and must normalise the same layouts — see docs/QUESTION_FORMAT.md.

Usage:  python3 tools/question_inventory.py [--markdown OUT.md]
Exit 1 on any invariant violation.
"""
import collections
import glob
import os
import re
import sys

DOMAINS = ["GOV", "INV", "ROPA", "PURPOSE", "NOTICE", "CONSENT", "RIGHTS", "GRIEVANCE",
           "RETENTION", "ACCURACY", "SECURITY", "BREACH", "VENDOR", "CHILD",
           "CROSSBORDER", "SDF_AI"]
DOMAIN_ID = {code: f"D{i:02d}" for i, code in enumerate(DOMAINS, start=1)}

# Headings that name a domain in words rather than by code (Public Sector file).
DOMAIN_NAMES = [
    ("governance", "GOV"), ("discovery", "INV"), ("inventory", "INV"),
    ("processing activit", "ROPA"), ("ropa", "ROPA"), ("purpose", "PURPOSE"),
    ("notice", "NOTICE"), ("consent and", "CONSENT"), ("consent &", "CONSENT"),
    ("data principal rights", "RIGHTS"), ("grievance", "GRIEVANCE"),
    ("retention", "RETENTION"), ("accuracy", "ACCURACY"),
    ("security safeguard", "SECURITY"), ("breach", "BREACH"), ("vendor", "VENDOR"),
    ("children", "CHILD"), ("cross-border", "CROSSBORDER"), ("sdf", "SDF_AI"),
]
CODE = re.compile(r"^[A-Z]{2,}[A-Z0-9]*(-[A-Z0-9]+)+$")
ROOT = os.path.join(os.path.dirname(__file__), "..", "docs", "question_packs", "industry")


def heading_domain(line):
    found = [d for d in DOMAINS if re.search(r"(`|—\s*|\b)" + d + r"(`|\b)", line)]
    if not found:
        low = line.lower()
        found = [d for key, d in DOMAIN_NAMES if key in low]
    return found[-1] if found else None


def row_domains(row, section_domain):
    """Domains from an explicit Domain column (may be 'PURPOSE / INV'), else the section."""
    explicit = row.get("Domain", "")
    codes = [c.strip() for c in explicit.split("/") if c.strip() in DOMAIN_ID]
    return codes or ([section_domain] if section_domain else [])


def parse(path):
    section_domain, header, section, rows = None, None, None, []
    with open(path, encoding="utf-8") as fh:
        for lineno, raw in enumerate(fh, start=1):
            line = raw.rstrip("\n")
            if line.startswith("#"):
                section = line.lstrip("#").strip()
                section_domain, header = heading_domain(line), None
                continue
            if not line.startswith("|"):
                continue
            cells = [c.strip().strip("`").strip() for c in line.strip().strip("|").split("|")]
            if cells[0] in ("Code", "ID", "Question ID"):
                header = cells
                continue
            if header and CODE.match(cells[0]) and len(cells) >= 3:
                row = dict(zip(header, cells))
                row["_domains"] = row_domains(row, section_domain)
                row["_section"], row["_line"] = section, lineno
                rows.append(row)
    return rows


def main():
    files = sorted(glob.glob(os.path.join(ROOT, "*.md")))
    seen, errors, report = {}, [], []
    total = 0
    for path in files:
        name = os.path.basename(path)
        rows = parse(path)
        total += len(rows)
        covered = collections.Counter(d for r in rows for d in r["_domains"])
        priority_key = next((k for k in (rows[0] if rows else {}) if k.startswith("Priority")), None)
        priorities = collections.Counter(r.get(priority_key, "—") for r in rows) if priority_key else {}
        multi = sum(1 for r in rows if len(r["_domains"]) > 1)
        layouts = {tuple(k for k in r if not k.startswith("_")) for r in rows}
        for r in rows:
            code = r[next(iter(r))]
            if code in seen:
                errors.append(f"{name}:{r['_line']} duplicate code {code} (first at {seen[code]})")
            else:
                seen[code] = f"{name}:{r['_line']}"
            if not r["_domains"]:
                errors.append(f"{name}:{r['_line']} {code} resolves to no domain")
        missing = [d for d in DOMAINS if d not in covered]
        if missing:
            errors.append(f"{name} missing domains: {', '.join(missing)}")
        report.append((name, len(rows), 16 - len(missing), dict(priorities), multi, layouts))

    print(f"{len(files)} industry file(s), {total} questions, {len(seen)} unique codes")
    for name, n, cov, pri, multi, layouts in report:
        print(f"  {name}: {n} q, {cov}/16 domains, priority={pri or 'NONE'}, multi-domain={multi}")
    for e in errors:
        print(f"::error::{e}")

    if "--markdown" in sys.argv:
        out = sys.argv[sys.argv.index("--markdown") + 1]
        write_markdown(out, report, total, len(seen))
    return 1 if errors else 0


def write_markdown(out, report, total, unique):
    lines = [
        "# Industry question pack inventory",
        "",
        "Generated by `tools/question_inventory.py --markdown`. Do not edit by hand —",
        "re-run the tool after changing any file in `industry/`.",
        "",
        f"**{len(report)} industry files · {total} questions · {unique} unique codes · 0 duplicates**",
        "",
        "| File | Questions | Domains | Priority split | Multi-domain rows | Column layout |",
        "|---|---:|---:|---|---:|---|",
    ]
    for name, n, cov, pri, multi, layouts in report:
        pri_s = " · ".join(f"{k} {v}" for k, v in sorted(pri.items())) if pri else "**none**"
        lay = "<br>".join(" · ".join(l) for l in sorted(layouts))
        lines.append(f"| `{name}` | {n} | {cov}/16 | {pri_s} | {multi} | {lay} |")
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    sys.exit(main())
