---
name: pdf-to-markdown
description: "Lightweight PDF-to-Markdown pre-processor for token-efficient Claude interactions. Use this skill BEFORE reading or analyzing any uploaded PDF file. It converts PDF content to clean Markdown using pdfminer.six and pdfplumber (both pre-installed, zero pip overhead), preserving headings, paragraphs, and tables. This dramatically reduces token consumption compared to raw PDF ingestion — especially for text-heavy academic papers, reports, and documentation. Triggers: any PDF upload, any mention of 'read this PDF', 'analyze this paper', 'summarize this document', or when a .pdf file path appears in /mnt/user-data/uploads/. Always run this conversion FIRST, then work with the resulting .md file."
---

# PDF-to-Markdown Pre-processor

## Purpose

Convert uploaded PDFs to clean Markdown **before** processing, reducing token usage significantly for text-heavy documents (academic papers, reports, manuals).

## When to Use

- A PDF file is uploaded and needs to be read/analyzed/summarized
- Multiple PDFs need batch processing
- The PDF is text-heavy (papers, reports, documentation)

## When NOT to Use

- PDF is already in context as extracted text (check first)
- Task requires visual inspection of PDF layout (charts, figures, scanned pages)
- Task is PDF creation/editing (use the `pdf` skill instead)

## How to Use

### Single PDF

```bash
python3 /path/to/scripts/pdf_to_markdown.py /mnt/user-data/uploads/document.pdf /home/claude/document.md
```

### Then read the markdown

```bash
cat /home/claude/document.md
```

Or use the `view` tool on the resulting `.md` file.

## What It Does

1. **Text extraction** via pdfminer.six with tuned layout parameters
2. **Heading detection** — font size analysis relative to document median; classifies H1/H2/H3
3. **Table extraction** via pdfplumber → Markdown tables
4. **Text cleanup** — rejoins hyphenated words, collapses whitespace, removes artifacts
5. **Page separation** with horizontal rules (`---`)

## Dependencies

- `pdfminer.six` — pre-installed in Claude environment
- `pdfplumber` — pre-installed in Claude environment
- **No pip install needed**

## Limitations

- Scanned/image-only PDFs will produce empty or minimal output — fall back to OCR or page rasterization (see `pdf-reading` skill)
- Complex multi-column layouts may have ordering issues
- Mathematical formulas are extracted as plain text (no LaTeX conversion)
- Figures/images are skipped (text-only extraction)

## Output

Clean Markdown file with:
- `#`, `##`, `###` headings based on font size
- Paragraph text with proper line breaks
- Markdown tables where detected
- `---` page separators
