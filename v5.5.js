(()=>{'use strict';
if(window.__pokemonOwnDeckCollapseV55)return;
window.__pokemonOwnDeckCollapseV55=true;

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
  if(!hero||hero.dataset.v55==='1')return;
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
const observer=new MutationObserver(()=>decorateAll());
observer.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateAll);else decorateAll();
})();
