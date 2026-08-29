(()=>{'use strict';
const openRounds=new Set();
let pendingAdd=null,shareReport=null,refreshQueued=false;
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const matchId=row=>String(row?.dataset.match||'');
const roundNumber=row=>Number((qs('.round-no',row)?.textContent||'').replace(/\D/g,''))||0;

function pokemonImageFromInput(input){
  if(!input)return'';
  if(input.dataset.imageUrl)return input.dataset.imageUrl;
  const id=Number(input.dataset.pokemonId)||0;
  if(id&&window.PokemonCatalog?.sprite)return window.PokemonCatalog.sprite(id);
  return'';
}
function summaryImages(row){
  const out=[],seen=new Set(),detail=qs(':scope>.round-detail-v15',row)||row,input=qs('.r-opponent',detail);
  const add=(src,alt)=>{src=String(src||'').trim();if(!src||seen.has(src))return;seen.add(src);out.push({src,alt:alt||'對手寶可夢'})};
  qsa('.primary-thumb-wrap img,.opponent-input-wrap img,.secondary-picker-btn img',detail).forEach(img=>add(img.currentSrc||img.getAttribute('src'),img.alt));
  if(!out.length)add(pokemonImageFromInput(input),input?.dataset.pokemonName||'主打手');
  return out.slice(0,2);
}
function summaryResult(row){
  const result=qs('.r-result',row)?.value||'N';
  const score=qs('.r-score',row)?.value||'';
  if(row.classList.contains('bo3')&&score){
    if(result==='W'||result==='L'||result==='D')return{result,main:score,small:result};
    return{result:'N',main:score,small:''};
  }
  return{result,main:result==='N'?'—':result,small:''};
}
function stateClass(result){return result==='W'?'v15-win':result==='L'?'v15-loss':result==='D'?'v15-draw':'v15-empty'}
function buildSummary(row){
  let summary=qs(':scope>.round-summary-v15',row);
  if(!summary){
    summary=document.createElement('button');
    summary.type='button';summary.className='round-summary-v15';
    summary.innerHTML='<span class="v15-round-no"></span><span class="v15-deck-summary"><span class="v15-pokemon-pair"></span><span class="v15-deck-name"></span></span><span class="v15-result-summary"><strong></strong><small></small></span><span class="v15-chevron" aria-hidden="true">⌄</span>';
    row.insertBefore(summary,row.firstChild);
    summary.addEventListener('click',()=>{
      const report=row.closest('.report');
      if(report?.classList.contains('v15-share-mode'))return;
      const id=matchId(row);if(!id)return;
      openRounds.has(id)?openRounds.delete(id):openRounds.add(id);
      applyOpen(row);updateSummary(row);
    });
  }
  return summary;
}
function ensureDetail(row){
  let detail=qs(':scope>.round-detail-v15',row);
  if(!detail){detail=document.createElement('div');detail.className='round-detail-v15';row.appendChild(detail)}
  const summary=qs(':scope>.round-summary-v15',row);
  [...row.childNodes].forEach(n=>{if(n!==summary&&n!==detail)detail.appendChild(n)});
  return detail;
}
function applyOpen(row){
  const id=matchId(row),open=openRounds.has(id)&&!row.closest('.report')?.classList.contains('v15-share-mode');
  row.classList.toggle('v15-open',open);
  const summary=qs(':scope>.round-summary-v15',row);if(summary)summary.setAttribute('aria-expanded',open?'true':'false');
}
function updateSummary(row){
  const summary=buildSummary(row),detail=ensureDetail(row);
  if(!detail)return;
  const no=roundNumber(row),name=(qs('.r-opponent',detail)?.value||'').trim(),images=summaryImages(row),r=summaryResult(row);
  const key=JSON.stringify([no,name,images.map(x=>x.src),r.result,r.main,r.small]);
  if(summary.dataset.summaryKey!==key){
    summary.dataset.summaryKey=key;
    qs('.v15-round-no',summary).textContent='R'+(no||'?');
    const pair=qs('.v15-pokemon-pair',summary);pair.innerHTML='';
    for(const img of images){const el=document.createElement('img');el.src=img.src;el.alt=img.alt;pair.appendChild(el)}
    qs('.v15-deck-name',summary).textContent=name||'尚未填寫對手牌組';
    const resultBox=qs('.v15-result-summary',summary);
    qs('strong',resultBox).textContent=r.main;qs('small',resultBox).textContent=r.small;
  }
  const nextState=stateClass(r.result);
  for(const c of ['v15-win','v15-loss','v15-draw','v15-empty'])row.classList.toggle(c,c===nextState);
  applyOpen(row);
}
function decorateRound(row){
  if(!row?.matches?.('.round'))return;
  buildSummary(row);ensureDetail(row);updateSummary(row);
  setTimeout(()=>{if(row.isConnected)updateSummary(row)},120);
  const id=matchId(row);
  if(pendingAdd&&id&&!pendingAdd.before.has(id)){
    openRounds.add(id);pendingAdd=null;applyOpen(row);
    setTimeout(()=>qs(':scope>.round-summary-v15',row)?.scrollIntoView({behavior:'smooth',block:'center'}),80);
  }
}
function setAll(report,open){
  qsa('.round',report).forEach(row=>{const id=matchId(row);if(!id)return;open?openRounds.add(id):openRounds.delete(id);applyOpen(row);updateSummary(row)});
}
function syncTopShareExit(report,on){
  const card=report?.closest('.event-card'),main=card&&qs(':scope>.event-main',card);
  if(!card||!main)return;
  card.classList.toggle('v15-card-share-mode',on);
  let exit=qs(':scope>.v15-share-exit-top',main);
  if(!on){exit?.remove();return}
  if(!exit){
    exit=document.createElement('button');
    exit.type='button';exit.className='v15-share-exit-top';exit.textContent='結束分享';
    exit.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setShareMode(report,false)});
    main.appendChild(exit);
  }
}
function setShareMode(report,on){
  report.classList.toggle('v15-share-mode',on);shareReport=on?report:null;
  syncTopShareExit(report,on);
  if(on)setAll(report,false);
  const b=qs('.v15-share',report);if(b)b.textContent='分享模式';
  qsa('.round',report).forEach(applyOpen);
}
function decorateReport(report){
  if(!report||report.dataset.v15report==='1')return;
  report.dataset.v15report='1';
  const head=qs('.report-head',report);
  if(head){
    const tools=document.createElement('div');tools.className='v15-report-tools';
    tools.innerHTML='<button type="button" class="v15-tool v15-expand">展開全部</button><button type="button" class="v15-tool v15-collapse">收合全部</button><button type="button" class="v15-tool v15-share">分享模式</button>';
    head.insertAdjacentElement('afterend',tools);
    qs('.v15-expand',tools).addEventListener('click',()=>setAll(report,true));
    qs('.v15-collapse',tools).addEventListener('click',()=>setAll(report,false));
    qs('.v15-share',tools).addEventListener('click',()=>setShareMode(report,!report.classList.contains('v15-share-mode')));
  }
  const add=qs('.add-round',report);
  if(add){add.textContent='＋ 新增一輪';add.classList.add('v15-add-round')}
  qsa('.round',report).forEach(decorateRound);
}
function decorateAll(){qsa('.report').forEach(decorateReport);qsa('.round').forEach(decorateRound)}
function queueRefresh(){if(refreshQueued)return;refreshQueued=true;requestAnimationFrame(()=>{refreshQueued=false;decorateAll()})}

const observer=new MutationObserver(()=>queueRefresh());
observer.observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('input',e=>{const row=e.target.closest?.('.round');if(row)setTimeout(()=>updateSummary(row),0)},true);
document.addEventListener('change',e=>{const row=e.target.closest?.('.round');if(row)setTimeout(()=>updateSummary(row),0)},true);
document.addEventListener('click',e=>{
  const add=e.target.closest?.('.add-round');
  if(add){const report=add.closest('.report');pendingAdd={before:new Set(qsa('.round',report).map(matchId).filter(Boolean)),report};return}
  const choice=e.target.closest?.('.seg-btn,.bo3-choice,.secondary-picker-btn,[data-history-id],.opp-thumb');
  if(choice){const row=choice.closest('.round');if(row)setTimeout(()=>updateSummary(row),80)}
},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&shareReport)setShareMode(shareReport,false)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateAll);else decorateAll();
})();