import { assert, record, renderResults, results, downloadJSON, copySummary } from './assertions.js';
import { waitForSelector, wait, keyPress } from './utils.js';

const iframe = document.getElementById('frame');

function withPage(url, testFn) {
  return new Promise((resolve) => {
    iframe.src = url;
    iframe.onload = async () => {
      const win = iframe.contentWindow;
      const doc = win.document;
      await wait(75); // allow scripts to init
      try {
        await testFn(win, doc);
      } catch (e) {
        record({ page: url, test: 'exception', status: 'FAIL', message: e.message });
      }
      resolve();
    };
  });
}

async function runIndexTests() {
  await withPage('/', async (win, doc) => {
    const firstLink = await waitForSelector(doc, '#weeks a');
    const links = doc.querySelectorAll('#weeks a');
    assert(links.length === 8, '8 week cards present', { page: '/index.html', test: 'week cards' });
    for (let i = 1; i <= 8; i++) {
      const link = Array.from(links).find((a) => a.getAttribute('href') === `weeks/week${i}.html`);
      assert(Boolean(link), `Week card ${i} links to week${i}.html`, {
        page: '/index.html',
        test: `week${i} link`,
      });
    }
    firstLink.click();
  });
  assert(
    iframe.contentWindow.location.pathname.endsWith('/weeks/week1.html'),
    'Clicking first card navigates to week1',
    { page: '/index.html', test: 'card navigation' }
  );

  await withPage('/', async (win, doc) => {
    const search = doc.getElementById('search');
    search.value = 'milestone';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    const res = await waitForSelector(doc, '#results a');
    assert(res.getAttribute('href').includes('week1.html#day-1'), 'Search result links to day', {
      page: '/index.html',
      test: 'search link',
    });
    res.click();
  });
  await wait(300);
  assert(
    iframe.contentWindow.location.hash === '#day-1' && iframe.contentWindow.location.pathname.endsWith('/weeks/week1.html'),
    'Search navigates to deep link',
    { page: '/index.html', test: 'search navigation' }
  );
}

async function runWeekTests(week) {
  const page = `/weeks/week${week}.html`;
  await withPage(page, async (win, doc) => {
    const back = doc.querySelector('a.back');
    assert(back && back.getAttribute('href') === '../index.html', 'Back link points to index', {
      page,
      test: 'back link',
    });
    back.click();
  });
  assert(
    iframe.contentWindow.location.pathname.endsWith('/index.html'),
    'Back link navigates to index',
    { page: `/weeks/week${week}.html`, test: 'back link nav' }
  );

  await withPage(page, async (win, doc) => {
    await waitForSelector(doc, '#week-title');
    assert(doc.getElementById('week-title').textContent.trim().length > 0, 'Week title rendered', {
      page,
      test: 'week title',
    });
    assert(Boolean(doc.querySelector('#goals .card')), 'Goals card exists', { page, test: 'goals card' });
    await waitForSelector(doc, '#glance');
    assert(Boolean(doc.querySelector('#glance')), 'At-a-glance exists', { page, test: 'glance' });
    const triggers = doc.querySelectorAll('.acc-trigger');
    assert(triggers.length === 7, '7 day triggers', { page, test: 'day triggers count' });

    const t1 = doc.getElementById('acc-trigger-day-1');
    const p1 = doc.getElementById('acc-panel-day-1');
    t1.click();
    assert(t1.getAttribute('aria-expanded') === 'true', 'Day1 expands', { page, test: 'day1 expand' });
    assert(!p1.hidden, 'Day1 panel shown', { page, test: 'day1 panel visible' });
    assert(win.location.hash === '#day-1', 'Hash updated to day-1', { page, test: 'hash update' });
    t1.click();
    assert(t1.getAttribute('aria-expanded') === 'false', 'Day1 collapses', { page, test: 'day1 collapse' });

    // Single-open mode
    const t2 = doc.getElementById('acc-trigger-day-2');
    t1.click();
    t2.click();
    assert(t1.getAttribute('aria-expanded') === 'false', 'Opening day2 closes day1', { page, test: 'single open' });

    // Prev/Next buttons
    const t3 = doc.getElementById('acc-trigger-day-3');
    t3.click();
    const next3 = doc.querySelector('#day-3 .day-footer button:last-child');
    next3.click();
    await wait(100);
    const t4 = doc.getElementById('acc-trigger-day-4');
    assert(t4.getAttribute('aria-expanded') === 'true', 'Next opens day4', { page, test: 'next day' });
    const prev4 = doc.querySelector('#day-4 .day-footer button:nth-child(2)');
    prev4.click();
    await wait(100);
    assert(t2.getAttribute('aria-expanded') === 'true', 'Prev opens day2', { page, test: 'prev day' });

    // Keyboard
    t2.focus();
    keyPress(t2, ' ');
    await wait(50);
    assert(t2.getAttribute('aria-expanded') === 'false', 'Space toggles day2 close', { page, test: 'keyboard space close' });
    keyPress(t2, 'Enter');
    await wait(50);
    assert(t2.getAttribute('aria-expanded') === 'true', 'Enter toggles day2 open', { page, test: 'keyboard enter open' });

    // ARIA wiring
    triggers.forEach((btn) => {
      const ctrl = btn.getAttribute('aria-controls');
      const panel = doc.getElementById(ctrl);
      assert(Boolean(panel), 'Panel exists for trigger', { page, test: `aria-controls ${ctrl}` });
      assert(panel.getAttribute('role') === 'region', 'Panel role region', { page, test: `role region ${ctrl}` });
      assert(panel.getAttribute('aria-labelledby') === btn.id, 'aria-labelledby links back', {
        page,
        test: `aria-labelledby ${ctrl}`,
      });
    });
  });

  await withPage(`${page}#day-1`, async (win, doc) => {
    const t1 = doc.getElementById('acc-trigger-day-1');
    assert(t1.getAttribute('aria-expanded') === 'true', 'Hash opens day1', { page: `${page}#day-1`, test: 'deep link hash' });
  });

  await withPage(`${page}?d=4`, async (win, doc) => {
    const t4 = doc.getElementById('acc-trigger-day-4');
    assert(t4.getAttribute('aria-expanded') === 'true', '?d=4 opens day4', { page: `${page}?d=4`, test: 'deep link query' });
  });
}

async function runStorageSmoke(week) {
  const page = `/weeks/week${week}.html`;
  await withPage(page, async (win, doc) => {
    const t1 = await waitForSelector(doc, '#acc-trigger-day-1');
    t1.click();
    const cb = doc.querySelector('#acc-panel-day-1 input[type="checkbox"]');
    cb.click();
    assert(cb.checked, 'Checklist item toggles', { page, test: 'checklist tick' });
    win.location.reload();
  });
  await new Promise((resolve) => (iframe.onload = resolve));
  await (async () => {
    const win = iframe.contentWindow;
    const doc = win.document;
    const t1 = doc.getElementById('acc-trigger-day-1');
    t1.click();
    const cb = doc.querySelector('#acc-panel-day-1 input[type="checkbox"]');
    assert(cb.checked, 'Checklist persists after reload', { page: page, test: 'checklist persist' });

    const timerStart = doc.querySelector('#acc-panel-day-1 .timer button');
    const display = doc.querySelector('#acc-panel-day-1 .timer-display');
    const before = display.textContent;
    timerStart.click();
    await wait(1100);
    timerStart.click();
    assert(display.textContent !== before, 'Timer counts down', { page, test: 'timer run' });
    const stored = display.textContent;
    win.location.reload();
    await new Promise((resolve) => (iframe.onload = resolve));
    const win2 = iframe.contentWindow;
    const doc2 = win2.document;
    const t1b = doc2.getElementById('acc-trigger-day-1');
    t1b.click();
    const display2 = doc2.querySelector('#acc-panel-day-1 .timer-display');
    assert(display2.textContent === stored, 'Timer persists after reload', { page, test: 'timer persist' });

    const quizRadio = doc2.querySelector('#acc-panel-day-1 form.quiz input[type="radio"]');
    quizRadio.click();
    const submit = doc2.querySelector('#acc-panel-day-1 form.quiz button[type="submit"]');
    submit.click();
    await wait(100);
    const res = doc2.querySelector('#acc-panel-day-1 form.quiz p');
    assert(res.textContent.includes('Score'), 'Quiz result shown', { page, test: 'quiz submit' });
    win2.location.reload();
    await new Promise((resolve) => (iframe.onload = resolve));
    const doc3 = iframe.contentDocument;
    const t1c = doc3.getElementById('acc-trigger-day-1');
    t1c.click();
    const res2 = doc3.querySelector('#acc-panel-day-1 form.quiz p');
    assert(res2.textContent.includes('Last score'), 'Quiz persists after reload', { page, test: 'quiz persist' });

    const fc = doc3.querySelector('#acc-panel-day-1 .flashcards');
    const counts = fc.querySelector('.flash-header span');
    const beforeFc = counts.textContent;
    const easy = fc.querySelector('.flash-controls button:last-child');
    easy.click();
    await wait(50);
    const afterFc = counts.textContent;
    assert(beforeFc !== afterFc, 'Flashcard count updates', { page, test: 'flashcard update' });
    win2.location.reload();
    await new Promise((resolve) => (iframe.onload = resolve));
    const doc4 = iframe.contentDocument;
    const t1d = doc4.getElementById('acc-trigger-day-1');
    t1d.click();
    const counts2 = doc4.querySelector('#acc-panel-day-1 .flashcards .flash-header span');
    assert(counts2.textContent === afterFc, 'Flashcard persists after reload', { page, test: 'flashcard persist' });
  })();
}

async function runPrintSanity() {
  try {
    const css = await (await fetch('../styles/base.css')).text();
    assert(/@media\s+print/.test(css), '@media print rules present', {
      page: 'styles/base.css',
      test: 'print rules',
    });
  } catch (e) {
    record({ page: 'styles/base.css', test: 'print rules', status: 'INFO', message: 'Could not verify print CSS' });
  }
}

export async function runAll() {
  results.length = 0;
  await runIndexTests();
  await runWeekTests(1);
  await runStorageSmoke(1);
  await runPrintSanity();
  for (let i = 2; i <= 8; i++) {
    record({ page: `/weeks/week${i}.html`, test: 'week suite', status: 'SKIPPED', message: 'Not audited' });
  }
  renderResults();
}

function downloadMarkdown() {
  const lines = [
    '# Navigation Audit Report',
    '',
    `- Timestamp: ${new Date().toString()}`,
    '',
    '## Results Summary',
    '',
    '| Page | Test | Status | Message |',
    '|------|------|--------|---------|',
    ...results.map((r) => `| ${r.page} | ${r.test} | ${r.status} | ${r.message} |`),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'navigation_audit.md';
  a.click();
}

document.getElementById('run').addEventListener('click', runAll);
document.getElementById('rerun').addEventListener('click', runAll);
document.getElementById('download-json').addEventListener('click', downloadJSON);
document.getElementById('download-md').addEventListener('click', downloadMarkdown);
document.getElementById('copy-summary').addEventListener('click', () => copySummary());

window.runAll = runAll;
window.runIndexTests = runIndexTests;
window.runWeekTests = runWeekTests;
window.runStorageSmoke = runStorageSmoke;
window.runPrintSanity = runPrintSanity;
window.results = results;
