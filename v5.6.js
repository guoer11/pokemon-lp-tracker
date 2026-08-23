(()=>{'use strict';
if(window.__pokemonMobileNavV56)return;
window.__pokemonMobileNavV56=true;

const MQ=window.matchMedia('(max-width:680px)');
const SUPABASE_URL='https://ceobnyikrudlxasyjukg.supabase.co';
const SUPABASE_KEY='sb_publishable_6uVBALI1T3lMZoFEUiLK4g__R7gv0fz';
const LEAGUE={all:'全部',great:'超級球',premier:'紀念球',ultra:'高級球',master:'大師球',world:'世界賽'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g,' ').trim();
let db=null,searchRows=[],loadedUserId=null,activeLeague='all',searchTimer=null;

const ICONS={
  home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
  add:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  analysis:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  user:'<svg viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2c-4.7 0-8 2.4-8 5.1 0 .7.6 1.3 1.3 1.3h13.4c.7 0 1.3-.6 1.3-1.3C20 16.4 16.7 14 12 14Z"/></svg>'
};

function getDb(){
  if(!db&&window.supabase)db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  return db;
}
function safeShow(dlg){try{if(!dlg.open)dlg.showModal()}catch{dlg.setAttribute('open','')}}
function closeSheets(){document.querySelectorAll('dialog.v56-sheet[open]').forEach(d=>{try{d.close()}catch{d.removeAttribute('open')}})}
function setActive(key){document.querySelectorAll('.mobile-nav-item-v56').forEach(b=>b.classList.toggle('is-active',b.dataset.nav===key))}
function stampVersion(){const v=document.querySelector('.app-version-v14');if(v){v.textContent='V5.6';v.title='目前版本 V5.6'}}

function makeSheet(id,title,body){
  let dlg=document.getElementById(id);if(dlg)return dlg;
  dlg=document.createElement('dialog');dlg.id=id;dlg.className='v56-sheet';
  dlg.innerHTML='<div class="v56-sheet-inner"><div class="v56-sheet-head"><h3>'+esc(title)+'</h3><button type="button" class="v56-sheet-close" aria-label="關閉">×</button></div><div class="v56-sheet-body">'+body+'</div></div>';
  document.body.appendChild(dlg);
  dlg.querySelector('.v56-sheet-close').addEventListener('click',()=>dlg.close());
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener('close',()=>setActive('home'));
  return dlg;
}

function ensureSearchSheet(){
  const chips=Object.entries(LEAGUE).map(([k,v])=>'<button type="button" class="v56-chip '+(k==='all'?'is-active':'')+'" data-search-league="'+k+'">'+v+'</button>').join('');
  const dlg=makeSheet('searchDialogV56','搜尋比賽紀錄','<div class="v56-search-input-wrap"><input id="searchInputV56" class="v56-search-input" type="search" autocomplete="off" placeholder="搜尋比賽、地點、牌組、對手牌組…"><span class="v56-search-mark">'+ICONS.search+'</span></div><div class="v56-search-chips">'+chips+'</div><div id="searchStatusV56" class="v56-search-status"></div><div id="searchResultsV56" class="v56-search-results"></div>');
  const input=dlg.querySelector('#searchInputV56');
  input.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(renderSearch,90)});
  dlg.querySelectorAll('[data-search-league]').forEach(btn=>btn.addEventListener('click',()=>{
    activeLeague=btn.dataset.searchLeague;
    dlg.querySelectorAll('[data-search-league]').forEach(x=>x.classList.toggle('is-active',x===btn));
    renderSearch();
  }));
  dlg.querySelector('#searchResultsV56').addEventListener('click',e=>{
    const btn=e.target.closest?.('[data-search-event]');if(!btn)return;
    const row=searchRows.find(x=>String(x.id)===String(btn.dataset.searchEvent));if(row)jumpToRecord(row,dlg);
  });
  return dlg;
}

function searchText(row){
  return norm([
    row.date,row.date?.replaceAll('-','/'),row.location,LEAGUE[row.league]||'',row.format||'',
    row.ownDeck,row.ownPokemon,row.opponents.join(' '),row.opponentPokemon.join(' '),
    row.participants,row.placement,row.lp
  ].join(' '));
}
async function loadSearchData(){
  const status=document.getElementById('searchStatusV56');
  if(status)status.textContent='讀取比賽紀錄…';
  const client=getDb();
  if(!client){searchRows=[];if(status)status.textContent='搜尋功能暫時無法載入。';return}
  const{data:{session}}=await client.auth.getSession();
  if(!session){
    let local=[];try{local=JSON.parse(localStorage.getItem('pokemon-lp-events')||'[]')}catch{}
    searchRows=(Array.isArray(local)?local:[]).map((e,i)=>({id:e.id||'local-'+i,date:e.date||'',location:e.location||'',league:e.league||'',format:e.matchFormat||'',participants:Number(e.participants)||0,placement:Number(e.placement)||0,lp:Number(e.lp)||0,ownDeck:'',ownPokemon:'',opponents:[],opponentPokemon:[]}));
    loadedUserId='local';renderSearch();return;
  }
  if(loadedUserId===session.user.id&&searchRows.length){renderSearch();return}
  const uid=session.user.id;
  const [er,dr,mr]=await Promise.all([
    client.from('events').select('id,event_date,location,league_type,match_format,participants,placement,lp,own_deck_id').eq('user_id',uid).order('event_date',{ascending:false}),
    client.from('decks').select('id,name,primary_pokemon_name,secondary_pokemon_name').eq('user_id',uid),
    client.from('matches').select('event_id,opponent_deck_name,opponent_pokemon_name').eq('user_id',uid)
  ]);
  if(er.error||dr.error||mr.error){searchRows=[];if(status)status.textContent='讀取失敗，請稍後再試。';return}
  const deckMap=new Map((dr.data||[]).map(d=>[String(d.id),d]));
  const matchMap=new Map();
  for(const m of mr.data||[]){
    const k=String(m.event_id);if(!matchMap.has(k))matchMap.set(k,{names:[],pokemon:[]});
    const g=matchMap.get(k);if(m.opponent_deck_name&&!g.names.includes(m.opponent_deck_name))g.names.push(m.opponent_deck_name);if(m.opponent_pokemon_name&&!g.pokemon.includes(m.opponent_pokemon_name))g.pokemon.push(m.opponent_pokemon_name);
  }
  searchRows=(er.data||[]).map(e=>{
    const d=e.own_deck_id?deckMap.get(String(e.own_deck_id)):null,g=matchMap.get(String(e.id))||{names:[],pokemon:[]};
    return{id:e.id,date:e.event_date||'',location:e.location||'',league:e.league_type||'',format:e.match_format||'',participants:Number(e.participants)||0,placement:Number(e.placement)||0,lp:Number(e.lp)||0,ownDeck:d?.name||'',ownPokemon:[d?.primary_pokemon_name,d?.secondary_pokemon_name].filter(Boolean).join(' '),opponents:g.names,opponentPokemon:g.pokemon};
  });
  loadedUserId=uid;renderSearch();
}

function renderSearch(){
  const input=document.getElementById('searchInputV56'),box=document.getElementById('searchResultsV56'),status=document.getElementById('searchStatusV56');
  if(!box||!status)return;
  const q=norm(input?.value||''),tokens=q?q.split(' ').filter(Boolean):[];
  let rows=searchRows.filter(r=>activeLeague==='all'||r.league===activeLeague);
  if(tokens.length)rows=rows.filter(r=>{const t=searchText(r);return tokens.every(x=>t.includes(x))});
  rows=[...rows].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,50);
  status.textContent=tokens.length||activeLeague!=='all'?'找到 '+rows.length+' 場':'最近 '+Math.min(rows.length,50)+' 場比賽';
  if(!rows.length){box.innerHTML='<div class="v56-empty-state">找不到符合的比賽紀錄。</div>';return}
  box.innerHTML=rows.map(r=>{
    const opponents=r.opponents.length?'｜對手：'+r.opponents.slice(0,3).join('、'):'';
    const own=r.ownDeck?'｜'+r.ownDeck:'';
    return '<button type="button" class="v56-search-result" data-search-event="'+esc(r.id)+'"><span><strong>'+esc(r.location||'未命名比賽')+'</strong><small>'+esc((r.date||'').replaceAll('-','/'))+'｜第 '+r.placement+' 名'+esc(own+opponents)+'</small></span><span class="v56-search-result-meta"><b>'+esc(LEAGUE[r.league]||r.league||'')+'</b>'+r.lp+' LP</span></button>';
  }).join('');
}

function jumpToRecord(row,dlg){
  dlg.close();
  const filter=document.getElementById('filter');if(filter&&filter.value!=='all'){filter.value='all';filter.dispatchEvent(new Event('change',{bubbles:true}))}
  const find=()=>{
    const date=(row.date||'').replaceAll('-','/');
    const card=[...document.querySelectorAll('.event-card')].find(c=>{
      const d=c.querySelector('.date')?.textContent.trim()||'',loc=c.querySelector('.loc')?.textContent.trim()||'',meta=c.querySelector('.meta')?.textContent||'';
      return d===date&&loc===row.location&&meta.includes('第 '+row.placement+' 名');
    });
    if(!card)return false;
    card.scrollIntoView({behavior:'smooth',block:'center'});card.classList.remove('v56-record-highlight');void card.offsetWidth;card.classList.add('v56-record-highlight');setTimeout(()=>card.classList.remove('v56-record-highlight'),1900);return true;
  };
  requestAnimationFrame(()=>{if(!find())setTimeout(find,120)});
}

function ensureAnalysisSheet(){
  return makeSheet('analysisDialogV56','分析','<div class="v56-analysis-placeholder"><div class="v56-analysis-icon">'+ICONS.analysis+'</div><h4>分析功能規劃中</h4><p>之後預計加入年度戰績、自己的牌組使用率與勝率，以及對手牌組分布、勝率／敗率等分析。</p><div class="v56-plan-tags"><span>年度戰績</span><span>牌組使用率</span><span>勝敗率</span><span>對手環境</span></div></div>');
}

function refreshAccountSheet(){
  const dlg=document.getElementById('accountDialogV56');if(!dlg)return;
  const state=document.getElementById('authState')?.textContent||'本機模式',email=document.getElementById('authEmail')?.textContent||'',sync=document.getElementById('syncState')?.textContent||'';
  dlg.querySelector('.v56-account-state').textContent=state;
  dlg.querySelector('.v56-account-email').textContent=email;
  dlg.querySelector('.v56-account-sync').textContent=sync;
  const logged=document.getElementById('login')?.hidden===true;
  dlg.querySelector('.v56-login').hidden=logged;dlg.querySelector('.v56-logout').hidden=!logged;
}
function ensureAccountSheet(){
  const dlg=makeSheet('accountDialogV56','我的','<div class="v56-account-card"><div class="v56-account-avatar">'+ICONS.user+'</div><div class="v56-account-state">帳號</div><div class="v56-account-email"></div><div class="v56-account-sync"></div><div class="v56-account-actions"><button type="button" class="btn primary v56-login">使用 Google 登入</button><button type="button" class="btn v56-logout">登出</button></div></div>');
  dlg.querySelector('.v56-login').addEventListener('click',()=>{dlg.close();document.getElementById('login')?.click()});
  dlg.querySelector('.v56-logout').addEventListener('click',()=>{dlg.close();document.getElementById('logout')?.click()});
  return dlg;
}

function buildNav(){
  if(!MQ.matches||document.querySelector('.mobile-bottom-nav-v56'))return;
  document.body.classList.add('v56-mobile-ready');
  const nav=document.createElement('nav');nav.className='mobile-bottom-nav-v56';nav.setAttribute('aria-label','手機版主要導覽');
  nav.innerHTML='<button type="button" class="mobile-nav-item-v56 is-active" data-nav="home">'+ICONS.home+'<span>首頁</span></button><button type="button" class="mobile-nav-item-v56" data-nav="search">'+ICONS.search+'<span>搜尋</span></button><button type="button" class="mobile-nav-item-v56 mobile-nav-add-v56" data-nav="add"><span class="v56-add-circle">'+ICONS.add+'</span><span>新增</span></button><button type="button" class="mobile-nav-item-v56" data-nav="analysis">'+ICONS.analysis+'<span>分析</span></button><button type="button" class="mobile-nav-item-v56" data-nav="account">'+ICONS.user+'<span>我的</span></button>';
  document.body.appendChild(nav);
  nav.addEventListener('click',async e=>{
    const btn=e.target.closest?.('[data-nav]');if(!btn)return;const key=btn.dataset.nav;closeSheets();setActive(key);
    if(key==='home'){window.scrollTo({top:0,behavior:'smooth'});return}
    if(key==='add'){const quick=document.querySelector('.quick-add-v14');if(quick)quick.click();else document.getElementById('reset')?.click();setTimeout(()=>setActive('home'),120);return}
    if(key==='search'){const dlg=ensureSearchSheet();safeShow(dlg);activeLeague='all';dlg.querySelectorAll('[data-search-league]').forEach(x=>x.classList.toggle('is-active',x.dataset.searchLeague==='all'));dlg.querySelector('#searchInputV56').value='';await loadSearchData();setTimeout(()=>dlg.querySelector('#searchInputV56')?.focus(),80);return}
    if(key==='analysis'){safeShow(ensureAnalysisSheet());return}
    if(key==='account'){const dlg=ensureAccountSheet();refreshAccountSheet();safeShow(dlg);return}
  });
  const auth=document.querySelector('.auth');if(auth)new MutationObserver(()=>{if(document.getElementById('accountDialogV56')?.open)refreshAccountSheet();loadedUserId=null}).observe(auth,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
  stampVersion();setTimeout(stampVersion,650);
}

function init(){if(MQ.matches)buildNav();stampVersion()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
MQ.addEventListener?.('change',e=>{if(e.matches)buildNav()});
})();
