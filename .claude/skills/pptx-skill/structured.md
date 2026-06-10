# Structured Argument Decks

Use this guide when building analytical or structured presentations: board decks, investor updates, strategy reviews, policy briefings, consulting-style deliverables, internal reviews, client presentations, and results decks.

**Priority order: argument structure → data → layout → aesthetics.** Design serves the argument, not the other way around.

---

## Core Principles

### 1. Action Titles

Every slide gets a **complete sentence** as its title — stating the takeaway, not the topic.

| ❌ Topic label | ✅ Action title |
|---|---|
| "Revenue" | "Revenue grew 34% YoY, driven by enterprise expansion" |
| "Market Opportunity" | "The addressable market is $4.2B and largely untapped" |
| "Risks" | "Three execution risks require mitigation before Q2 launch" |
| "Team" | "The team has deep domain expertise across all critical functions" |
| "Recommendation" | "We recommend exiting the EU market by end of Q3" |

Action titles must be:
- **Declarative sentences** with a subject and verb
- **Specific** — include the key number, direction, or claim
- **Stand-alone** — readable without seeing the slide body

### 2. Ghost Deck Test

Before finalizing the deck, read only the action titles in sequence. They should form a coherent argument on their own.

If reading the titles produces a logical, complete narrative → the deck is well-structured.  
If the titles feel disconnected, repetitive, or vague → restructure before adding content.

This is the single most reliable test of deck quality.

### 3. Storyline and Logic Flow

Slides should build a structured argument. Common frameworks:

**Situation → Complication → Resolution (SCR)**
> Slide 1: "We are the market leader with 42% share" (Situation)  
> Slide 2: "New entrants are eroding margin in our core segment" (Complication)  
> Slide 3: "Acquiring TechCo would restore our competitive position" (Resolution)

**Answer-First (Pyramid Principle)**
> Lead with the conclusion on slide 1 or 2.  
> Group supporting evidence by theme.  
> Each theme has a summary action title that supports the top-level answer.

**Before/After or Problem/Solution**
> Define the current state clearly before presenting a solution.

**Do not** treat each slide as an independent design problem. Every slide's action title should link logically to the one before and after it.

### 4. Exhibit Discipline

One exhibit (chart, table, diagram, or framework) per slide. Every exhibit must:

1. Connect directly to the action title — the "so what" is in the title
2. Be simple enough to read in 10 seconds
3. Have a source citation (see [Source Lines](#source-lines))

**Prohibited on structured slides:**
- Decorative icons (not tied to data)
- Icon grids used as visual filler
- Stock photography without analytical purpose
- Multiple unrelated charts on one slide

If an exhibit needs explanation, simplify the exhibit — don't add more text.

### 5. Source Lines

Every data exhibit gets a source citation:
- Position: bottom-left of the slide
- Font: 8-10pt, gray (e.g., `808080`)
- Format: `Source: [Organization], [Year]` or `Source: Internal data, [Period]`

Example: `Source: Bloomberg, Q4 2025` or `Source: Company financials, FY2025`

---

## Formatting Rules

### Typography

**One sans-serif font throughout. No exceptions.**

Recommended: Arial, Calibri, or Helvetica.

| Element | Size | Style |
|---|---|---|
| Action title | 24-28pt | Bold |
| Section header / exhibit title | 16-18pt | Bold |
| Body text / supporting points | 12-14pt | Regular |
| Axis labels, legends | 9-11pt | Regular |
| Source line | 8-10pt | Regular, gray |

Do not mix fonts. Do not use decorative or serif fonts for body text.

### Color

**Grayscale + one accent color. White backgrounds for content slides.**

| Use | Color |
|---|---|
| Background (content slides) | White (`FFFFFF`) |
| Primary text | Near-black (`1A1A1A` or `212121`) |
| Supporting text | Dark gray (`595959` or `666666`) |
| Data accent / highlight | One color only — your organization's brand color, or `2266CC` (blue) as a neutral default |
| Gridlines, borders | Light gray (`D0D0D0` or `E0E0E0`) |
| Source lines | Medium gray (`808080`) |

**Do not:**
- Use more than one accent color
- Use color for decoration (colored circles around icons, colored section dividers)
- Use colored backgrounds on content slides
- Use gradients

Dark backgrounds are acceptable for title and divider slides only.

### Layout

**Prioritize clarity over visual interest.**

Standard content slide structure (top to bottom):
1. **Action title** — full width, top of slide, 24-28pt bold
2. **Exhibit** — chart, table, or framework; centered or left-aligned
3. **Supporting bullets** (optional) — 2-4 short points that reinforce the action title; never repeat what the exhibit shows
4. **Source line** — bottom-left, 8-10pt gray

Margins: 0.5" minimum on all sides.

Line spacing: 1.15–1.3 for body text. More space between sections than within them.

**Do not:**
- Use decorative elements (colored rectangles, icon rows) that don't carry data
- Fill every white space — white space aids reading
- Vary layouts arbitrarily across slides — use 2-3 consistent layout templates throughout

### Slide Count

Less is more. Each slide should make exactly one point. If a slide has two claims, split it.

Typical structured decks:
- Executive summary: 1 slide
- Situation/context: 1-2 slides
- Analysis: 3-6 slides (one exhibit each)
- Recommendation(s): 1-2 slides
- Next steps / appendix: as needed

---

## Building Process

### Step 1: Storyline first

Before opening any tool, write out the action titles for every slide in sequence. Validate with the ghost deck test. Only proceed when the titles form a coherent argument.

### Step 2: Map exhibits to slides

For each slide, identify:
- What data/evidence supports this action title?
- What chart or table type best shows that evidence?
- What is the "so what" — does the exhibit prove the title?

If no exhibit clearly supports a slide's action title, reconsider whether that slide is necessary or whether the title is too vague.

### Step 3: Build the deck

Follow the standard workflow from [SKILL.md](SKILL.md) (editing template or creating from scratch with PptxGenJS), applying the formatting rules above.

When working from a template with a visual design, strip back the design:
- Remove decorative icons and color blocks not tied to data
- Set backgrounds to white on content slides
- Rewrite all titles as action titles
- Remove fonts not in the approved set — replace with Arial or Calibri

### Step 4: QA — Ghost deck pass

After building, extract all slide titles:

```bash
python -m markitdown output.pptx | grep -E "^#"
```

Read them in sequence. If any title is a topic label (not a sentence), rewrite it. If the sequence does not flow logically, restructure.

### Step 5: Visual QA

Follow the standard visual QA process from [SKILL.md](SKILL.md).

Additional checks for structured decks:
- Action title is the most prominent element on every slide (largest text, top position)
- Source line is present on every slide with data
- No decorative elements that don't carry information
- Font consistency — only the approved font appears

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| Topic label titles ("Revenue", "Risks") | Rewrite as action sentences with a specific claim |
| Multiple claims per slide | Split into separate slides |
| Chart without "so what" | Tie the chart directly to the action title; if you can't, simplify the chart or sharpen the title |
| Inconsistent font usage | Lock to one font (Arial or Calibri) from the start |
| Color used for decoration | Remove; use color only to highlight data |
| Missing source citations | Add to every data exhibit before declaring done |
| Ghost deck test fails | Restructure the argument before finalizing content |
| Exhibit doesn't support the action title | Either change the exhibit or change the title — they must agree |

---

## Quick Checklist

Before submitting any structured deck:

- [ ] Every slide has a complete-sentence action title
- [ ] Ghost deck test passes (titles alone form coherent argument)
- [ ] Every data exhibit has a source citation
- [ ] Only one font used throughout
- [ ] Only one accent color used
- [ ] No decorative icons or visual filler
- [ ] Each slide makes exactly one point
- [ ] Slides flow logically (each title connects to the next)
