(()=>{'use strict';
const SUPABASE_URL='https://ceobnyikrudlxasyjukg.supabase.co';
const SUPABASE_KEY='sb_publishable_6uVBALI1T3lMZoFEUiLK4g__R7gv0fz';
const db=window.supabase?.createClient?.(SUPABASE_URL,SUPABASE_KEY);
if(!db)return;
const $=(s,r=document)=>r.querySelector(s);
let decksByName=new Map();
let loadTimer=null;

function deckImage(d){return d?.primary_image_url||d?.image_data||d?.secondary_image_url||''}
function findDeckName(card){
  const meta=$('.meta',card)?.textContent||'';
  const parts=meta.split('｜').map(x=>x.trim()).slice(2);
  return parts.find(x=>decksByName.has(x))||'';
}
function decorateCard(card){
  if(!card?.classList?.contains('event-card'))return;
  const loc=$('.loc',card);if(!loc)return;
  const old=$('.event-deck-title-v143',card);
  const name=findDeckName(card),deck=name?decksByName.get(name):null,image=deckImage(deck);
  if(!image){
    if(old){old.parentNode.insertBefore(loc,old);old.remove()}
    return;
  }
  if(old){
    const img=$('.event-own-deck-thumb-v143',old);
    if(img&&img.src!==image)img.src=image;
    img?.setAttribute('title','我的牌組：'+name);
    return;
  }
  const wrap=document.createElement('div');wrap.className='event-deck-title-v143';
  const img=document.createElement('img');img.className='event-own-deck-thumb-v143';img.src=image;img.alt=name;img.title='我的牌組：'+name;img.loading='lazy';
  loc.parentNode.insertBefore(wrap,loc);wrap.append(img,loc);
}
function decorateAll(){document.querySelectorAll('#list .event-card').forEach(decorateCard)}

async function loadDecks(){
  try{
    const {data:{session}}=await db.auth.getSession();
    if(!session){decksByName.clear();decorateAll();return}
    const {data,error}=await db.from('decks').select('id,name,image_data,primary_image_url,secondary_image_url').eq('user_id',session.user.id);
    if(error)return;
    const map=new Map();
    for(const d of data||[])if(d?.name&&!map.has(d.name))map.set(d.name,d);
    decksByName=map;decorateAll();
  }catch{}
}
function scheduleDeckReload(){clearTimeout(loadTimer);loadTimer=setTimeout(loadDecks,180)}

function init(){
  const list=document.getElementById('list');
  if(list)new MutationObserver(()=>decorateAll()).observe(list,{childList:true,subtree:true});
  const deckDialog=document.getElementById('deckDialog');
  deckDialog?.addEventListener('close',scheduleDeckReload);
  document.addEventListener('change',e=>{if(e.target?.classList?.contains('own-deck'))setTimeout(decorateAll,80)});
  db.auth.onAuthStateChange(()=>scheduleDeckReload());
  loadDecks();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
