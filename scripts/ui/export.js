import {load,save,reset} from './storage.js';
export function exportProgress(){const data=load();const blob=new Blob([JSON.stringify(data)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='progress.json';a.click();}
export function importProgress(file){const reader=new FileReader();reader.onload=e=>{save(JSON.parse(e.target.result));location.reload();};reader.readAsText(file);}
export {reset as resetProgress};
