---
name: hebrew-rtl
description: Write readable Hebrew and mixed Hebrew-English responses with correct RTL flow, punctuation, numbers, tickers, links, tables, and code. Use whenever a response contains Hebrew, especially financial content.
---

# Hebrew RTL writing

Use this skill whenever the user writes in Hebrew or requests Hebrew content.

## Writing rules

- Rewrite English-source prose into natural Hebrew word order rather than retaining English sentence structure. For financial reporting prefer company in Hebrew, event, figure, then implication. Split sentences dense with English names, percentages, tickers or dates; preserve all facts and numbers.
- Write the sentence in Hebrew first. Avoid starting a Hebrew sentence with a ticker, English word, number, or punctuation when a natural Hebrew opening is available.
- Keep English names, tickers, percentages, dates, prices, and abbreviations as compact LTR islands. Prefer inline code for tickers, formulas, commands, and other technical tokens when that improves readability.
- Keep code, commands, formulas, and URLs in LTR formatting. Link descriptive Hebrew text instead of pasting a raw URL into the middle of a Hebrew sentence.
- Put punctuation at the logical end of the sentence. Rephrase when parentheses, quotes, colons, or punctuation appear in the wrong visual position.
- Begin list items with Hebrew words. Keep list markers and punctuation attached to the correct item.
- Use tables only when they remain readable in RTL. Order columns from the reader's right to left; otherwise use short labeled bullets.
- For documents and generated HTML, set actual RTL direction on Hebrew paragraphs, headings, and table cells. Alignment alone is not RTL.
- Proofread mixed-direction text before sending, especially Hebrew beside English, tickers, numbers, dates, prices, percentages, brackets, and links.

## Important limitation

This skill guides the model's wording. It does not change Codex's window, message-bubble alignment, or composer direction. To change desktop rendering, the user must separately install and launch the repository's desktop injector. Never claim the desktop renderer is fixed just because this skill is installed.
