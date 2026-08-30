(()=>{'use strict';
if(window.__pokemonV58)return;window.__pokemonV58=true;
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const URL='https://ceobnyikrudlxasyjukg.supabase.co';
const KEY='sb_publishable_6uVBALI1T3lMZoFEUiLK4g__R7gv0fz';
const sb58=window.supabase?.createClient?window.supabase.createClient(URL,KEY):null;
const countryCache=new Map(),countryDraft=new Map(),loading=new Set();let queued=false;
function norm(v){return String(v||'').toUpperCase().replace(/[^A-Z]/g,'').slice(0,2)}
function flag(code){code=norm(code);if(!/^[A-Z]{2}$/.test(code))return'';return String.fromCodePoint(...[...code].map(c=>127397+c.charCodeAt(0)))}
function isWorldRow(row){return !!row?.closest('.event-card')?.querySelector('.worldbadge')}
function cleanCardMeta(){
  qsa('.event-card .meta').forEach(meta=>{
    const raw=String(meta.textContent||'').trim();
    const recordMatch=raw.match(/(\d+W\s+\d+L(?:\s+\d+D)?)\s*$/i);
    const record=recordMatch?recordMatch[1]:'';
    const base=(recordMatch?raw.slice(0,recordMatch.index):raw).trim().replace(/[｜\s]+$/,'');
    const parts=base.split('｜').map(x=>x.trim()).filter(Boolean);
    if(parts.length<2)return;
    const clean=parts.slice(0,2).join('｜');
    const expected=clean+(record?' '+record:'');
    if(meta.dataset.v583Meta===expected)return;
    meta.dataset.v583Meta=expected;
    meta.textContent=clean;
    if(record){
      meta.append(' ');
      const box=document.createElement('span');box.className='v583-record';
      const tokens=record.match(/\d+[WLD]/gi)||[];
      tokens.forEach((token,i)=>{
        if(i)box.append(' ');
        const span=document.createElement('span');
        span.className='v583-record-'+token.slice(-1).toLowerCase();
        span.textContent=token.toUpperCase();box.appendChild(span);
      });
      meta.appendChild(box);
    }
  });
}
function syncFlag(row){
  const summary=qs(':scope>.round-summary-v15',row);if(!summary)return;
  const no=qs(':scope>.v15-round-no',summary);if(!no)return;
  qsa('.v58-country-flag-summary',summary).forEach(el=>{if(el.parentNode!==no)el.remove()});
  let el=qs(':scope>.v58-country-flag-summary',no);
  const code=countryCache.get(String(row.dataset.match||''))||'',emoji=flag(code);
  if(!emoji){el?.remove();return}
  if(!el){el=document.createElement('span');el.className='v58-country-flag-summary';no.appendChild(el)}
  el.textContent=emoji;el.title=code;el.setAttribute('aria-label','對手國家 '+code);
}
function syncPreview(row){
  const input=qs('.v58-country-input',row),preview=qs('.v58-country-preview',row);if(!input||!preview)return;
  const code=norm(input.value);input.value=code;preview.textContent=flag(code);
  input.classList.toggle('v58-invalid',!!code&&code.length!==2);
}
function ensureCountryField(row){
  if(!isWorldRow(row))return;
  row.classList.add('v58-world-round');
  const id=String(row.dataset.match||'');if(!id)return;
  const opp=qs('.opponent-search',row);if(!opp)return;
  let holder=qs(':scope>.v58-country-row',opp);
  if(!holder){
    holder=document.createElement('div');holder.className='v58-country-row';
    holder.innerHTML='<span class="v58-country-label">對手國家</span><input class="v58-country-input" inputmode="text" autocomplete="off" autocapitalize="characters" maxlength="2" placeholder="JP" aria-label="對手國家代碼"><span class="v58-country-preview" aria-hidden="true"></span><span class="v58-country-help">世界賽限定，輸入 JP／US／TW…</span><span class="v58-country-status"></span>';
    opp.appendChild(holder);
    const input=qs('.v58-country-input',holder);
    input.addEventListener('input',()=>{const code=norm(input.value);input.value=code;countryDraft.set(id,code);syncPreview(row)});
    input.addEventListener('blur',()=>syncPreview(row));
  }
  const input=qs('.v58-country-input',holder),draft=countryDraft.get(id),cached=countryCache.get(id);
  if(draft!==undefined){
    if(document.activeElement!==input&&input.value!==draft){input.value=draft;syncPreview(row)}
  }else if(cached!==undefined&&document.activeElement!==input&&input.value!==cached){input.value=cached;syncPreview(row)}
  syncFlag(row);
}
async function hydrate(){
  if(!sb58)return;
  const rows=qsa('.round').filter(isWorldRow),ids=rows.map(r=>String(r.dataset.match||'')).filter(id=>id&&!countryCache.has(id)&&!loading.has(id));
  if(!ids.length)return;
  ids.forEach(id=>loading.add(id));
  try{
    const {data:{session}}=await sb58.auth.getSession();if(!session){ids.forEach(id=>loading.delete(id));return}
    const {data,error}=await sb58.from('matches').select('id,opponent_country_code').in('id',ids);
    if(error)throw error;
    const got=new Map((data||[]).map(r=>[String(r.id),norm(r.opponent_country_code||'')]));
    ids.forEach(id=>{countryCache.set(id,got.get(id)||'');loading.delete(id)});
    rows.forEach(row=>{ensureCountryField(row);syncFlag(row)});
  }catch{ids.forEach(id=>loading.delete(id))}
}
function scan(){
  cleanCardMeta();
  qsa('.round').forEach(row=>{if(isWorldRow(row))ensureCountryField(row)});
  hydrate();
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('.save-round');if(!btn)return;
  const row=btn.closest('.round');if(!row||!isWorldRow(row)||!sb58)return;
  const id=String(row.dataset.match||''),input=qs('.v58-country-input',row);if(!id||!input)return;
  const code=norm(input.value),status=qs('.v58-country-status',row),old=countryCache.get(id)||'';
  input.value=code;countryDraft.set(id,code);syncPreview(row);
  if(code&&code.length!==2){if(status){status.textContent='請輸入2碼';status.className='v58-country-status err'};return}
  countryCache.set(id,code);syncFlag(row);
  setTimeout(async()=>{
    try{
      const {data:{session}}=await sb58.auth.getSession();if(!session)throw new Error('not signed in');
      const {error}=await sb58.from('matches').update({opponent_country_code:code||null}).eq('id',id).eq('user_id',session.user.id);
      if(error)throw error;
      countryDraft.delete(id);
      if(status&&status.isConnected){status.textContent='已儲存';status.className='v58-country-status ok';setTimeout(()=>{if(status.isConnected)status.textContent=''},1200)}
    }catch{
      countryCache.set(id,old);countryDraft.set(id,code);if(status&&status.isConnected){status.textContent='國家未儲存';status.className='v58-country-status err'};queue();
    }
  },0);
},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();setTimeout(scan,250)});else{scan();setTimeout(scan,250)}
})();