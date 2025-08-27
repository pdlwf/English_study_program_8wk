export const results = [];

export function record({ page, test, status, message, context }) {
  results.push({ page, test, status, message, context });
}

export function assert(condition, message, meta = {}) {
  record({ ...meta, status: condition ? 'PASS' : 'FAIL', message });
}

export function renderResults() {
  const tbody = document.querySelector('#results tbody');
  tbody.innerHTML = '';
  results.forEach((r) => {
    const tr = document.createElement('tr');
    tr.className = r.status.toLowerCase();
    tr.innerHTML = `<td>${r.page}</td><td>${r.test}</td><td>${r.status}</td><td>${r.message}</td>`;
    tbody.appendChild(tr);
  });
}

export function summaryText() {
  const counts = results.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  return `PASS: ${counts.PASS||0}\nFAIL: ${counts.FAIL||0}\nSKIPPED: ${counts.SKIPPED||0}\nINFO: ${counts.INFO||0}`;
}

export function downloadJSON() {
  const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'nav_audit.json';
  a.click();
}

export async function copySummary() {
  await navigator.clipboard.writeText(summaryText());
}
