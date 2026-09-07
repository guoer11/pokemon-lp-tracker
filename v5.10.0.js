(()=>{'use strict';
if(window.__pokemonV510)return;window.__pokemonV510=true;
const URL='https://ceobnyikrudlxasyjukg.supabase.co';
const KEY='sb_publishable_6uVBALI1T3lMZoFEUiLK4g__R7gv0fz';
const db=window.supabase?.createClient?window.supabase.createClient(URL,KEY):null;
const $=(s,r=document)=>r.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS=['#2563eb','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];
let data={events:[],matches:[],decks:[],environments:[]},initialized=false,editingEnvironmentId=null;

function localEnvironments(){try{const v=JSON.parse(localStorage.getItem('pokemon-lp-environments')||'[]');return Array.isArray(v)?v:[]}catch{return[]}}
function saveLocalEnvironments(rows){localStorage.setItem('pokemon-lp-environments',JSON.stringify(rows))}
function mapEnvironment(r){return{id:r.id,name:r.name,startDate:r.start_date||r.startDate,endDate:r.end_date||r.endDate||'',createdAt:r.created_at||r.createdAt||new Date().toISOString()}}
function formatDate(v){return String(v||'').replaceAll('-','/')}
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function environmentForDate(value,rows=data.environments){return [...rows].filter(x=>x.startDate<=value&&(!x.endDate||x.endDate>=value)).sort((a,b)=>b.startDate.localeCompare(a.startDate))[0]||null}
function notifyEnvironments(){window.dispatchEvent(new CustomEvent('pokemon:environments-changed',{detail:data.environments}))}

function setupAnalysis(){
  const page=$('.v572-page-analysis');if(!page)return;
  page.innerHTML='<div class="v510-analysis-head"><div class="v572-page-head"><h2>勝率分析</h2><p>從已完成的戰報計算自己的牌組對各對手牌組的勝率。</p></div><button class="btn v510-manage-env" type="button">管理環境</button></div><div class="v510-filters"><label><span>環境</span><select id="analysisEnvironment"><option value="all">全部環境</option></select></label><label><span>我的牌組</span><select id="analysisDeck"><option value="all">全部牌組</option></select></label><label><span>賽制</span><select id="analysisFormat"><option value="bo1">BO1</option><option value="bo3">BO3</option><option value="all">全部賽制</option></select></label></div><div id="analysisStatus" class="v510-status">讀取資料中…</div><div id="analysisContent" hidden><div class="v510-summary"><div><span>完成對局</span><strong id="analysisTotal">0</strong></div><div><span>戰績</span><strong id="analysisRecord">0W 0L</strong></div><div class="primary"><span>勝率</span><strong id="analysisRate">—</strong></div></div><div class="v510-grid"><section class="v510-chart-card"><div class="v510-card-title"><div><h3>對手牌組勝率</h3><p>依勝率排序；場次少時會標示樣本不足。</p></div></div><div id="matchupBars" class="v510-bars"></div></section><section class="v510-chart-card"><div class="v510-card-title"><div><h3>我遇到的對手牌組</h3><p>只代表自己的對局，不代表整個賽場使用率。</p></div></div><div class="v510-donut-wrap"><div id="opponentDonut" class="v510-donut"><span>0<small>場</small></span></div><div id="opponentLegend" class="v510-legend"></div></div></section></div></div>';
  $('#analysisFormat',page).value='bo1';
  page.querySelectorAll('select').forEach(x=>x.addEventListener('change',renderAnalysis));
  $('.v510-manage-env',page).addEventListener('click',openEnvironmentDialog);
}

async function loadData(forceDefaults=false){
  const status=$('#analysisStatus');if(status)status.textContent='讀取資料中…';
  if(!db){if(status)status.textContent='分析功能暫時無法載入。';return}
  const{data:{session}}=await db.auth.getSession();
  if(!session){
    let events=[];try{events=JSON.parse(localStorage.getItem('pokemon-lp-events')||'[]')}catch{}
    data={events:Array.isArray(events)?events.map(e=>({...e,event_date:e.date,own_deck_id:e.ownDeckId||null,environment_id:e.environmentId||null,match_format:e.matchFormat||'bo1'})):[],matches:[],decks:[],environments:localEnvironments().map(mapEnvironment)};
    try{await applyEnvironmentsToUnclassified(null)}catch{}
    populateFilters(forceDefaults);renderAnalysis();return;
  }
  const uid=session.user.id;
  const[er,mr,dr,xr]=await Promise.all([
    db.from('events').select('id,event_date,match_format,own_deck_id,environment_id').eq('user_id',uid),
    db.from('matches').select('event_id,result,match_format,opponent_deck_name,opponent_pokemon_name').eq('user_id',uid),
    db.from('decks').select('id,name').eq('user_id',uid).order('name'),
    db.from('environments').select('*').eq('user_id',uid).order('start_date',{ascending:false})
  ]);
  const error=er.error||mr.error||dr.error||xr.error;if(error){if(status)status.textContent='讀取失敗：'+error.message;return}
  data={events:er.data||[],matches:mr.data||[],decks:dr.data||[],environments:(xr.data||[]).map(mapEnvironment)};
  try{await applyEnvironmentsToUnclassified(session)}catch{}
  notifyEnvironments();populateFilters(forceDefaults);renderAnalysis();
}

function populateFilters(force=false){
  const env=$('#analysisEnvironment'),deck=$('#analysisDeck');if(!env||!deck)return;
  const oldEnv=env.value,oldDeck=deck.value;
  env.innerHTML='<option value="all">全部環境</option><option value="none">未分類</option>'+data.environments.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('');
  deck.innerHTML='<option value="all">全部牌組</option>'+data.decks.map(x=>'<option value="'+x.id+'">'+esc(x.name)+'</option>').join('');
  if(!initialized||force){
    env.value='all';
    const event=[...data.events].filter(e=>(env.value==='all'||String(e.environment_id||'')===env.value)&&(e.match_format||'bo1')==='bo1'&&e.own_deck_id).sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date)))[0];
    deck.value=event?.own_deck_id&&data.decks.some(d=>String(d.id)===String(event.own_deck_id))?String(event.own_deck_id):'all';
    initialized=true;
  }else{
    env.value=[...env.options].some(o=>o.value===oldEnv)?oldEnv:'all';
    deck.value=[...deck.options].some(o=>o.value===oldDeck)?oldDeck:'all';
  }
}

function filteredMatches(){
  const env=$('#analysisEnvironment')?.value||'all',deck=$('#analysisDeck')?.value||'all',fmt=$('#analysisFormat')?.value||'bo1';
  const eventMap=new Map(data.events.map(e=>[String(e.id),e]));
  return data.matches.filter(m=>['W','L','D'].includes(m.result)).map(m=>({m,e:eventMap.get(String(m.event_id))})).filter(({m,e})=>{
    if(!e)return false;
    if(env==='none'&&e.environment_id)return false;if(env!=='all'&&env!=='none'&&String(e.environment_id||'')!==env)return false;
    if(deck!=='all'&&String(e.own_deck_id||'')!==deck)return false;
    const actual=e.match_format==='mixed'?(m.match_format||'bo1'):(e.match_format||m.match_format||'bo1');
    return fmt==='all'||actual===fmt;
  });
}
function opponentName(m){return String(m.opponent_deck_name||m.opponent_pokemon_name||'未填對手牌組').trim()||'未填對手牌組'}
function keyName(s){return s.normalize('NFKC').toLocaleLowerCase('zh-Hant').replace(/\s+/g,' ').trim()}
function groupRows(rows){const groups=new Map();for(const{m}of rows){const label=opponentName(m),key=keyName(label);if(!groups.has(key))groups.set(key,{label,w:0,l:0,d:0,total:0});const g=groups.get(key);g.total++;if(m.result==='W')g.w++;else if(m.result==='L')g.l++;else g.d++}return [...groups.values()].map(g=>({...g,rate:g.total?g.w/g.total*100:0}))}

function renderAnalysis(){
  const status=$('#analysisStatus'),content=$('#analysisContent');if(!status||!content)return;
  const rows=filteredMatches(),w=rows.filter(x=>x.m.result==='W').length,l=rows.filter(x=>x.m.result==='L').length,d=rows.length-w-l;
  if(!rows.length){content.hidden=true;status.textContent=data.matches.length?'目前篩選條件沒有已完成的對局。':'還沒有可分析的戰報；先在比賽紀錄中填寫對局結果。';return}
  status.textContent='';content.hidden=false;$('#analysisTotal').textContent=String(rows.length);$('#analysisRecord').textContent=w+'W '+l+'L'+(d?' '+d+'D':'');$('#analysisRate').textContent=Math.round(w/rows.length*100)+'%';
  const groups=groupRows(rows).sort((a,b)=>b.rate-a.rate||b.total-a.total||a.label.localeCompare(b.label,'zh-Hant'));
  $('#matchupBars').innerHTML=groups.map(g=>'<div class="v510-bar-row"><div class="v510-bar-label"><strong>'+esc(g.label)+'</strong><span>'+g.w+'W '+g.l+'L'+(g.d?' '+g.d+'D':'')+'・'+g.total+' 場'+(g.total<5?' <em>樣本少</em>':'')+'</span></div><div class="v510-bar-track"><i style="width:'+Math.round(g.rate)+'%"></i></div><b>'+Math.round(g.rate)+'%</b></div>').join('');
  renderDonut(groups,rows.length);
}
function renderDonut(groups,total){
  let parts=[...groups].sort((a,b)=>b.total-a.total).slice(0,5);const rest=groups.slice().sort((a,b)=>b.total-a.total).slice(5).reduce((s,x)=>s+x.total,0);if(rest)parts.push({label:'其他',total:rest});
  let at=0;const stops=[];parts.forEach((p,i)=>{const from=at,to=at+p.total/total*100;stops.push(COLORS[i%COLORS.length]+' '+from.toFixed(2)+'% '+to.toFixed(2)+'%');at=to});
  const donut=$('#opponentDonut');donut.style.background='conic-gradient('+stops.join(',')+')';donut.innerHTML='<span>'+total+'<small>場</small></span>';
  $('#opponentLegend').innerHTML=parts.map((p,i)=>'<div><i style="background:'+COLORS[i%COLORS.length]+'"></i><span>'+esc(p.label)+'</span><b>'+p.total+' 場・'+Math.round(p.total/total*100)+'%</b></div>').join('');
}

function setupEnvironmentDialog(){
  if($('#environmentDialogV510'))return;
  const dialog=document.createElement('dialog');dialog.id='environmentDialogV510';dialog.className='v510-dialog';dialog.innerHTML='<form class="v510-env-modal"><button class="v510-dialog-close" type="button" aria-label="關閉">×</button><h3>環境管理</h3><p>設定名稱與日期範圍；儲存後會自動套用到日期相符、尚未分類的比賽。</p><div class="v510-env-fields"><label><span>環境名稱</span><input id="environmentNameV510" maxlength="60" placeholder="例：30週年環境" required></label><label><span>開始日期</span><input id="environmentStartV510" type="date" required></label><label><span>結束日期（選填）</span><input id="environmentEndV510" type="date"></label></div><div id="environmentMessageV510" class="v510-env-message"></div><div class="actions"><button class="btn primary" type="submit" id="environmentSaveV510">新增環境</button><button class="btn" type="button" id="environmentCancelEditV510" hidden>取消編輯</button></div><div class="v510-env-divider"></div><div class="v510-env-list-head"><h4>已設定環境</h4></div><div id="environmentListV510" class="v510-env-list"></div></form>';document.body.appendChild(dialog);
  $('.v510-dialog-close',dialog).addEventListener('click',()=>dialog.close());dialog.addEventListener('cancel',e=>{e.preventDefault();dialog.close()});$('.v510-env-modal',dialog).addEventListener('submit',saveEnvironment);$('#environmentCancelEditV510').addEventListener('click',resetEnvironmentForm);$('#environmentListV510').addEventListener('click',environmentListAction);
  $('#manageEnvironments')?.addEventListener('click',openEnvironmentDialog);
}
function openEnvironmentDialog(){resetEnvironmentForm();renderEnvironmentList();const d=$('#environmentDialogV510');try{if(!d.open)d.showModal()}catch{d.setAttribute('open','')}}
function resetEnvironmentForm(){editingEnvironmentId=null;$('#environmentNameV510').value='';$('#environmentStartV510').value='';$('#environmentEndV510').value='';$('#environmentSaveV510').textContent='新增環境';$('#environmentCancelEditV510').hidden=true;$('#environmentMessageV510').textContent=''}
function renderEnvironmentList(){const box=$('#environmentListV510');if(!box)return;const rows=[...data.environments].sort((a,b)=>b.startDate.localeCompare(a.startDate));box.innerHTML=rows.length?rows.map(x=>'<div class="v510-env-item"><div><strong>'+esc(x.name)+'</strong><span>'+formatDate(x.startDate)+' ～ '+(x.endDate?formatDate(x.endDate):'持續中')+'</span></div><div><button type="button" class="mini edit" data-env-edit="'+x.id+'">編輯</button><button type="button" class="mini del" data-env-delete="'+x.id+'">刪除</button></div></div>').join(''):'<div class="v510-env-empty">尚未設定環境。</div>'}
function overlaps(id,start,end){const last=end||'9999-12-31';return data.environments.find(x=>x.id!==id&&start<=(x.endDate||'9999-12-31')&&x.startDate<=last)}
async function applyEnvironmentsToUnclassified(session){
  const assignments=data.events.map(e=>({event:e,environment:!e.environment_id?environmentForDate(e.event_date||e.date):null})).filter(x=>x.environment);
  if(!assignments.length)return 0;
  if(session){for(const x of assignments){const{error}=await db.from('events').update({environment_id:x.environment.id}).eq('id',x.event.id).eq('user_id',session.user.id).is('environment_id',null);if(error)throw error}}
  else{let rows=[];try{rows=JSON.parse(localStorage.getItem('pokemon-lp-events')||'[]')}catch{}if(Array.isArray(rows)){const map=new Map(assignments.map(x=>[String(x.event.id),x.environment.id]));rows=rows.map(e=>map.has(String(e.id))?{...e,environmentId:map.get(String(e.id))}:e);localStorage.setItem('pokemon-lp-events',JSON.stringify(rows))}}
  assignments.forEach(x=>{x.event.environment_id=x.environment.id;x.event.environmentId=x.environment.id});
  window.dispatchEvent(new CustomEvent('pokemon:events-classified',{detail:assignments.map(x=>({eventId:x.event.id,environmentId:x.environment.id}))}));
  return assignments.length;
}
async function saveEnvironment(e){
  e.preventDefault();const name=$('#environmentNameV510').value.trim(),start=$('#environmentStartV510').value,end=$('#environmentEndV510').value,msg=$('#environmentMessageV510');
  if(!name||!start){msg.textContent='請輸入環境名稱與開始日期。';return}if(end&&end<start){msg.textContent='結束日期不能早於開始日期。';return}const conflict=overlaps(editingEnvironmentId,start,end);if(conflict){msg.textContent='日期範圍與「'+conflict.name+'」重疊，請先調整。';return}
  const{data:{session}}=await db.auth.getSession();const save=$('#environmentSaveV510');save.disabled=true;msg.textContent='儲存中…';
  try{
    if(session){let q=editingEnvironmentId?db.from('environments').update({name,start_date:start,end_date:end||null,updated_at:new Date().toISOString()}).eq('id',editingEnvironmentId).eq('user_id',session.user.id):db.from('environments').insert({user_id:session.user.id,name,start_date:start,end_date:end||null});const{data:row,error}=await q.select().single();if(error)throw error;const mapped=mapEnvironment(row);data.environments=editingEnvironmentId?data.environments.map(x=>x.id===editingEnvironmentId?mapped:x):[mapped,...data.environments]}
    else{const row={id:editingEnvironmentId||crypto.randomUUID(),name,startDate:start,endDate:end,createdAt:new Date().toISOString()};data.environments=editingEnvironmentId?data.environments.map(x=>x.id===editingEnvironmentId?row:x):[row,...data.environments];saveLocalEnvironments(data.environments)}
    const applied=await applyEnvironmentsToUnclassified(session);notifyEnvironments();populateFilters();renderAnalysis();renderEnvironmentList();resetEnvironmentForm();msg.textContent=applied?'已儲存，並自動套用到 '+applied+' 場未分類比賽。':'已儲存。';
  }catch(err){msg.textContent='儲存失敗：'+(err.message||err)}finally{save.disabled=false}
}
async function environmentListAction(e){
  const edit=e.target.closest('[data-env-edit]'),del=e.target.closest('[data-env-delete]');
  if(edit){const x=data.environments.find(v=>v.id===edit.dataset.envEdit);if(!x)return;editingEnvironmentId=x.id;$('#environmentNameV510').value=x.name;$('#environmentStartV510').value=x.startDate;$('#environmentEndV510').value=x.endDate||'';$('#environmentSaveV510').textContent='儲存修改';$('#environmentCancelEditV510').hidden=false;$('#environmentMessageV510').textContent='';$('#environmentNameV510').focus();return}
  if(!del)return;const x=data.environments.find(v=>v.id===del.dataset.envDelete);if(!x||!confirm('刪除「'+x.name+'」？已套用的比賽會改回未分類。'))return;
  const{data:{session}}=await db.auth.getSession();if(session){const{error}=await db.from('environments').delete().eq('id',x.id).eq('user_id',session.user.id);if(error){$('#environmentMessageV510').textContent='刪除失敗：'+error.message;return}}else{let events=[];try{events=JSON.parse(localStorage.getItem('pokemon-lp-events')||'[]')}catch{}if(Array.isArray(events)){events=events.map(v=>String(v.environmentId||'')===String(x.id)?{...v,environmentId:null}:v);localStorage.setItem('pokemon-lp-events',JSON.stringify(events))}}
  data.environments=data.environments.filter(v=>v.id!==x.id);saveLocalEnvironments(data.environments);notifyEnvironments();await loadData();renderEnvironmentList();
}
function bindRefresh(){document.addEventListener('click',e=>{if(e.target.closest?.('[data-v572-nav="analysis"]'))setTimeout(()=>loadData(),0)});window.addEventListener('pokemon:data-ready',()=>loadData());window.addEventListener('pokemon:event-save-success',()=>setTimeout(()=>loadData(),120));db?.auth.onAuthStateChange(()=>setTimeout(()=>loadData(true),80))}
function init(){setupAnalysis();setupEnvironmentDialog();bindRefresh();loadData(true);const v=$('.app-version-v14');if(v){v.textContent='V5.10.0';v.title='目前版本 V5.10.0'}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,180));else setTimeout(init,180);
})();
