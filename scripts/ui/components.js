// UI component helpers
export function Card(title, body){
  const div=document.createElement('div');
  div.className='card';
  if(title){const h=document.createElement('h3');h.textContent=title;div.appendChild(h);}
  if(body){div.appendChild(body);} return div;
}

export function Accordion({id,title}, content){
  const section=document.createElement('section');section.className='accordion';
  const btn=document.createElement('button');btn.id=id;btn.setAttribute('aria-expanded','false');btn.textContent=title;
  const icon=document.createElement('span');icon.textContent='+';btn.appendChild(icon);
  const div=document.createElement('div');div.className='accordion-content';
  btn.addEventListener('click',()=>{const open=div.classList.toggle('open');btn.setAttribute('aria-expanded',open);});
  if(content)div.appendChild(content);section.append(btn,div);return section;
}

export function ProgressRing(percent){
  const svg=`<svg class="progress-ring" viewBox="0 0 36 36"><path stroke="var(--shadow)" stroke-width="2" fill="none" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"/><path stroke="var(--tint)" stroke-width="2" fill="none" stroke-dasharray="${percent} ${100-percent}" d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"/></svg>`;
  const div=document.createElement('div');div.innerHTML=svg;return div.firstChild;
}

export function Toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2000);}

export function Checklist(items){const ul=document.createElement('ul');ul.className='checklist';items.forEach(i=>{const li=document.createElement('li');const cb=document.createElement('input');cb.type='checkbox';li.append(cb,document.createTextNode(i));ul.appendChild(li);});return ul;}

export function Timer({seconds}){let time=seconds;const container=document.createElement('div');const disp=document.createElement('div');disp.className='timer-display';const btn=document.createElement('button');btn.textContent='Start';container.append(disp,btn);function render(){disp.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(time%60).padStart(2,'0')}`;}render();let interval=null;btn.addEventListener('click',()=>{if(interval){clearInterval(interval);interval=null;btn.textContent='Start';}else{btn.textContent='Pause';interval=setInterval(()=>{if(time>0){time--;render();if(time===0){clearInterval(interval);Toast('Done');}}},1000);}});return container;}

export function Quiz(questions){let score=0;const div=document.createElement('div');questions.forEach((q,idx)=>{const wrap=document.createElement('div');wrap.className='quiz-question';const p=document.createElement('p');p.textContent=q.q;wrap.appendChild(p);q.choices.forEach((c,i)=>{const btn=document.createElement('button');btn.textContent=c;btn.addEventListener('click',()=>{if(i===q.answer){btn.classList.add('correct');score++;}else btn.classList.add('wrong');btn.disabled=true;});wrap.appendChild(btn);});div.appendChild(wrap);});return div;}

export function Flashcards(cards){let index=0;const div=document.createElement('div');const card=document.createElement('div');card.className='flashcard';div.appendChild(card);function render(){card.textContent=index%2===0?cards[Math.floor(index/2)].term:cards[Math.floor(index/2)].definition;}render();card.addEventListener('click',()=>{index=(index+1)%(cards.length*2);render();});return div;}

export function Rubric(dimensions){const div=document.createElement('div');dimensions.forEach(d=>{const row=document.createElement('div');row.className='rubric-row';const label=document.createElement('label');label.textContent=d.dimension;const select=document.createElement('select');d.levels.forEach(l=>{const opt=document.createElement('option');opt.value=l;opt.textContent=l;select.appendChild(opt);});row.append(label,select);div.appendChild(row);});return div;}

export function CopyButton(text){const btn=document.createElement('button');btn.textContent='Copy';btn.addEventListener('click',()=>{navigator.clipboard.writeText(text).then(()=>Toast('Copied'));});return btn;}
