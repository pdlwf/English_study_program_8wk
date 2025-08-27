# Navigation Audit Report

- Timestamp: Wed Aug 27 02:51:12 UTC 2025
- Commit: 45ba2e3530f382b93d2275f4fca463bc3d626670

## Results Summary

| Page | Test | Status | Notes |
|------|------|--------|-------|
| /index.html | Week cards link to week pages | NOT RUN | Automation failed in headless environment |
| /index.html | Search deep link | NOT RUN | |
| /weeks/week1.html | Back link to index | NOT RUN | |
| /weeks/week1.html | Day accordions toggle and update hash | NOT RUN | |
| /weeks/week1.html | Prev/Next day buttons | NOT RUN | |
| /weeks/week1.html | Keyboard toggles | NOT RUN | |
| /weeks/week1.html | ARIA wiring | NOT RUN | |
| /weeks/week1.html | Checklist persistence | NOT RUN | |
| /weeks/week1.html | Timer persistence | NOT RUN | |
| /weeks/week1.html | Quiz persistence | NOT RUN | |
| /weeks/week1.html | Flashcards persistence | NOT RUN | |
| styles/base.css | @media print rules | NOT RUN | |

## Defects & Fixes

Automation did not execute; no defects recorded.

## Next Steps

- Launch a local server (e.g., `python3 -m http.server`) and open `tests/diagnostics.html` in a modern browser.
- Click **Run tests** to generate a full report.
- Address any FAIL items and rerun diagnostics.
