# pdf-to-markdown

Lightweight PDF-to-Markdown converter for token-efficient Claude interactions. Converts text-heavy PDFs (academic papers, reports, documentation) to clean Markdown before feeding them to Claude, reducing token consumption significantly.

## Why?

When you upload a PDF to Claude (especially via API), each page can be processed as an image — consuming 1000–1600 tokens per page. The same content as plain text is typically 200–400 tokens. This tool bridges that gap by extracting text and structure into Markdown **before** Claude sees it.

## Features

- **Heading detection** — Font size analysis relative to document median → `#`, `##`, `###`
- **Table extraction** — pdfplumber-powered table detection → Markdown tables
- **Text cleanup** — Hyphenation rejoining, whitespace normalization, artifact removal
- **Page separation** — Horizontal rules between pages
- **Zero install** — Uses `pdfminer.six` and `pdfplumber`, both pre-installed in Claude's environment

## Usage

### Standalone

```bash
python3 pdf_to_markdown.py input.pdf [output.md]
```

If output path is omitted, writes `<input_stem>.md` in the same directory.

### As a Claude Skill

1. Download `pdf-to-markdown.skill` from [Releases](../../releases)
2. Install in Claude (Settings → Skills → Import)
3. The skill auto-triggers when you upload a PDF

### Manual install

Copy the `pdf-to-markdown/` folder to your Claude skills directory:

```
pdf-to-markdown/
├── SKILL.md
└── scripts/
    └── pdf_to_markdown.py
```

## Example

```
$ python3 pdf_to_markdown.py paper.pdf

✓ paper.pdf → paper.md
  PDF:      2,159 bytes
  Markdown: 696 bytes
  Size reduction: 67.8%
  Pages: 1
```

Output:

```markdown
# Computational Analysis of Metal Complexes

### A Force Field Parameterization Study

Author: B. Kurt, Department of Chemistry

## Abstract

This study presents a novel approach to force field parameterization...

## Methods

Force field parameters were derived using the Seminario method...
```

## Limitations

- **Scanned PDFs** — Image-only pages produce empty output. Use OCR tools instead.
- **Multi-column layouts** — Column ordering may be incorrect in complex layouts.
- **Math formulas** — Extracted as plain text, no LaTeX conversion.
- **Figures** — Skipped (text-only extraction).

## Dependencies

| Package | Purpose | Pre-installed? |
|---------|---------|----------------|
| pdfminer.six | Text extraction + layout analysis | ✅ |
| pdfplumber | Table detection + extraction | ✅ |

## License

Apache-2.0
