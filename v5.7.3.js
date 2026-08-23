(()=>{'use strict';
if(window.__pokemonV573)return;window.__pokemonV573=true;
const VERSION='V5.7.3';
function stamp(){
  const v=document.querySelector('.app-version-v14');
  if(v&&v.textContent!==VERSION){v.textContent=VERSION;v.title='目前版本 '+VERSION}
}
function startGuard(){
  stamp();
  const root=document.querySelector('.app')||document.body;
  if(!root)return;
  const observer=new MutationObserver(()=>stamp());
  observer.observe(root,{childList:true,characterData:true,subtree:true});
  setTimeout(stamp,100);
  setTimeout(stamp,500);
  setTimeout(stamp,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startGuard);else startGuard();
})();
