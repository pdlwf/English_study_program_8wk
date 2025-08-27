import {getDay, setDay} from './storage.js';

// Render multiple-choice quiz questions. State persists per day.
export function renderQuiz(node, questions, { weekId, day }) {
  const data = getDay(weekId, day);
  let score = 0;
  let answered = 0;

  const stored = data.quiz;
  const container = document.createElement('div');

  questions.forEach((q, qi) => {
    const wrap = document.createElement('div');
    wrap.className = 'quiz-question';
    const p = document.createElement('p');
    p.textContent = q.q;
    wrap.appendChild(p);

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.textContent = choice;
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        answered++;
        if (idx === q.answer) {
          btn.classList.add('correct');
          score++;
          showToast('Correct');
        } else {
          btn.classList.add('wrong');
          showToast('Wrong');
        }
        Array.from(btn.parentNode.querySelectorAll('button')).forEach(b => b.disabled = true);
        if (answered === questions.length) finalize();
      });
      wrap.appendChild(btn);
    });
    container.appendChild(wrap);
  });

  const result = document.createElement('p');
  container.appendChild(result);

  function finalize() {
    result.textContent = `Score: ${score} / ${questions.length}`;
    setDay(weekId, day, { quiz: { total: questions.length, correct: score } });
  }

  if (stored) {
    // show stored score if already taken
    result.textContent = `Last score: ${stored.correct} / ${stored.total}`;
  }

  node.appendChild(container);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

