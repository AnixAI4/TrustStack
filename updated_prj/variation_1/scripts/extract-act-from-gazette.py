"""Extract the DPDP Act text from its official Gazette PDF.

Requires PyMuPDF (`fitz`). The extractor is intentionally pinned to the
published Gazette file so a changed upstream document cannot silently alter
the checked-in statutory text.
"""

from __future__ import annotations

import argparse
import hashlib
import re
from collections import defaultdict
from pathlib import Path

import fitz


GAZETTE_ID = "CG-DL-E-12082023-248045"
GAZETTE_SHA256 = "4deb23981d3010c8225a2ff6149e7243dc2268455b299e283afebdd7b72a7d15"
GAZETTE_URL = "https://egazette.gov.in/WriteReadData/2023/248045.pdf"

SECTION_TITLES = (
    "Short title and commencement",
    "Definitions",
    "Application of Act",
    "Grounds for processing personal data",
    "Notice",
    "Consent",
    "Certain legitimate uses",
    "General obligations of Data Fiduciary",
    "Processing of personal data of children",
    "Additional obligations of Significant Data Fiduciary",
    "Right to access information about personal data",
    "Right to correction and erasure of personal data",
    "Right of grievance redressal",
    "Right to nominate",
    "Duties of Data Principal",
    "Processing of personal data outside India",
    "Exemptions",
    "Establishment of Board",
    "Composition and qualifications for appointment of Chairperson and Members",
    "Salary, allowances payable to and term of office",
    "Disqualifications for appointment and continuation as Chairperson and Members of Board",
    "Resignation by Members and filling of vacancy",
    "Proceedings of Board",
    "Officers and employees of Board",
    "Members and officers to be public servants",
    "Powers of Chairperson",
    "Powers and functions of Board",
    "Procedure to be followed by Board",
    "Appeal to Appellate Tribunal",
    "Orders passed by Appellate Tribunal to be executable as decree",
    "Alternate dispute resolution",
    "Voluntary undertaking",
    "Penalties",
    "Crediting sums realised by way of penalties to Consolidated Fund of India",
    "Protection of action taken in good faith",
    "Power to call for information",
    "Power of Central Government to issue directions",
    "Consistency with other laws",
    "Bar of jurisdiction",
    "Power to make rules",
    "Laying of rules and certain notifications",
    "Power to amend Schedule",
    "Power to remove difficulties",
    "Amendments to certain Acts",
)

CHAPTERS = {
    1: "Chapter I. Preliminary",
    4: "Chapter II. Obligations of Data Fiduciary",
    11: "Chapter III. Rights and Duties of Data Principal",
    16: "Chapter IV. Special Provisions",
    18: "Chapter V. Data Protection Board of India",
    27: "Chapter VI. Powers, Functions and Procedure to be Followed by Board",
    29: "Chapter VII. Appeal and Alternate Dispute Resolution",
    33: "Chapter VIII. Penalties and Adjudication",
    35: "Chapter IX. Miscellaneous",
}

CHAPTER_LINE = re.compile(r"^CHAPTER\s+[IVXLCDM]+$", re.IGNORECASE)
PARAGRAPH_START = re.compile(
    r"^(?:\((?:\d+|[a-z]+|[A-Z]+)\)\s|Illustrations?\.|Explanation\.)"
)
SECTION_START = re.compile(r"^(\d{1,2})\.\s+(.+)$")


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def body_lines(document: fitz.Document) -> list[str]:
    lines: list[str] = []
    for page_index in range(20):
        page = document[page_index]
        grouped: dict[tuple[int, int], list[tuple]] = defaultdict(list)
        for word in page.get_text("words", sort=True):
            grouped[(word[5], word[6])].append(word)

        page_lines = []
        for words in grouped.values():
            words.sort(key=lambda word: word[7])
            x0 = min(word[0] for word in words)
            y0 = min(word[1] for word in words)
            x1 = max(word[2] for word in words)

            if page_index == 0:
                if y0 < 690:
                    continue
            elif y0 < 90 or y0 >= 780:
                continue

            # The Act body occupies the central column. Marginal blocks contain
            # section titles and cross-references to other Acts.
            if x1 < 112 or x0 > 482:
                continue

            text = squash(" ".join(word[4] for word in words))
            if not text or CHAPTER_LINE.match(text):
                continue
            if text.upper() in {
                "PRELIMINARY",
                "OBLIGATIONS OF DATA FIDUCIARY",
                "RIGHTS AND DUTIES OF DATA PRINCIPAL",
                "SPECIAL PROVISIONS",
                "DATA PROTECTION BOARD OF INDIA",
                "POWERS, FUNCTIONS AND PROCEDURE TO BE FOLLOWED BY BOARD",
                "APPEAL AND ALTERNATE DISPUTE RESOLUTION",
                "PENALTIES AND ADJUDICATION",
                "MISCELLANEOUS",
            }:
                continue
            page_lines.append((y0, x0, text))

        page_lines.sort(key=lambda line: (round(line[0], 1), line[1]))
        lines.extend(text for _, _, text in page_lines)
    return lines


def extract_sections(document: fitz.Document) -> dict[int, list[str]]:
    sections: dict[int, list[str]] = {}
    current_number = 0
    paragraphs: list[str] = []

    def flush_paragraph() -> None:
        nonlocal paragraphs
        if paragraphs and current_number:
            sections[current_number].append(squash(" ".join(paragraphs)))
        paragraphs = []

    for line in body_lines(document):
        section_match = SECTION_START.match(line)
        if section_match and int(section_match.group(1)) == current_number + 1:
            flush_paragraph()
            current_number += 1
            sections[current_number] = []
            paragraphs = [section_match.group(2)]
            continue

        if not current_number:
            continue
        if PARAGRAPH_START.match(line):
            flush_paragraph()
        paragraphs.append(line)

    flush_paragraph()
    return sections


def column_text(words: list[tuple], left: float, right: float, top: float, bottom: float) -> str:
    selected = [
        word
        for word in words
        if left <= word[0] < right and top <= word[1] < bottom
    ]
    selected.sort(key=lambda word: (round(word[1], 1), word[0]))
    return squash(" ".join(word[4] for word in selected))


def extract_schedule(document: fitz.Document) -> list[tuple[str, str]]:
    words = document[20].get_text("words", sort=True)
    row_starts = sorted(
        (word[1], int(word[4].rstrip(".")))
        for word in words
        if 120 <= word[0] < 150 and re.fullmatch(r"[1-7]\.", word[4])
    )
    if [number for _, number in row_starts] != list(range(1, 8)):
        raise ValueError("Could not locate all seven Schedule rows")

    rows = []
    for index, (top, _) in enumerate(row_starts):
        bottom = row_starts[index + 1][0] if index + 1 < len(row_starts) else 550
        breach = column_text(words, 155, 400, top - 1, bottom - 1)
        penalty = column_text(words, 400, 480, top - 1, bottom - 1)
        rows.append((breach, penalty))
    return rows


def verify(sections: dict[int, list[str]], schedule: list[tuple[str, str]]) -> None:
    if list(sections) != list(range(1, 45)):
        raise ValueError(f"Expected sections 1-44; found {list(sections)}")
    checks = {
        3: "(b) also apply to processing of digital personal data outside the territory of India",
        5: "(b) the Data Fiduciary may continue to process the personal data",
        7: "(i) for the purposes of employment",
        10: "(b) appoint an independent data auditor",
        44: "(iii) the Appellate Tribunal under the Digital Personal Data Protection Act, 2023",
    }
    for number, phrase in checks.items():
        body = " ".join(sections[number])
        if phrase not in body:
            raise ValueError(f"Section {number} is missing: {phrase}")
    if "THE SCHEDULE" in " ".join(sections[44]):
        raise ValueError("The Schedule was incorrectly included in section 44")
    if len(schedule) != 7:
        raise ValueError(f"Expected seven Schedule rows; found {len(schedule)}")


def render(sections: dict[int, list[str]], schedule: list[tuple[str, str]]) -> str:
    output = [
        "# The Digital Personal Data Protection Act, 2023",
        "",
        "Act No. 22 of 2023 · 11 August 2023",
        f"Official Gazette publication: {GAZETTE_ID}",
        f"Official PDF: {GAZETTE_URL}",
        f"PDF SHA-256: {GAZETTE_SHA256}",
        "",
        "## Preamble",
        "",
        "An Act to provide for the processing of digital personal data in a manner that recognises both the right of individuals to protect their personal data and the need to process such personal data for lawful purposes and for matters connected therewith or incidental thereto.",
        "",
        "BE it enacted by Parliament in the Seventy-fourth Year of the Republic of India as follows: - ",
    ]

    for number in range(1, 45):
        if number in CHAPTERS:
            output.extend(("", f"## {CHAPTERS[number]}"))
        output.extend(("", f"### Section {number}. {SECTION_TITLES[number - 1]}", ""))
        output.append("\n\n".join(sections[number]))

    output.extend(
        (
            "",
            "## The Schedule",
            "",
            "[See section 33(1)]",
            "",
            "| Sl. No. | Breach of provisions of this Act or rules made thereunder | Penalty |",
            "| --- | --- | --- |",
        )
    )
    for number, (breach, penalty) in enumerate(schedule, start=1):
        output.append(f"| {number}. | {breach} | {penalty} |")
    return "\n".join(output) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    digest = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    if digest != GAZETTE_SHA256:
        raise SystemExit(f"Unexpected Gazette PDF SHA-256: {digest}")

    document = fitz.open(args.pdf)
    if len(document) != 21:
        raise SystemExit(f"Expected 21 Gazette pages; found {len(document)}")

    sections = extract_sections(document)
    schedule = extract_schedule(document)
    verify(sections, schedule)
    args.output.write_text(render(sections, schedule), encoding="utf-8", newline="\n")
    print(f"Wrote {len(sections)} sections and {len(schedule)} Schedule rows to {args.output}")


if __name__ == "__main__":
    main()