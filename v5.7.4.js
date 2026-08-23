(()=>{'use strict';
if(window.__pokemonV574)return;window.__pokemonV574=true;
const VERSION='V5.7.4';
function fix(){
  const heading=document.querySelector('.v572-page-account .v572-page-head h2');
  if(heading&&heading.textContent!=='我的帳號')heading.textContent='我的帳號';
  const v=document.querySelector('.app-version-v14');
  if(v&&v.textContent!==VERSION){v.textContent=VERSION;v.title='目前版本 '+VERSION}
}
const observer=new MutationObserver(fix);
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
setTimeout(fix,120);setTimeout(fix,600);
})();
