// Simple countdown helper
export function countdown(seconds, onTick, onDone){let t=seconds;onTick(t);const i=setInterval(()=>{t--;onTick(t);if(t<=0){clearInterval(i);beep();onDone&&onDone();}},1000);return()=>clearInterval(i);} 
function beep(){try{const ctx=new (window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();osc.type='sine';osc.frequency.setValueAtTime(440,ctx.currentTime);osc.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+0.2);}catch{}}
