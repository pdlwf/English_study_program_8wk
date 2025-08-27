// Core UI component helpers
// Components are kept minimal and data-driven. Persistence is handled via
// storage.js using week/day scoped keys.

import {getDay, setDay} from './storage.js';
import {createTimer} from './timers.js';
import {renderQuiz} from './quiz.js';
import {renderFlashcards} from './flashcards.js';

// Utility: toast message
export function Toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// Copy button with toast feedback
export function CopyButton(text) {
  const btn = document.createElement('button');
  btn.className = 'copy';
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => Toast('Copied'));
  });
  return btn;
}

// Accessible accordion section
export function Accordion({ id, title }, content) {
  const section = document.createElement('section');
  section.className = 'accordion';

  const header = document.createElement('h2');
  const btn = document.createElement('button');
  btn.id = id;
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', `${id}-panel`);
  btn.innerHTML = `<span>${title}</span>`;
  header.appendChild(btn);

  const panel = document.createElement('div');
  panel.id = `${id}-panel`;
  panel.hidden = true;
  panel.className = 'accordion-content';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', id);

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
    if (!open) panel.focus();
  });

  if (content) panel.appendChild(content);
  section.append(header, panel);
  return section;
}

// SVG progress ring
export function ProgressRing(percent) {
  const circ = 2 * Math.PI * 16;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.classList.add('progress-ring');

  const bg = document.createElementNS(svg.namespaceURI, 'path');
  bg.setAttribute('d', 'M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32');
  bg.setAttribute('stroke', 'var(--shadow)');
  bg.setAttribute('stroke-width', '2');
  bg.setAttribute('fill', 'none');

  const fg = document.createElementNS(svg.namespaceURI, 'path');
  fg.setAttribute('d', 'M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32');
  fg.setAttribute('stroke', 'var(--tint)');
  fg.setAttribute('stroke-width', '2');
  fg.setAttribute('fill', 'none');
  fg.setAttribute('stroke-dasharray', `${(percent / 100) * circ} ${circ}`);

  svg.append(bg, fg);
  return svg;
}

// Checklist component; items is array of strings. Persist state per item.
export function Checklist({ items, weekId, day, key }) {
  const data = getDay(weekId, day);
  const state = data[key] || {};
  const ul = document.createElement('ul');
  ul.className = 'checklist';

  items.forEach((text) => {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Boolean(state[text]);
    cb.id = `${key}-${text}`;
    cb.addEventListener('change', () => {
      state[text] = cb.checked;
      setDay(weekId, day, { [key]: state });
    });
    const label = document.createElement('label');
    label.setAttribute('for', cb.id);
    label.textContent = text;
    li.append(cb, label);
    ul.appendChild(li);
  });
  return ul;
}

// Timer component using timers.js
export function Timer({ seconds, weekId, day }) {
  const data = getDay(weekId, day);
  const last = data.timer || seconds;
  const container = document.createElement('div');
  container.className = 'timer';
  const display = document.createElement('div');
  display.className = 'timer-display';
  const controls = document.createElement('div');
  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  controls.append(startBtn, resetBtn);
  container.append(display, controls);

  const timer = createTimer({ seconds: last });
  timer.onTick((t) => {
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;
  });
  timer.onComplete(() => Toast('Done'));

  startBtn.addEventListener('click', () => {
    if (timer.running) {
      timer.pause();
      startBtn.textContent = 'Start';
    } else {
      timer.start();
      startBtn.textContent = 'Pause';
    }
  });
  resetBtn.addEventListener('click', () => {
    timer.reset();
    startBtn.textContent = 'Start';
  });

  setDay(weekId, day, { timer: last });
  return container;
}

// Quiz wrapper
export function Quiz({ questions, weekId, day }) {
  const div = document.createElement('div');
  div.className = 'quiz';
  renderQuiz(div, questions, { weekId, day });
  return div;
}

// Flashcards wrapper
export function Flashcards({ cards, weekId, day }) {
  const div = document.createElement('div');
  div.className = 'flashcards';
  renderFlashcards(div, cards, { weekId, day });
  return div;
}

// Rubric component
export function Rubric({ dimensions, weekId, day }) {
  const data = getDay(weekId, day);
  const state = data.rubric || {};
  const div = document.createElement('div');
  div.className = 'rubric';
  dimensions.forEach((d) => {
    const row = document.createElement('div');
    row.className = 'rubric-row';
    const label = document.createElement('label');
    label.textContent = d.dimension;
    const select = document.createElement('select');
    d.levels.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l;
      if (state[d.dimension] === l) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      state[d.dimension] = select.value;
      setDay(weekId, day, { rubric: state });
    });
    row.append(label, select);
    div.appendChild(row);
  });
  return div;
}

