import {Accordion,Card,Checklist,Timer,Quiz,Flashcards,Rubric,CopyButton} from '../scripts/ui/components.js';
import {initRouter} from '../scripts/router.js';

async function init(){const id=location.pathname.match(/week(\d+)/)[1];const res=await fetch(`../data/week${id}.json`);const week=await res.json();document.title=week.title;document.querySelector('h1').textContent=week.title;const goalsCard=Card('Week goals',buildGoals(week.goals));document.querySelector('#goals').appendChild(goalsCard);week.days.forEach(d=>renderDay(d));initRouter(hash=>{if(hash.startsWith('day-')){document.getElementById(hash).click();}});}

function buildGoals(goals){const ul=document.createElement('ul');goals.forEach(g=>{const li=document.createElement('li');li.textContent=g;ul.appendChild(li);});return ul;}

function renderDay(day){const content=document.createElement('div');const focus=document.createElement('p');focus.textContent=day.focus;content.appendChild(focus);
  if(day.vocabulary){const vocab=document.createElement('ul');day.vocabulary.forEach(v=>{const li=document.createElement('li');li.textContent=v;vocab.appendChild(li);});content.appendChild(vocab);} 
  day.activities&&day.activities.forEach(a=>{if(a.type==='checklist')content.appendChild(Checklist(a.items));});
  if(day.templates){const div=document.createElement('div');day.templates.forEach(t=>{const p=document.createElement('p');p.textContent=t;div.appendChild(p);div.appendChild(CopyButton(t));});content.appendChild(div);} 
  if(day.quiz){const div=document.createElement('div');div.id=`quiz-${day.day}`;content.appendChild(div);Quiz(div,day.quiz.questions);} 
  if(day.flashcards){const div=document.createElement('div');Flashcards(div,day.flashcards);content.appendChild(div);} 
  if(day.homework){const hw=Checklist(day.homework);content.appendChild(hw);} 
  if(day.rubric){content.appendChild(Rubric(day.rubric));}
  const acc=Accordion({id:`day-${day.day}`,title:`Day ${day.day}: ${day.title}`},content);
  document.querySelector('#days').appendChild(acc);}

init();
