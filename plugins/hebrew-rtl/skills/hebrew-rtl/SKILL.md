---
name: hebrew-rtl
description: Write readable Hebrew and mixed Hebrew-English responses with correct RTL flow, punctuation, numbers, tickers, links, tables, and code. Use whenever a response contains Hebrew, especially financial content.
---

# Hebrew RTL writing

Use this skill whenever the user writes in Hebrew or requests Hebrew content.

## Writing rules

- Rewrite English-source prose into natural Hebrew word order rather than retaining English sentence structure. For financial reporting prefer company in Hebrew, event, figure, then implication. Split sentences dense with English names, percentages, tickers or dates; preserve all facts and numbers.
- Prefer natural Hebrew prose, but preserve the opening English word, ticker, or number when requested or supplied. In a mixed Hebrew-English prose paragraph that starts with an LTR token, aim for RTL paragraph direction from the first response; a leading U+200F RLM mark may help, but do not place bidi marks inside URLs, identifiers, commands, or code.
- Keep English names, tickers, percentages, dates, prices, and abbreviations as compact LTR islands. Prefer inline code for tickers, formulas, commands, and other technical tokens when that improves readability.
- Keep code, commands, formulas, and URLs in LTR formatting. Link descriptive Hebrew text instead of pasting a raw URL into the middle of a Hebrew sentence.
- Put punctuation at the logical end of the sentence. Rephrase when parentheses, quotes, colons, or punctuation appear in the wrong visual position.
- Begin list items with Hebrew words. Keep list markers and punctuation attached to the correct item.
- Use tables only when they remain readable in RTL. Order columns from the reader's right to left; otherwise use short labeled bullets.
- For documents and generated HTML, set actual RTL direction on Hebrew paragraphs, headings, and table cells. Alignment alone is not RTL.
- Proofread mixed-direction text before sending, especially Hebrew beside English, tickers, numbers, dates, prices, percentages, brackets, and links.

## Important limitation

This skill guides the model's wording and may use a Unicode direction marker in plain prose. It does not change Codex's window, CSS alignment, message-bubble layout, or composer direction, and is not a guarantee of visual RTL. The recommended student workflow is text instructions only; do not install plugins or injectors to apply these rules. Never claim the desktop renderer is fixed just because the rules are present.
