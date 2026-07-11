#!/usr/bin/env python3
"""Generate fair-practices-code-kannada.ts from the official PDF."""

import re
from pathlib import Path

import fitz

PDF = Path(
    "/Users/rahulboggaram/Downloads/08062026 - Fair Practices Code - YML - Kannada.pdf"
)
OUT = Path(__file__).resolve().parent.parent / "src/content/fair-practices-code-kannada.ts"

PART1_H2 = (
    "ಭಾಗ I – ಸಾಮಾನ್ಯ ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿಗಳು "
    "(ಕಂಪನಿಯ ಎಲ್ಲಾ ವ್ಯವಹಾರ ವಿಭಾಗಗಳಿಗೆ ಅನ್ವಯಿಸುತ್ತವೆ)"
)
PART2_H2 = "ಭಾಗ II – ಚಿನ್ನದ ಸಾಲ ವ್ಯವಹಾರಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ವಿಶೇಷ ನಿಯಮಗಳು"


def clean(s: str) -> str:
    s = re.sub(r"-\s+", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def load_text() -> str:
    doc = fitz.open(PDF)
    lines = [
        clean(line)
        for page in doc
        for line in page.get_text().split("\n")
        if clean(line)
    ]
    full = " ".join(lines)
    idx = full.find("ಪರಿಚಯ")
    if idx == -1:
        raise SystemExit("Could not find intro marker in PDF")
    return full[idx:]


def parse_body(body: str, blocks: list[tuple[str, str]]) -> None:
    body = body.strip()
    if not body:
        return

    items = re.split(r"(?=(?:\d+\.\s+|•\s+))", body)
    pending: list[str] = []

    def flush_pending() -> None:
        if pending:
            text = clean(" ".join(pending))
            if text:
                blocks.append(("p", text))
            pending.clear()

    for item in items:
        item = item.strip()
        if not item:
            continue
        if re.match(r"^\d+\.", item) or item.startswith("•"):
            flush_pending()
            blocks.append(("p", item))
        else:
            pending.append(item)

    flush_pending()


def split_title_body(section: str, letter: str) -> tuple[str, str]:
    section = re.sub(rf"^{letter}\.\s+", "", section).strip()
    if letter == "O":
        short = re.match(r"^(.+?ಹರಾಜು ಪರಕರಯೆ)\s+(.*)$", section, re.DOTALL)
        if short:
            return clean(short.group(1)), short.group(2).strip()

    numbered = re.search(r"\d+\.\s+", section)
    if numbered:
        return clean(section[: numbered.start()]), section[numbered.start() :].strip()

    # Sections F and H have no numbered lists; G mixes bullets later.
    if letter == "F":
        marker = "ಮರುಪಾವ್ತಿಗೆ"
    elif letter == "G":
        marker = "ಯೆಲ್ಲದ ಮೆಟಲ್"
    elif letter == "H":
        marker = "ಈ ನ್ಯಾಯಸಮತ"
    else:
        marker = None

    if marker:
        pos = section.find(marker)
        if pos > 0:
            return clean(section[:pos]), section[pos:].strip()

    return clean(section[:80]), section[80:].strip()


def split_objectives(text: str) -> list[str]:
    chunks = re.split(r"\s*•\s+", text)
    return [clean(c) for c in chunks if clean(c)]


def generate() -> list[tuple[str, str]]:
    full = load_text()
    blocks: list[tuple[str, str]] = [
        ("title", "Fair Practices Code - Kannada"),
        ("subtitle", "ನ್ಯಾಯಸಮ್ಮತ ವ್ಯವಹಾರ ಪದ್ಧತಿ ಸಂಹಿತೆ"),
        (
            "meta",
            "ಆವೃತ್ತಿ 1/2026-27 · ಜಾರಿಗೆ 8 ಜೂನ್ 2026 · ನಿರ್ದೇಶಕರ ಮಂಡಳಿಯ ಅನುಮೋದನೆ",
        ),
    ]

    first_a = re.search(r"A\.\s+ಸಾಲ", full)
    if not first_a:
        raise SystemExit("Could not find section A")

    intro = full[: first_a.start()].strip()
    intro = re.sub(r"^ಪರಿಚಯ\s*", "", intro)

    blocks.append(("h2", "ಪರಿಚಯ"))

    two_parts = intro.find("ಈ ಸಂಹಿತೆಯನ್ನು ಎರಡು")
    if two_parts != -1:
        blocks.append(("p", intro[:two_parts].strip()))
        remainder = intro[two_parts:]
    else:
        remainder = intro

    part1_idx = remainder.find("ಭಾಗ–I")
    if part1_idx == -1:
        part1_idx = remainder.find("ಭಾಗ – I")

    if part1_idx != -1:
        before_parts = remainder[:part1_idx].strip()
        if before_parts:
            blocks.append(("p", before_parts))

        part2_idx = remainder.find("ಭಾಗ–II")
        if part2_idx == -1:
            part2_idx = remainder.find("ಭಾಗ – II")

        part1_text = remainder[part1_idx:part2_idx if part2_idx != -1 else len(remainder)]
        blocks.append(("p", clean(part1_text.replace("ಭಾಗ–I :", "ಭಾಗ I:"))))

        if part2_idx != -1:
            after_part2 = remainder[part2_idx:]
            objectives_idx = after_part2.find("ಈ ಸಂಹಿತೆಯ ಉದ್ದೇಶ")
            if objectives_idx != -1:
                part2_text = after_part2[:objectives_idx].strip()
                objectives_text = after_part2[objectives_idx:].strip()
            else:
                part2_text = after_part2
                objectives_text = ""

            blocks.append(("p", clean(part2_text.replace("ಭಾಗ–II :", "ಭಾಗ II:"))))

            if objectives_text:
                obj_header_end = objectives_text.find("•")
                if obj_header_end != -1:
                    blocks.append(("p", objectives_text[:obj_header_end].strip()))
                    for item in split_objectives(objectives_text[obj_header_end:]):
                        blocks.append(("p", item))
                else:
                    blocks.append(("p", objectives_text))

    part1_repeat = full.find("ಭಾಗ – I ಸಾಮಾನಾ")
    if part1_repeat != -1 and part1_repeat < first_a.start():
        end = full.find("A.", part1_repeat)
        p1_detail = full[part1_repeat:end].strip()
        p1_detail = re.sub(r"^ಭಾಗ\s*[–-]?\s*I\s*", "", p1_detail)
        blocks.append(("h2", PART1_H2))
        blocks.append(("p", p1_detail))

    sections = re.split(r"(?=[A-P]\.\s+)", full[first_a.start() :])

    for section in sections:
        section = section.strip()
        if not section:
            continue

        letter_match = re.match(r"^([A-P])\.\s+", section)
        if not letter_match:
            continue
        letter = letter_match.group(1)
        title, body = split_title_body(section, letter)

        if letter == "H":
            part2 = re.search(r"ಭಾಗ\s*II", body)
            if part2:
                h_body = body[: part2.start()].strip()
                blocks.append(("h3", f"{letter}. {title}"))
                parse_body(h_body, blocks)

                blocks.append(("h2", PART2_H2))
                after = body[part2.start() :]
                after = re.sub(r"^ಭಾಗ\s*II[^–]*–\s*", "", after)
                i_match = re.search(r"I\.\s+KYC", after)
                if i_match:
                    part2_intro = after[: i_match.start()].strip()
                    body = after[i_match.start() :].strip()
                else:
                    part2_intro = after
                    body = ""
                if part2_intro:
                    blocks.append(("p", part2_intro))
            else:
                blocks.append(("h3", f"{letter}. {title}"))
                parse_body(body, blocks)
                body = ""
        else:
            blocks.append(("h3", f"{letter}. {title}"))
            parse_body(body, blocks)
            body = ""

        if body:
            subsections = re.split(r"(?=[A-P]\.\s+)", body)
            for sub in subsections:
                sub = sub.strip()
                if not sub:
                    continue
                sub_letter_match = re.match(r"^([A-P])\.\s+", sub)
                if not sub_letter_match:
                    parse_body(sub, blocks)
                    continue
                sub_letter = sub_letter_match.group(1)
                sub_title, sub_body = split_title_body(sub, sub_letter)
                blocks.append(("h3", f"{sub_letter}. {sub_title}"))
                parse_body(sub_body, blocks)

    filtered: list[tuple[str, str]] = []
    for typ, text in blocks:
        if typ == "p" and not text.strip():
            continue
        if filtered and typ in ("h2", "h3") and filtered[-1] == (typ, text):
            continue
        filtered.append((typ, text))

    return filtered


def write_ts(blocks: list[tuple[str, str]]) -> None:
    lines = [
        'import type { LegalBlock } from "@/components/legal-document";',
        "",
        "export const FAIR_PRACTICES_CODE_KANNADA_BLOCKS = [",
    ]
    for typ, text in blocks:
        lines.append(f'  {{ type: "{typ}", text: "{esc(text)}" }},')
    lines.append("] as const satisfies readonly LegalBlock[];")
    lines.append("")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(blocks)} blocks to {OUT}")


if __name__ == "__main__":
    write_ts(generate())
