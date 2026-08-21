(()=>{'use strict';
const $=id=>document.getElementById(id),qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let queued=false;

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
function syncLegacyScore(){
  const league=$('league'),parts=$('participants'),place=$('placement'),lp=$('lp'),help=$('scoreHelp'),preview=$('preview');
  if(!league||!parts||!place||!lp||!help||!preview)return;
  if(league.value!=='ultra'&&league.value!=='master')return;
  const p=Number(parts.value),r=Number(place.value);
  let score=0;
  if(league.value==='ultra'){
    score=ultraScore(p,r);
    lp.readOnly=true;lp.required=false;lp.value=String(score);
    if(Number.isInteger(p)&&p>0&&p<32){
      help.textContent='暫用 2025–26 規則：31 人以下不發高級球 LP';
    }else if(Number.isInteger(p)&&p>1024){
      help.textContent='暫用 2025–26 規則；參加人數超出去年度表格範圍';
    }else{
      help.textContent='暫用 2025–26 高級球 LP；以參加人數推定賽事規模';
    }
  }else{
    score=masterScore(p,r);
    lp.readOnly=true;lp.required=false;lp.value=String(score);
    help.textContent='暫用 2025–26 大師球 LP 規則自動計算';
  }
  preview.innerHTML='目前預估：<strong>'+score+' LP</strong> <span class="legacy-score-note">（2025–26 規則）</span>';
}
function installScore(){
  const ids=['league','participants','placement'];
  for(const id of ids){const el=$(id);if(!el)continue;el.addEventListener('input',()=>setTimeout(syncLegacyScore,0));el.addEventListener('change',()=>setTimeout(syncLegacyScore,0))}
  document.addEventListener('submit',e=>{if(e.target?.id==='form')syncLegacyScore()},true);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.event-card .edit,#reset,.quick-add-v14'))setTimeout(syncLegacyScore,30);
  });
  setTimeout(syncLegacyScore,120);
}

function init(){scanTurns();setTimeout(scanTurns,220);installScore()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
