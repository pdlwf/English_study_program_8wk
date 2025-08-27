import {Accordion, Checklist, Timer, Quiz, Flashcards, Rubric, CopyButton, ProgressRing} from '../scripts/ui/components.js';
import {getProgress, getDay, setDay} from '../scripts/ui/storage.js';

const weekId = location.pathname.match(/week(\d+)/)[1];

async function init() {
  const res = await fetch(`../data/week${weekId}.json`);
  const week = await res.json();
  document.getElementById('week-title').textContent = week.title;
  document.title = week.title;

  renderGoals(week.goals);
  renderDays(week);
  updateGlance();

  const hash = location.hash.match(/day-(\d+)/);
  const q = new URLSearchParams(location.search).get('d');
  if (hash) openDay(hash[1]);
  else if (q) openDay(q);
}

function renderGoals(goals) {
  const card = document.createElement('div');
  card.className = 'card';
  const h = document.createElement('h2');
  h.textContent = 'Week goals';
  card.appendChild(h);
  const ul = document.createElement('ul');
  goals.forEach(g => {
    const li = document.createElement('li');
    li.textContent = g;
    ul.appendChild(li);
  });
  card.appendChild(ul);
  document.getElementById('goals').appendChild(card);
}

function renderDays(week) {
  const container = document.getElementById('days');
  week.days.forEach((day, idx) => {
    const content = document.createElement('div');
    content.className = 'day';

    const focus = document.createElement('p');
    focus.textContent = day.focus;
    content.appendChild(focus);

    // vocabulary
    if (day.vocabulary) {
      const wrap = document.createElement('div');
      const ul = document.createElement('ul');
      day.vocabulary.forEach(v => {
        const li = document.createElement('li');
        li.textContent = v;
        ul.appendChild(li);
      });
      wrap.appendChild(ul);

      const copy = CopyButton(day.vocabulary.join(', '));
      wrap.appendChild(copy);

      if (day.usageExamples) {
        const toggle = document.createElement('button');
        toggle.textContent = 'Show usage examples';
        const exWrap = document.createElement('ul');
        exWrap.hidden = true;
        day.usageExamples.forEach(ex => {
          const li = document.createElement('li');
          li.textContent = ex;
          li.appendChild(CopyButton(ex));
          exWrap.appendChild(li);
        });
        toggle.addEventListener('click', () => {
          const vis = exWrap.hidden;
          exWrap.hidden = !vis;
          toggle.textContent = vis ? 'Hide usage examples' : 'Show usage examples';
        });
        wrap.appendChild(toggle);
        wrap.appendChild(exWrap);
      }
      content.appendChild(wrap);
    }

    // activities
    day.activities && day.activities.forEach(a => {
      const card = document.createElement('div');
      card.className = 'card activity';
      const h = document.createElement('h3');
      h.textContent = a.title;
      card.appendChild(h);
      if (a.instructions) {
        const p = document.createElement('p');
        p.textContent = a.instructions;
        card.appendChild(p);
      }
      if (a.type === 'checklist') {
        card.appendChild(Checklist({ items: a.items, weekId, day: day.day, key: 'checklist' }));
      }
      if (a.type === 'timer') {
        const match = a.instructions && a.instructions.match(/(\d+)[-\s]?minute/);
        const secs = match ? parseInt(match[1], 10) * 60 : 300;
        card.appendChild(Timer({ seconds: secs, weekId, day: day.day }));
      }
      content.appendChild(card);
    });

    // templates
    if (day.templates) {
      const div = document.createElement('div');
      div.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Templates';
      div.appendChild(h);
      day.templates.forEach(t => {
        const p = document.createElement('p');
        p.textContent = t;
        p.appendChild(CopyButton(t));
        div.appendChild(p);
      });
      content.appendChild(div);
    }

    // quiz
    if (day.quiz) {
      content.appendChild(Quiz({ questions: day.quiz.questions, weekId, day: day.day }));
    }

    // flashcards
    if (day.flashcards) {
      content.appendChild(Flashcards({ cards: day.flashcards, weekId, day: day.day }));
    }

    // homework
    if (day.homework) {
      const hw = Checklist({ items: day.homework, weekId, day: day.day, key: 'homework' });
      const wrapper = document.createElement('div');
      wrapper.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Homework';
      wrapper.append(h, hw);
      content.appendChild(wrapper);
    }

    // rubric
    if (day.rubric) {
      const r = Rubric({ dimensions: day.rubric, weekId, day: day.day });
      const wrap = document.createElement('div');
      wrap.className = 'card';
      const h = document.createElement('h3');
      h.textContent = 'Rubric';
      wrap.append(h, r);
      content.appendChild(wrap);
    }

    // footer nav
    const footer = document.createElement('div');
    footer.className = 'day-footer';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev Day';
    prevBtn.disabled = idx === 0;
    prevBtn.addEventListener('click', () => openDay(day.day - 1));
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next Day';
    nextBtn.disabled = idx === week.days.length - 1;
    nextBtn.addEventListener('click', () => openDay(day.day + 1));
    const doneBtn = document.createElement('button');
    doneBtn.textContent = 'Mark Day Complete';
    const dayData = getDay(weekId, day.day);
    if (dayData.done) doneBtn.classList.add('success');
    doneBtn.addEventListener('click', () => {
      const d = getDay(weekId, day.day);
      d.done = !d.done;
      setDay(weekId, day.day, d);
      doneBtn.classList.toggle('success', d.done);
      updateGlance();
    });
    footer.append(prevBtn, nextBtn, doneBtn);
    content.appendChild(footer);

    const acc = Accordion({ id: `day-${day.day}`, title: `Day ${day.day}: ${day.title}` }, content);
    container.appendChild(acc);
  });
}

function updateGlance() {
  const progress = getProgress(weekId);
  const days = Object.values(progress.days || {});
  const completed = days.filter(d => d.done).length;
  let vocab = 0;
  let quizzes = 0;
  days.forEach(d => {
    if (d.flash) {
      Object.values(d.flash).forEach(v => { if (v === 'mastered') vocab++; });
    }
    if (d.quiz && d.quiz.correct === d.quiz.total) quizzes++;
  });
  const wrap = document.getElementById('glance');
  wrap.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `Days ${completed} · Vocab mastered ${vocab} · Quizzes passed ${quizzes}`;
  wrap.appendChild(p);
  wrap.appendChild(ProgressRing((completed / 7) * 100));
}

export function openDay(n) {
  const btn = document.querySelector(`#day-${n} > h2 > button`);
  if (btn) {
    btn.click();
    document.getElementById(`day-${n}`).scrollIntoView();
  }
}

init();

// expose helper
window.openDay = openDay;

