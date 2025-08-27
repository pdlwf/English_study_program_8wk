const KEY='progress';
export function load(){try{return JSON.parse(localStorage.getItem(KEY))||{weeks:{}};}catch{return{weeks:{}};}}
export function save(data){localStorage.setItem(KEY,JSON.stringify(data));}
export function getWeek(id){const data=load();if(!data.weeks[id])data.weeks[id]={};return data.weeks[id];}
export function setWeek(id,week){const data=load();data.weeks[id]=week;save(data);}
export function reset(){localStorage.removeItem(KEY);}
