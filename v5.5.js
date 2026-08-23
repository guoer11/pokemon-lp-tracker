(()=>{'use strict';
if(window.__pokemonOwnDeckCollapseV55)return;
window.__pokemonOwnDeckCollapseV55=true;

function promoteControls(hero){
  const controls=hero.querySelector('.deck-copy .deck-controls')||hero.querySelector(':scope>.deck-controls');
  if(!controls)return;
  controls.classList.add('v551-controls-row');
  if(controls.parentElement!==hero)hero.appendChild(controls);
}

function setOpen(hero,open){
  hero.classList.toggle('v55-open',!!open);
  const btn=hero.querySelector('.own-deck-toggle-v55');
  if(btn){
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.setAttribute('aria-label',open?'收起我的牌組':'展開我的牌組');
    btn.title=open?'收起我的牌組':'展開我的牌組';
  }
}

function decorate(hero){
  if(!hero)return;
  promoteControls(hero);
  if(hero.dataset.v55==='1')return;
  hero.dataset.v55='1';
  hero.classList.add('v55-collapsible');
  setOpen(hero,false);

  const btn=document.createElement('button');
  btn.type='button';
  btn.className='own-deck-toggle-v55';
  btn.innerHTML='<span class="v55-chevron" aria-hidden="true">⌄</span>';
  hero.appendChild(btn);

  btn.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    setOpen(hero,!hero.classList.contains('v55-open'));
  });

  hero.addEventListener('click',e=>{
    if(e.target.closest('button,select,input,a,label,.deck-controls'))return;
    setOpen(hero,!hero.classList.contains('v55-open'));
  });
}

function decorateAll(){document.querySelectorAll('.deck-hero').forEach(decorate)}
function stampVersion(){const v=document.querySelector('.app-version-v14');if(v&&(!v.textContent||/^V5\.5(?:\.|$)/.test(v.textContent))){v.textContent='V5.5.2';v.title='目前版本 V5.5.2'}}
const observer=new MutationObserver(()=>decorateAll());
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{decorateAll();setTimeout(stampVersion,0)});else{decorateAll();setTimeout(stampVersion,0)}
setTimeout(stampVersion,250);
})();
