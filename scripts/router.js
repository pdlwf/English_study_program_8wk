export function getHash(){return location.hash.slice(1);}
export function onHashChange(cb){window.addEventListener('hashchange',()=>cb(getHash()));}
export function initRouter(cb){cb(getHash());onHashChange(cb);}
