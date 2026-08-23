(()=>{'use strict';
if(window.__pokemonV573)return;window.__pokemonV573=true;
const VERSION='V5.7.4';
function fix(){
  const heading=document.querySelector('.v572-page-account .v572-page-head h2');
  if(heading&&heading.textContent!=='我的帳號')heading.textContent='我的帳號';
  const v=document.querySelector('.app-version-v14');
  if(v&&v.textContent!==VERSION){v.textContent=VERSION;v.title='目前版本 '+VERSION}
}
function startGuard(){
  fix();
  const root=document.querySelector('.app')||document.body;
  if(!root)return;
  const observer=new MutationObserver(()=>fix());
  observer.observe(root,{childList:true,characterData:true,subtree:true});
  setTimeout(fix,100);
  setTimeout(fix,500);
  setTimeout(fix,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startGuard);else startGuard();
})();
