// Reusable UI components for week pages
// Components are framework-agnostic and rely on consumers to provide
// storage getters/setters. Only minimal styling is assumed.

import { createTimer } from './timers.js';

// Toast helper ---------------------------------------------------------
export function Toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

// Copy button with toast feedback -------------------------------------
export function CopyButton(text) {
  const btn = document.createElement('button');
  btn.className = 'copy';
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => Toast('Copied'));
  });
  return btn;
}

// Accordion ------------------------------------------------------------
// id should be unique per page (e.g. `day-1`); the returned element is a
// `<section>` that contains a trigger button and a content panel. The
// trigger emits `accordion:open`/`accordion:close` custom events.
export function Accordion({ id, title }, content, { startOpen = false } = {}) {
  const section = document.createElement('section');
  section.className = 'accordion';

  const trigger = document.createElement('button');
  trigger.className = 'acc-trigger';
  trigger.id = `acc-trigger-${id}`;
  trigger.setAttribute('aria-controls', `acc-panel-${id}`);
  trigger.setAttribute('aria-expanded', startOpen ? 'true' : 'false');
  const titleSpan = document.createElement('span');
  titleSpan.className = 'acc-title';
  titleSpan.textContent = title;
  const badgeSpan = document.createElement('span');
  badgeSpan.className = 'badges';
  trigger.append(titleSpan, badgeSpan);

  const header = document.createElement('h2');
  header.appendChild(trigger);

  const panel = document.createElement('div');
  panel.id = `acc-panel-${id}`;
  panel.className = 'acc-panel';
  panel.hidden = !startOpen;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-labelledby', trigger.id);
  if (content) panel.appendChild(content);

  function open() {
    trigger.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
    trigger.dispatchEvent(new CustomEvent('accordion:open', { bubbles: true }));
  }

  function close() {
    trigger.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
    trigger.dispatchEvent(new CustomEvent('accordion:close', { bubbles: true }));
  }

  trigger.addEventListener('click', () => {
    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    expanded ? close() : open();
  });

  // keyboard support (Space/Enter)
  trigger.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      trigger.click();
    }
  });

  section.append(header, panel);
  return section;
}

// Progress ring -------------------------------------------------------
// Returns an SVG element representing `percent` (0–100). The element has an
// `.update(p)` method to change the value.
export function ProgressRing(percent = 0) {
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

  function set(p) {
    const dash = (p / 100) * circ;
    fg.setAttribute('stroke-dasharray', `${dash} ${circ}`);
  }

  svg.update = set;
  set(percent);

  svg.append(bg, fg);
  return svg;
}

// Checklist -----------------------------------------------------------
// `getState` and `setState` allow callers to persist data.
export function Checklist({ items, getState, setState }) {
  const state = getState() || {};
  const ul = document.createElement('ul');
  ul.className = 'checklist';

  items.forEach((label) => {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = Boolean(state[label]);
    cb.id = `chk-${label}`;
    cb.addEventListener('change', () => {
      state[label] = cb.checked;
      setState(state);
      ul.dispatchEvent(new Event('change'));
    });
    const lab = document.createElement('label');
    lab.setAttribute('for', cb.id);
    lab.textContent = label;
    li.append(cb, lab);
    ul.appendChild(li);
  });

  return ul;
}

// Timer ---------------------------------------------------------------
// Simple countdown timer. Persists remaining seconds to `storageKey` in
// localStorage whenever changed or reset.
export function Timer({ seconds = 60, storageKey, onComplete }) {
  const stored = parseInt(localStorage.getItem(storageKey) || seconds, 10);
  let remaining = stored;

  const container = document.createElement('div');
  container.className = 'timer';
  const display = document.createElement('div');
  display.className = 'timer-display';
  const controls = document.createElement('div');
  controls.className = 'timer-controls';
  const start = document.createElement('button');
  start.textContent = 'Start';
  const reset = document.createElement('button');
  reset.textContent = 'Reset';
  controls.append(start, reset);
  container.append(display, controls);

  const timer = createTimer({ seconds: remaining });
  timer.onTick((t) => {
    remaining = t;
    localStorage.setItem(storageKey, String(remaining));
    const m = String(Math.floor(t / 60)).padStart(2, '0');
    const s = String(t % 60).padStart(2, '0');
    display.textContent = `${m}:${s}`;
  });
  timer.onComplete(() => {
    Toast('Time\u2019s up');
    onComplete && onComplete();
  });

  start.addEventListener('click', () => {
    if (timer.running) {
      timer.pause();
      start.textContent = 'Start';
    } else {
      timer.start();
      start.textContent = 'Pause';
    }
  });

  reset.addEventListener('click', () => {
    timer.reset(seconds);
    start.textContent = 'Start';
    localStorage.setItem(storageKey, String(seconds));
  });

  return container;
}

// Quiz ----------------------------------------------------------------
// Renders multiple-choice questions. `storageGet`/`storageSet` abstract
// persistence.
export function Quiz({ questions, storageGet, storageSet }) {
  const state = storageGet() || { total: questions.length, correct: 0, best: 0 };
  const form = document.createElement('form');
  form.className = 'quiz';

  questions.forEach((q, qi) => {
    const field = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = q.q;
    field.appendChild(legend);

    q.choices.forEach((choice, ci) => {
      const id = `q${qi}c${ci}`;
      const label = document.createElement('label');
      label.setAttribute('for', id);
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${qi}`;
      input.id = id;
      input.value = String(ci);
      label.append(input, document.createTextNode(choice));
      field.appendChild(label);
    });

    form.appendChild(field);
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Submit';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Retry';
  retry.hidden = true;
  const result = document.createElement('p');
  form.append(submit, retry, result);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let correct = 0;
    questions.forEach((q, qi) => {
      const selected = form.querySelector(`input[name="q${qi}"]:checked`);
      const field = form.querySelectorAll('fieldset')[qi];
      field.querySelectorAll('label').forEach((lab, idx) => {
        lab.classList.remove('correct', 'wrong');
        const inpt = lab.querySelector('input');
        if (inpt.checked) {
          if (idx === q.answer) {
            lab.classList.add('correct');
            correct++;
          } else lab.classList.add('wrong');
        }
      });
    });
    state.total = questions.length;
    state.correct = correct;
    if (correct > state.best) state.best = correct;
    storageSet(state);
    result.textContent = `Score: ${correct}/${questions.length}`;
    submit.disabled = true;
    retry.hidden = false;
    form.dispatchEvent(new Event('change')); // notify progress
  });

  retry.addEventListener('click', () => {
    submit.disabled = false;
    retry.hidden = true;
    result.textContent = '';
    form.querySelectorAll('input[type="radio"]').forEach((i) => (i.checked = false));
    form.querySelectorAll('label').forEach((l) => l.classList.remove('correct', 'wrong'));
  });

  if (state.correct) {
    result.textContent = `Last score: ${state.correct}/${state.total}`;
    submit.disabled = true;
    retry.hidden = false;
  }

  return form;
}

// Flashcards -----------------------------------------------------------
// Simple spaced-repetition flashcards. `cards` = [{term,definition}].
// Buckets: learning -> review -> mastered. Hard = move back (if possible),
// Easy = move forward. State persisted via storage functions.
export function Flashcards({ cards, storageGet, storageSet }) {
  const state = storageGet() || {}; // term -> bucket
  let idx = 0;

  const wrap = document.createElement('div');
  wrap.className = 'flashcards';

  const header = document.createElement('div');
  header.className = 'flash-header';
  const counts = document.createElement('span');
  header.appendChild(counts);

  const card = document.createElement('div');
  card.className = 'flash-card';
  const term = document.createElement('div');
  term.className = 'term';
  const def = document.createElement('div');
  def.className = 'def';
  def.hidden = true;
  card.append(term, def);

  const prev = document.createElement('button');
  prev.textContent = 'Prev';
  const next = document.createElement('button');
  next.textContent = 'Next';
  const flip = document.createElement('button');
  flip.textContent = 'Flip';
  const hard = document.createElement('button');
  hard.textContent = 'Hard';
  const easy = document.createElement('button');
  easy.textContent = 'Easy';
  const controls = document.createElement('div');
  controls.className = 'flash-controls';
  controls.append(prev, next, flip, hard, easy);

  wrap.append(header, card, controls);

  function updateCounts() {
    let l = 0,
      r = 0,
      m = 0;
    Object.values(state).forEach((b) => {
      if (b === 'mastered') m++;
      else if (b === 'review') r++;
      else l++;
    });
    counts.textContent = `${l} • ${r} • ${m}`;
    storageSet(state);
    wrap.dispatchEvent(new Event('change')); // update progress
  }

  function show() {
    const c = cards[idx];
    term.textContent = c.term;
    def.textContent = c.definition;
    def.hidden = true;
  }

  flip.addEventListener('click', () => {
    def.hidden = !def.hidden;
  });
  prev.addEventListener('click', () => {
    idx = (idx - 1 + cards.length) % cards.length;
    show();
  });
  next.addEventListener('click', () => {
    idx = (idx + 1) % cards.length;
    show();
  });
  hard.addEventListener('click', () => {
    const termTxt = cards[idx].term;
    const bucket = state[termTxt] || 'learning';
    state[termTxt] = bucket === 'review' ? 'learning' : bucket;
    if (bucket === 'mastered') state[termTxt] = 'review';
    updateCounts();
  });
  easy.addEventListener('click', () => {
    const termTxt = cards[idx].term;
    const bucket = state[termTxt] || 'learning';
    state[termTxt] = bucket === 'learning' ? 'review' : 'mastered';
    updateCounts();
  });

  show();
  updateCounts();

  return wrap;
}

// Rubric --------------------------------------------------------------
export function Rubric({ dimensions, getState, setState }) {
  const state = getState() || {};
  const div = document.createElement('div');
  div.className = 'rubric';
  dimensions.forEach((dim) => {
    const row = document.createElement('div');
    row.className = 'rubric-row';
    const label = document.createElement('label');
    label.textContent = dim.dimension;
    const select = document.createElement('select');
    dim.levels.forEach((lvl) => {
      const opt = document.createElement('option');
      opt.value = lvl;
      opt.textContent = lvl;
      if (state[dim.dimension] === lvl) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      state[dim.dimension] = select.value;
      setState(state);
    });
    row.append(label, select);
    div.appendChild(row);
  });
  return div;
}

