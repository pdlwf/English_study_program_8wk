import { ProgressRing, Toast } from './ui/components.js';
import { getProgress } from './ui/storage.js';
import { exportProgress, importProgress, resetProgress } from './ui/export.js';

let weeksData = [];

async function init() {
  const res = await fetch('data/weeks.json');
  const data = await res.json();
  weeksData = data.weeks;
  const container = document.getElementById('weeks-container');
  for (const w of weeksData) {
    const card = await createWeekCard(w);
    container.appendChild(card);
  }
  setupToolbar();
  document.getElementById('search').addEventListener('input', onSearch);
}

async function createWeekCard(week) {
  const card = document.createElement('div');
  card.className = 'week-card card';

  const title = document.createElement('h2');
  title.textContent = week.title;
  card.appendChild(title);

  const goals = document.createElement('ul');
  try {
    const weekData = await (await fetch(`data/${week.file}`)).json();
    (weekData.goals || []).slice(0, 3).forEach((g) => {
      const li = document.createElement('li');
      li.textContent = g;
      goals.appendChild(li);
    });
    if (goals.children.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Goals coming soon';
      goals.appendChild(li);
    }
  } catch {
    const li = document.createElement('li');
    li.textContent = 'Goals coming soon';
    goals.appendChild(li);
  }
  card.appendChild(goals);

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const ring = ProgressRing(getCompletion(week.id));
  footer.appendChild(ring);
  const open = document.createElement('a');
  open.className = 'btn btn--primary';
  open.href = `weeks/week${week.id}.html`;
  open.textContent = 'Open';
  footer.appendChild(open);
  card.appendChild(footer);

  return card;
}

function getCompletion(id) {
  const progress = getProgress(id);
  const done = Object.values(progress.days || {}).filter((d) => d.done).length;
  return (done / 7) * 100;
}

function setupToolbar() {
  document.getElementById('export').addEventListener('click', exportProgress);
  document
    .getElementById('import')
    .addEventListener('change', (e) => importProgress(e.target.files[0]));
  document.getElementById('reset').addEventListener('click', () => {
    resetProgress();
    Toast('Progress reset');
  });
}

 // Filter week cards by title or goals
 function onSearch(e) {
  const q = e.target.value.toLowerCase();
  let matches = 0;
  const cards = document.querySelectorAll('.week-card');
  weeksData.forEach((w, idx) => {
    const card = cards[idx];
    const text = (w.title + ' ' + (w.goals || []).join(' ')).toLowerCase();
    if (!q || text.includes(q)) {
      card.hidden = false;
      highlight(card, q);
      matches++;
    } else {
      card.hidden = true;
    }
  });
  document.getElementById('no-weeks').hidden = matches !== 0;
}

function highlight(card, q) {
  const els = card.querySelectorAll('h2, li');
  els.forEach((el) => {
    const text = el.textContent;
    if (!q) {
      el.innerHTML = text;
      return;
    }
    const re = new RegExp(`(${q})`, 'gi');
    el.innerHTML = text.replace(re, '<mark>$1</mark>');
  });
}

init();
