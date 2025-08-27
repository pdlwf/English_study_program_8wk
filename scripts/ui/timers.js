// Countdown timer utility with start/pause/reset API

export function createTimer({ seconds }) {
  let remaining = seconds;
  let interval = null;
  const tickHandlers = [];
  const doneHandlers = [];

  function emitTick() {
    tickHandlers.forEach((h) => h(remaining));
  }

  function emitDone() {
    doneHandlers.forEach((h) => h());
  }

  function start() {
    if (interval) return;
    interval = setInterval(() => {
      remaining--;
      emitTick();
      if (remaining <= 0) {
        pause();
        beep();
        emitDone();
      }
    }, 1000);
  }

  function pause() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset(sec = seconds) {
    pause();
    remaining = sec;
    emitTick();
  }

  function onTick(cb) {
    tickHandlers.push(cb);
  }

  function onComplete(cb) {
    doneHandlers.push(cb);
  }

  emitTick();

  return {
    start,
    pause,
    reset,
    onTick,
    onComplete,
    get running() {
      return Boolean(interval);
    },
  };
}

// simple beep using WebAudio
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    /* no audio support */
  }
}

