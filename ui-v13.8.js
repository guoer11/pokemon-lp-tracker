(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s);

function compactAuth(){
  const auth=$('.auth');
  if(!auth||auth.dataset.v138==='1')return;
  auth.dataset.v138='1';
  auth.classList.add('auth-compact-v137');
  const info=$('.authinfo',auth),actions=$('.actions',auth);
  if(!info||!actions)return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='account-avatar-v137';
  btn.setAttribute('aria-label','帳號與同步狀態');
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.7 0-8 2.4-8 5.1 0 .7.6 1.3 1.3 1.3h13.4c.7 0 1.3-.6 1.3-1.3C20 16.4 16.7 14 12 14Z"/></svg>';
  const pop=document.createElement('div');
  pop.className='account-popover-v137';
  pop.hidden=true;
  pop.append(info,actions);
  auth.append(btn,pop);
  const close=()=>{pop.hidden=true;btn.setAttribute('aria-expanded','false')};
  btn.addEventListener('click',e=>{e.stopPropagation();const open=pop.hidden;pop.hidden=!open;btn.setAttribute('aria-expanded',String(open))});
  pop.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
}

const leagueMap={
  '超級球':'league-great-v138',
  '紀念球':'league-premier-v138',
  '高級球':'league-ultra-v138',
  '大師球':'league-master-v138',
  '世界賽':'league-world-v138'
};

function placementText(place){
  if(place>=1&&place<=4)return'TOP 4';
  if(place>=5&&place<=8)return'TOP 8';
  if(place>=9&&place<=16)return'TOP 16';
  return'';
}

function decorateCard(card){
  if(!card?.classList?.contains('event-card'))return;
  const badges=$('.badges',card);if(!badges)return;
  badges.querySelectorAll('.bestbadge,.top8badge-v137,.placement-badge-v138').forEach(x=>x.remove());
  [...badges.querySelectorAll('.badge')].forEach(b=>{
    const text=b.textContent.trim();
    for(const [name,cls] of Object.entries(leagueMap))if(text===name){
      b.classList.remove('league-great-v137','league-premier-v137','league-ultra-v137','league-master-v137','league-world-v137');
      b.classList.add(cls);break;
    }
  });
  const meta=$('.meta',card),m=meta?.textContent.match(/第\s*(\d+)\s*名/),place=m?Number(m[1]):0,text=placementText(place);
  if(text){
    const top=document.createElement('span');
    top.className='badge placement-badge-v138 placement-'+text.replace(' ','').toLowerCase();
    top.textContent=text;
    badges.insertBefore(top,badges.firstChild);
  }
}
function decorateAll(root=document){
  if(root.matches?.('.event-card'))decorateCard(root);
  root.querySelectorAll?.('.event-card').forEach(decorateCard);
}
function init(){
  compactAuth();decorateAll();
  const list=document.getElementById('list');
  if(list)new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)decorateAll(n)}).observe(list,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();