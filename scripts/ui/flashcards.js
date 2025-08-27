import {getDay, setDay} from './storage.js';

// Simple flashcard engine with spaced repetition buckets
export function renderFlashcards(node, cards, { weekId, day }) {
  const data = getDay(weekId, day);
  const buckets = data.flash || {};

  // init bucket state
  cards.forEach(c => {
    if (!buckets[c.term]) buckets[c.term] = 'learning';
  });
  setDay(weekId, day, { flash: buckets });

  let index = 0;
  let front = true;

  const card = document.createElement('div');
  card.className = 'flashcard';
  node.appendChild(card);

  const controls = document.createElement('div');
  const prev = document.createElement('button');
  prev.textContent = 'Prev';
  const next = document.createElement('button');
  next.textContent = 'Next';
  const hard = document.createElement('button');
  hard.textContent = 'Hard';
  const easy = document.createElement('button');
  easy.textContent = 'Easy';
  controls.append(prev, next, hard, easy);
  node.appendChild(controls);

  const counter = document.createElement('p');
  node.appendChild(counter);

  function render() {
    const c = cards[index];
    card.textContent = front ? c.term : c.definition;
    updateCounts();
  }

  function updateCounts() {
    const counts = { learning: 0, review: 0, mastered: 0 };
    Object.values(buckets).forEach(b => counts[b]++);
    counter.textContent = `Learning ${counts.learning} · Review ${counts.review} · Mastered ${counts.mastered}`;
  }

  card.addEventListener('click', () => { front = !front; render(); });
  next.addEventListener('click', () => { index = (index + 1) % cards.length; front = true; render(); });
  prev.addEventListener('click', () => { index = (index - 1 + cards.length) % cards.length; front = true; render(); });

  hard.addEventListener('click', () => {
    const term = cards[index].term;
    buckets[term] = 'learning';
    setDay(weekId, day, { flash: buckets });
    updateCounts();
  });

  easy.addEventListener('click', () => {
    const term = cards[index].term;
    const state = buckets[term];
    buckets[term] = state === 'learning' ? 'review' : 'mastered';
    setDay(weekId, day, { flash: buckets });
    updateCounts();
  });

  render();
}

