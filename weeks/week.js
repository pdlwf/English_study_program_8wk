import {
  Accordion,
  Checklist,
  Timer,
  Quiz,
  Flashcards,
  Rubric,
  CopyButton,
  ProgressRing,
  Toast,
} from '../scripts/ui/components.js';
import { getDay, setDay, getProgress } from '../scripts/ui/storage.js';

const weekId = location.pathname.match(/week(\d+)/)[1];
let weekData;
let ring;

async function init() {
  try {
    const res = await fetch(`../data/week${weekId}.json`);
    weekData = await res.json();
    document.getElementById('week-title').textContent = weekData.title;
    document.title = weekData.title;

    renderGoals(weekData.goals);
    renderDays(weekData.days);
    setupTopbar();
    updateGlance();

    // deep link
    const hash = location.hash.match(/day-(\d+)/);
    const q = new URLSearchParams(location.search).get('d');
    const target = hash ? hash[1] : q;
    if (target) openDay(target);
    window.addEventListener('hashchange', () => {
      const m = location.hash.match(/day-(\d+)/);
      if (m) openDay(m[1]);
    });
  } catch (e) {
    Toast('Failed to load week data');
  }
}

function setupTopbar() {
  const toggle = document.getElementById('dark-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
    });
  }
}

function renderGoals(goals) {
  const card = document.createElement('div');
  card.className = 'card';
  const h = document.createElement('h2');
  h.textContent = 'Week Goals';
  card.appendChild(h);
  const ul = document.createElement('ul');
  goals.forEach((g) => {
    const li = document.createElement('li');
    li.textContent = g;
    ul.appendChild(li);
  });
  card.appendChild(ul);
  document.getElementById('goals').appendChild(card);
}

function renderDays(days) {
  const container = document.getElementById('days');
  days.forEach((dayObj, idx) => {
    const dayNum = dayObj.day;
    const content = document.createElement('div');
    content.className = 'day';

    // Focus & vocabulary -------------------------------------------------
    const focus = document.createElement('p');
    focus.textContent = dayObj.focus;
    content.appendChild(focus);

    if (dayObj.vocabulary) {
      const wrap = document.createElement('div');
      wrap.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Vocabulary';
      wrap.appendChild(h);
      const list = document.createElement('ul');
      dayObj.vocabulary.forEach((v) => {
        const li = document.createElement('li');
        li.textContent = v;
        list.appendChild(li);
      });
      wrap.appendChild(list);

      const copyAll = CopyButton(dayObj.vocabulary.join(', '));
      wrap.appendChild(copyAll);

      if (dayObj.usageExamples) {
        const toggle = document.createElement('button');
        toggle.textContent = 'Show usage examples';
        const exList = document.createElement('ul');
        exList.hidden = true;
        dayObj.usageExamples.forEach((ex) => {
          const li = document.createElement('li');
          li.textContent = ex;
          li.appendChild(CopyButton(ex));
          exList.appendChild(li);
        });
        toggle.addEventListener('click', () => {
          const vis = exList.hidden;
          exList.hidden = !vis;
          toggle.textContent = vis ? 'Hide usage examples' : 'Show usage examples';
        });
        wrap.appendChild(toggle);
        wrap.appendChild(exList);
      }

      content.appendChild(wrap);
    }

    // Activities --------------------------------------------------------
    dayObj.activities &&
      dayObj.activities.forEach((act) => {
        const card = document.createElement('div');
        card.className = 'card activity';
        const h = document.createElement('h3');
        h.textContent = act.title;
        card.appendChild(h);
        if (act.instructions) {
          const p = document.createElement('p');
          p.textContent = act.instructions;
          card.appendChild(p);
        }

        if (act.type === 'checklist') {
          const chk = Checklist({
            items: act.items,
            getState: () => getDay(weekId, dayNum).checklist || {},
            setState: (s) => {
              setDay(weekId, dayNum, { checklist: s });
              updateCompletion(dayNum);
            },
          });
          chk.addEventListener('change', () => updateGlance());
          card.appendChild(chk);
        }

        if (act.type === 'speak' || act.type === 'timer') {
          const secs = (act.duration || 1) * 60;
          const timer = Timer({
            seconds: secs,
            storageKey: `w${weekId}d${dayNum}.${act.title}`,
          });
          card.appendChild(timer);
        }

        if (act.type === 'write' || act.type === 'reflect') {
          const key = act.type === 'write' ? 'notes' : 'reflection';
          const ta = document.createElement('textarea');
          ta.value = getDay(weekId, dayNum)[key] || '';
          const counter = document.createElement('div');
          counter.className = 'word-count';
          counter.textContent = `${ta.value.split(/\s+/).filter(Boolean).length} words`;
          const saveTick = document.createElement('span');
          saveTick.className = 'saved';
          saveTick.hidden = true;
          let db;
          ta.addEventListener('input', () => {
            counter.textContent = `${ta.value.split(/\s+/).filter(Boolean).length} words`;
            clearTimeout(db);
            db = setTimeout(() => {
              setDay(weekId, dayNum, { [key]: ta.value });
              saveTick.hidden = false;
              setTimeout(() => (saveTick.hidden = true), 1000);
              updateCompletion(dayNum);
            }, 500);
          });
          card.append(ta, counter, saveTick);
        }

        content.appendChild(card);
      });

    // Templates --------------------------------------------------------
    if (dayObj.templates) {
      const div = document.createElement('div');
      div.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Templates';
      div.appendChild(h);
      const copyAll = CopyButton(dayObj.templates.join('\n'));
      div.appendChild(copyAll);
      dayObj.templates.forEach((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        p.appendChild(CopyButton(t));
        div.appendChild(p);
      });
      content.appendChild(div);
    }

    // Quiz -------------------------------------------------------------
    if (dayObj.quiz) {
      const quiz = Quiz({
        questions: dayObj.quiz.questions,
        storageGet: () => getDay(weekId, dayNum).quiz,
        storageSet: (s) => {
          setDay(weekId, dayNum, { quiz: s });
          updateDayBadge(dayNum);
          updateGlance();
          updateCompletion(dayNum);
        },
      });
      quiz.addEventListener('change', () => {
        updateDayBadge(dayNum);
        updateGlance();
        updateCompletion(dayNum);
      });
      content.appendChild(quiz);
    }

    // Flashcards -------------------------------------------------------
    if (dayObj.flashcards) {
      const fc = Flashcards({
        cards: dayObj.flashcards,
        storageGet: () => getDay(weekId, dayNum).flash || {},
        storageSet: (s) => {
          setDay(weekId, dayNum, { flash: s });
          updateDayBadge(dayNum);
          updateGlance();
        },
      });
      fc.addEventListener('change', () => {
        updateDayBadge(dayNum);
        updateGlance();
      });
      content.appendChild(fc);
    }

    // Homework ---------------------------------------------------------
    if (dayObj.homework) {
      const hw = Checklist({
        items: dayObj.homework,
        getState: () => getDay(weekId, dayNum).homework || {},
        setState: (s) => {
          setDay(weekId, dayNum, { homework: s });
          updateCompletion(dayNum);
        },
      });
      hw.addEventListener('change', () => updateGlance());
      const wrap = document.createElement('div');
      wrap.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Homework';
      wrap.append(h, hw);
      content.appendChild(wrap);
    }

    // Rubric ----------------------------------------------------------
    if (dayObj.rubric) {
      const r = Rubric({
        dimensions: dayObj.rubric,
        getState: () => getDay(weekId, dayNum).rubric || {},
        setState: (s) => setDay(weekId, dayNum, { rubric: s }),
      });
      const wrap = document.createElement('div');
      wrap.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Rubric';
      wrap.append(h, r);
      content.appendChild(wrap);
    }

    // Footer -----------------------------------------------------------
    const footer = document.createElement('div');
    footer.className = 'day-footer';
    const prev = document.createElement('button');
    prev.textContent = 'Prev day';
    prev.disabled = idx === 0;
    prev.addEventListener('click', () => openDay(dayNum - 1));
    const next = document.createElement('button');
    next.textContent = 'Next day';
    next.disabled = idx === days.length - 1;
    next.addEventListener('click', () => openDay(dayNum + 1));
    const done = document.createElement('button');
    done.textContent = 'Mark Day Complete';
    done.addEventListener('click', () => {
      const d = getDay(weekId, dayNum);
      d.done = !d.done;
      setDay(weekId, dayNum, d);
      updateDayBadge(dayNum);
      updateGlance();
      updateCompletion(dayNum);
    });
    footer.append(done, prev, next);
    content.appendChild(footer);

    const acc = Accordion(
      { id: `day-${dayNum}`, title: `Day ${dayNum}: ${dayObj.title}` },
      content,
    );
    acc.addEventListener('accordion:open', (e) => {
      // close siblings
      document.querySelectorAll('.accordion .acc-trigger').forEach((btn) => {
        if (btn !== e.target) {
          btn.setAttribute('aria-expanded', 'false');
          document.getElementById(btn.getAttribute('aria-controls')).hidden = true;
        }
      });
      location.hash = `day-${dayNum}`;
    });
    container.appendChild(acc);

    updateDayBadge(dayNum);
    updateCompletion(dayNum);
  });
}

function updateDayBadge(day) {
  const btn = document.querySelector(`#day-${day} .acc-trigger`);
  if (!btn) return;
  const badge = btn.querySelector('.badges');
  const data = getDay(weekId, day);
  badge.textContent = '';
  if (data.done) badge.textContent += '✅ ';
  if (data.quiz && data.quiz.best)
    badge.textContent += `★ ${data.quiz.best}/${data.quiz.total} `;
  if (data.flash) {
    const count = Object.values(data.flash).filter((v) => v === 'mastered').length;
    if (count) badge.textContent += `🔤 ${count}`;
  }
}

function updateGlance() {
  const progress = getProgress(weekId);
  const days = Object.values(progress.days || {});
  const completed = days.filter((d) => d.done).length;
  let vocab = 0;
  let quizzes = 0;
  days.forEach((d) => {
    if (d.flash) Object.values(d.flash).forEach((v) => v === 'mastered' && vocab++);
    if (d.quiz && d.quiz.best && d.quiz.best / d.quiz.total >= 0.8) quizzes++;
  });
  const wrap = document.getElementById('glance');
  wrap.innerHTML = '';
  const text = document.createElement('p');
  text.textContent = `Days done ${completed}/7 · Vocab mastered ${vocab} · Quizzes passed ${quizzes}/7`;
  ring = ring || ProgressRing((completed / 7) * 100);
  ring.update((completed / 7) * 100);
  wrap.append(text, ring);
}

function openDay(n) {
  const trigger = document.querySelector(`#day-${n} .acc-trigger`);
  if (trigger) {
    trigger.click();
    document.getElementById(`day-${n}`).scrollIntoView();
  }
}

function updateCompletion(day) {
  const btn = document.querySelector(`#day-${day} .day-footer button`);
  if (!btn) return;
  let ok = true;
  const data = getDay(weekId, day);
  switch (day) {
    case 1:
      ok = data.quiz && data.homework && Object.values(data.homework).some(Boolean);
      break;
    case 2:
      ok = data.quiz && data.checklist && Object.values(data.checklist).some(Boolean);
      break;
    case 3:
      ok = data.quiz && data.quiz.best && data.quiz.best / data.quiz.total >= 0.8;
      break;
    case 4:
      ok = Boolean(data.quiz);
      break;
    case 5:
      const used = data.flash ? Object.values(data.flash).filter((v) => v === 'mastered').length : 0;
      ok = data.quiz && used >= 5;
      break;
    case 6:
      ok = Boolean(data.quiz);
      break;
    case 7:
      ok = data.quiz && data.checklist && Object.values(data.checklist).every(Boolean);
      break;
  }
  btn.disabled = !ok;
}

init();

// expose for debugging
window.openDay = openDay;

