(()=>{'use strict';
if(window.__pokemonV571Fix)return;window.__pokemonV571Fix=true;
const USER_ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.7 0-8 2.4-8 5.1 0 .7.6 1.3 1.3 1.3h13.4c.7 0 1.3-.6 1.3-1.3C20 16.4 16.7 14 12 14Z"/></svg>';
function fixAccountNav(){
  document.querySelectorAll('[data-v57-nav="account"]').forEach(btn=>{
    if(btn.dataset.v571Fixed==='1')return;
    btn.dataset.v571Fixed='1';
    btn.innerHTML=USER_ICON+'<span>我的</span>';
  });
}
function stampVersion(){const v=document.querySelector('.app-version-v14');if(v){v.textContent='V5.7.1';v.title='目前版本 V5.7.1'}}
function fix(){fixAccountNav();stampVersion()}
const observer=new MutationObserver(fix);observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fix);else fix();
setTimeout(fix,250);setTimeout(fix,900);
})();
