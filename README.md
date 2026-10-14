# Etsy Keyword Research Lab — v0.2.0

Chrome Extension (Manifest V3) for Etsy keyword discovery, active-tab scraping (RankKW / Etsy), and strict assignment validation.

## What it does
- Generates seed-based candidates using Etsy-oriented modifiers, A–Z expansion, audience, occasion, digital/physical formats and micro-niche branching.
- Scans visible tables on the currently active browser tab (for example, a RankKW keyword-results page) when you click **Scan current RankKW / Etsy tab**.
- Imports a RankKW CSV export and maps common metric column names.
- Applies all eight assignment criteria. A row is `PASS` only when every required metric is present and meets the threshold. Missing or ambiguous values remain `CHECK`.
- Exports only qualified `PASS` rows to `etsy-keywords-PASS.csv`; an audit export includes all rows and failure reasons.
- Stores the current working records in Chrome local extension storage.

## Install (Chrome / Edge / Brave)
1. Clone or download this repository.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked**.
5. Select this project root folder (the folder containing `manifest.json`).
6. Pin the extension to your toolbar.

## RankKW Workflow
1. Open RankKW in a normal Chrome tab and run its keyword research for your seed.
2. Keep the results/metrics table visible.
3. Click the extension and choose **Scan current RankKW / Etsy tab**.
4. If the page has no readable table or its column labels differ, use RankKW's CSV export and import it directly into the extension.
5. Export PASS keywords CSV.

## Qualification Criteria
- Etsy competition < 50,000
- Average views > 5,000
- Average price > $2
- Favs/View > 1%
- Google search volume Green/Good
- 12-month search trend Stable or Growing
- At least one target country among USA, UK, Canada, Germany
- Keyword Difficulty < 50

All criteria are mandatory. The tool does not count missing values as passes.

## Files
- `manifest.json`: Manifest V3 extension configuration
- `popup.html`, `styles.css`: Extension UI and layout
- `methods.js`: Candidate keyword generation logic
- `popup.js`: Tab scanning, CSV import, 8-rule validation, and CSV export
