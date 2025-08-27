import {Card,ProgressRing,Toast} from './ui/components.js';
import {load} from './ui/storage.js';
import {exportProgress,importProgress,resetProgress} from './ui/export.js';

let searchIndex=null;
async function init(){const res=await fetch('data/weeks.json');const data=await res.json();const grid=document.querySelector('#weeks');data.weeks.forEach(w=>{const body=document.createElement('div');const ul=document.createElement('ul');(w.goals||[]).forEach(g=>{const li=document.createElement('li');li.textContent=g;ul.appendChild(li);});body.appendChild(ul);const progress=ProgressRing(0);body.appendChild(progress);const btn=document.createElement('a');btn.href=`weeks/week${w.id}.html`;btn.textContent='Open';body.appendChild(btn);const card=Card(w.title,body);grid.appendChild(card);});setupToolbar();document.getElementById('search').addEventListener('input',onSearch);}

async function buildIndex(){if(searchIndex)return searchIndex;const weeks=await (await fetch('data/weeks.json')).json();const arr=[];for(const w of weeks.weeks){const d=await (await fetch(`data/week${w.id}.json`)).json();d.days.forEach(day=>{arr.push({week:w.id,day:day.day,title:day.title,focus:day.focus,vocab: (day.vocabulary||[]).join(' '),templates:(day.templates||[]).join(' ')});});}searchIndex=arr;return arr;}

async function onSearch(e){const q=e.target.value.toLowerCase();const resDiv=document.getElementById('results');resDiv.innerHTML='';if(!q)return;const idx=await buildIndex();idx.filter(item=>[item.title,item.focus,item.vocab,item.templates].some(t=>t.toLowerCase().includes(q))).forEach(item=>{const a=document.createElement('a');a.href=`weeks/week${item.week}.html#day-${item.day}`;a.textContent=`Week ${item.week} Day ${item.day}: ${item.title}`;resDiv.appendChild(a);});}

function setupToolbar(){document.querySelector('#export').addEventListener('click',exportProgress);document.querySelector('#import').addEventListener('change',e=>importProgress(e.target.files[0]));document.querySelector('#reset').addEventListener('click',()=>{resetProgress();Toast('Progress reset');});}

init();
