#!/usr/bin/env python3
"""
pdf_to_markdown.py — Lightweight PDF-to-Markdown converter for token-efficient
Claude interactions.

Uses pdfminer.six for text extraction and pdfplumber for table detection.
Both are pre-installed in the Claude environment (no pip install needed).

Usage:
    python3 pdf_to_markdown.py input.pdf [output.md]

If output path is omitted, writes to <input_stem>.md in the same directory.
"""

import sys
import re
import argparse
from pathlib import Path

from pdfminer.high_level import extract_pages
from pdfminer.layout import (
    LAParams,
    LTTextContainer,
    LTChar,
    LTAnno,
    LTFigure,
)
import pdfplumber


def get_text_with_sizes(element):
    """Extract text and font sizes from a text container."""
    chars = []
    for text_line in element:
        for character in text_line:
            if isinstance(character, LTChar):
                chars.append((character.get_text(), character.size))
            elif isinstance(character, LTAnno):
                chars.append((character.get_text(), None))
    return chars


def classify_heading(font_size, median_size):
    """Classify text as heading based on font size relative to median."""
    if font_size is None or median_size is None:
        return None
    ratio = font_size / median_size
    if ratio >= 1.8:
        return 1
    elif ratio >= 1.4:
        return 2
    elif ratio >= 1.15:
        return 3
    return None


def extract_tables_for_page(pdf_plumber_page):
    """Extract tables from a page using pdfplumber, return as markdown."""
    tables = pdf_plumber_page.extract_tables()
    md_tables = []
    for table in tables:
        if not table or len(table) < 2:
            continue
        # Clean cells
        cleaned = []
        for row in table:
            cleaned.append([
                (cell or "").replace("\n", " ").strip() for cell in row
            ])

        # Build markdown table
        header = cleaned[0]
        col_count = len(header)
        lines = []
        lines.append("| " + " | ".join(header) + " |")
        lines.append("| " + " | ".join(["---"] * col_count) + " |")
        for row in cleaned[1:]:
            # Pad or trim to col_count
            padded = row[:col_count] + [""] * max(0, col_count - len(row))
            lines.append("| " + " | ".join(padded) + " |")
        md_tables.append("\n".join(lines))
    return md_tables


def clean_text(text):
    """Clean extracted text: fix hyphenation, collapse whitespace."""
    # Rejoin hyphenated words at line breaks
    text = re.sub(r"-\n(\S)", r"\1", text)
    # Collapse multiple spaces (but preserve newlines)
    text = re.sub(r"[^\S\n]+", " ", text)
    # Collapse 3+ newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def pdf_to_markdown(pdf_path, output_path=None):
    """Convert PDF to markdown."""
    pdf_path = Path(pdf_path)
    if output_path is None:
        output_path = pdf_path.with_suffix(".md")
    else:
        output_path = Path(output_path)

    # --- Pass 1: Collect all font sizes to find median ---
    all_sizes = []
    laparams = LAParams(
        line_margin=0.5,
        word_margin=0.1,
        char_margin=2.0,
        boxes_flow=0.5,
    )
    for page_layout in extract_pages(str(pdf_path), laparams=laparams):
        for element in page_layout:
            if isinstance(element, LTTextContainer):
                chars = get_text_with_sizes(element)
                sizes = [s for _, s in chars if s is not None]
                all_sizes.extend(sizes)

    median_size = None
    if all_sizes:
        all_sizes.sort()
        mid = len(all_sizes) // 2
        median_size = all_sizes[mid]

    # --- Pass 2: Build markdown ---
    md_parts = []
    plumber_pdf = pdfplumber.open(str(pdf_path))

    page_num = 0
    for page_layout in extract_pages(str(pdf_path), laparams=laparams):
        page_tables_md = []
        if page_num < len(plumber_pdf.pages):
            page_tables_md = extract_tables_for_page(
                plumber_pdf.pages[page_num]
            )

        page_text_parts = []

        for element in page_layout:
            if isinstance(element, LTTextContainer):
                chars = get_text_with_sizes(element)
                text = "".join(c for c, _ in chars)
                text = clean_text(text)

                if not text.strip():
                    continue

                # Check if this block is a heading
                sizes = [s for _, s in chars if s is not None]
                if sizes:
                    avg_size = sum(sizes) / len(sizes)
                    heading_level = classify_heading(avg_size, median_size)
                    if heading_level and len(text) < 200:
                        # Single-line heading
                        text = text.replace("\n", " ").strip()
                        page_text_parts.append(
                            f"\n{'#' * heading_level} {text}\n"
                        )
                        continue

                page_text_parts.append(text)

        # Combine page text
        page_content = "\n\n".join(page_text_parts)

        # Append tables at end of page
        if page_tables_md:
            page_content += "\n\n" + "\n\n".join(page_tables_md)

        if page_content.strip():
            md_parts.append(page_content)

        page_num += 1

    plumber_pdf.close()

    # Final assembly
    markdown = "\n\n---\n\n".join(md_parts)

    # Final cleanup
    markdown = re.sub(r"\n{3,}", "\n\n", markdown)

    output_path.write_text(markdown, encoding="utf-8")

    # Stats
    pdf_size = pdf_path.stat().st_size
    md_size = output_path.stat().st_size
    ratio = (1 - md_size / pdf_size) * 100 if pdf_size > 0 else 0

    print(f"✓ {pdf_path.name} → {output_path.name}")
    print(f"  PDF:      {pdf_size:,} bytes")
    print(f"  Markdown: {md_size:,} bytes")
    print(f"  Size reduction: {ratio:.1f}%")
    print(f"  Pages: {page_num}")

    return str(output_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert PDF to Markdown for token-efficient Claude usage"
    )
    parser.add_argument("input", help="Input PDF file path")
    parser.add_argument("output", nargs="?", help="Output .md path (optional)")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"Error: {args.input} not found", file=sys.stderr)
        sys.exit(1)

    result = pdf_to_markdown(args.input, args.output)
    print(f"  Output: {result}")
