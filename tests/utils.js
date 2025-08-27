export function waitForSelector(doc, selector, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      const el = doc.querySelector(selector);
      if (el) {
        clearInterval(timer);
        resolve(el);
      } else if (Date.now() - start > timeout) {
        clearInterval(timer);
        reject(new Error(`Timeout waiting for ${selector}`));
      }
    }, 50);
  });
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function keyPress(el, key) {
  const evt = new KeyboardEvent('keydown', { key, bubbles: true });
  el.dispatchEvent(evt);
}
