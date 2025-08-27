// LocalStorage helpers with namespaced week/day keys

const KEY = 'progress';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { weeks: {} };
  } catch {
    return { weeks: {} };
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// Get week-level data object
export function getProgress(weekId) {
  const data = load();
  if (!data.weeks[weekId]) data.weeks[weekId] = { days: {} };
  return data.weeks[weekId];
}

export function setProgress(weekId, weekData) {
  const data = load();
  data.weeks[weekId] = weekData;
  save(data);
}

// Get day-level object; ensures path exists
export function getDay(weekId, day) {
  const week = getProgress(weekId);
  if (!week.days[day]) week.days[day] = {};
  setProgress(weekId, week);
  return week.days[day];
}

export function setDay(weekId, day, obj) {
  const week = getProgress(weekId);
  week.days[day] = { ...week.days[day], ...obj };
  setProgress(weekId, week);
}

export function reset() {
  localStorage.removeItem(KEY);
}

