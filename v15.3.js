(()=>{'use strict';
const $=id=>document.getElementById(id),qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let queued=false,internalLpWrite=false;

/* BO1 compact summary: show saved first/second turn before W/L/D. */
function bo1TurnValue(row){
  const select=qs('.r-turn',row);
  let v=select?.value||'';
  if(!v||v==='unknown')v=qs('.turn-segment .seg-btn.active',row)?.dataset.value||'';
  return v;
}
function syncBo1Turn(row){
  if(!row?.matches?.('.round:not(.bo3)'))return;
  const box=qs(':scope>.round-summary-v15 .v15-result-summary',row);if(!box)return;
  let tag=qs(':scope>.v15-turn-summary',box);
  if(!tag){tag=document.createElement('em');tag.className='v15-turn-summary';box.insertBefore(tag,box.firstChild)}
  const v=bo1TurnValue(row),text=v==='first'?'先攻':v==='second'?'後攻':'';
  tag.textContent=text;tag.hidden=!text;box.classList.toggle('v15-has-turn',!!text);
}
function scanTurns(){qsa('.round:not(.bo3)').forEach(syncBo1Turn)}
function queueTurns(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scanTurns()})}
new MutationObserver(queueTurns).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',e=>{const row=e.target.closest?.('.round:not(.bo3)');if(row)setTimeout(()=>syncBo1Turn(row),0)},true);
document.addEventListener('click',e=>{const btn=e.target.closest?.('.round:not(.bo3) .turn-segment .seg-btn');if(btn){const row=btn.closest('.round');setTimeout(()=>syncBo1Turn(row),40)}},true);

/* 2025-26 LP tables used provisionally for 2026-27 Ultra/Master Ball. */
function bandScore(rank,bands){
  if(!Number.isInteger(rank)||rank<1)return 0;
  for(const[a,b,score]of bands)if(rank>=a&&rank<=b)return score;
  return 0;
}
function ultraScore(participants,rank){
  if(!Number.isInteger(participants)||participants<32||participants>1024||!Number.isInteger(rank)||rank<1||rank>participants)return 0;
  const bands=[[1,1,100],[2,2,75],[3,4,50],[5,8,25],[9,16,20],[17,32,15],[33,64,10]];
  if(participants>=257)bands.push([65,128,8]);
  if(participants>=513)bands.push([129,256,6]);
  return bandScore(rank,bands);
}
function masterScore(participants,rank){
  if(!Number.isInteger(participants)||participants<1||!Number.isInteger(rank)||rank<1||rank>participants)return 0;
  return bandScore(rank,[[1,1,300],[2,2,150],[3,4,100],[5,8,75],[9,16,50],[17,32,25],[33,64,15],[65,128,10]]);
}
function isLegacyLeague(){const league=$('league');return league&&(league.value==='ultra'||league.value==='master')}
function legacyScore(){
  const league=$('league'),parts=$('participants'),place=$('placement');
  if(!league||!parts||!place)return 0;
  const p=Number(parts.value),r=Number(place.value);
  return league.value==='ultra'?ultraScore(p,r):masterScore(p,r);
}
function writeLp(value){const lp=$('lp');if(!lp)return;internalLpWrite=true;lp.value=String(value);internalLpWrite=false}
function syncLegacyScore(forceAuto=false){
  const league=$('league'),parts=$('participants'),lp=$('lp'),help=$('scoreHelp'),preview=$('preview');
  if(!league||!parts||!lp||!help||!preview||!isLegacyLeague())return;
  const score=legacyScore();
  lp.readOnly=false;lp.required=true;
  if(forceAuto||lp.dataset.manualOverride!=='1'){
    lp.dataset.manualOverride='0';
    writeLp(score);
  }
  const manual=lp.dataset.manualOverride==='1';
  const actual=Math.max(0,Number(lp.value)||0);
  if(manual){
    help.textContent='已手動調整 LP；自動預估 '+score+' LP（暫用 2025–26 規則）';
    preview.innerHTML='目前輸入：<strong>'+actual+' LP</strong> <span class="legacy-score-note">（手動；自動預估 '+score+' LP）</span>';
    return;
  }
  if(league.value==='ultra'){
    const p=Number(parts.value);
    if(Number.isInteger(p)&&p>0&&p<32)help.textContent='暫用 2025–26 規則：31 人以下不發高級球 LP；可手動修改';
    else if(Number.isInteger(p)&&p>1024)help.textContent='暫用 2025–26 規則；參加人數超出去年度表格範圍，可手動修改';
    else help.textContent='暫用 2025–26 高級球 LP；自動帶入後仍可手動修改';
  }else{
    help.textContent='暫用 2025–26 大師球 LP；自動帶入後仍可手動修改';
  }
  preview.innerHTML='目前預估：<strong>'+score+' LP</strong> <span class="legacy-score-note">（2025–26 規則，可手動修改）</span>';
}
function prepareEditScore(){
  const lp=$('lp');if(!lp||!isLegacyLeague())return;
  const score=legacyScore(),saved=Number(lp.value);
  lp.dataset.manualOverride=Number.isFinite(saved)&&saved!==score?'1':'0';
  syncLegacyScore(false);
}
function installScore(){
  const league=$('league'),parts=$('participants'),place=$('placement'),lp=$('lp');
  if(!league||!parts||!place||!lp)return;
  for(const el of [league,parts,place]){
    const recalc=()=>setTimeout(()=>{
      if(isLegacyLeague()){
        lp.dataset.manualOverride='0';
        syncLegacyScore(true);
      }else{
        delete lp.dataset.manualOverride;
      }
    },0);
    el.addEventListener('input',recalc);
    el.addEventListener('change',recalc);
  }
  lp.addEventListener('input',()=>{
    if(internalLpWrite||!isLegacyLeague())return;
    lp.dataset.manualOverride='1';
    syncLegacyScore(false);
  });
  document.addEventListener('submit',e=>{if(e.target?.id==='form'&&isLegacyLeague())syncLegacyScore(false)},true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.event-card .edit'))setTimeout(prepareEditScore,80);
    if(e.target.closest?.('#reset,.quick-add-v14'))setTimeout(()=>{delete lp.dataset.manualOverride},40);
  },true);
  setTimeout(()=>{if(isLegacyLeague())syncLegacyScore(true)},120);
}

function init(){scanTurns();setTimeout(scanTurns,220);installScore()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
