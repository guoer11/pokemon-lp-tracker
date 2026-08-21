(()=>{'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
let queued=false;
function turnText(row){
  if(row.classList.contains('bo3')){
    const active=qs('.bo3-game[data-game="1"] .bo3-turn-buttons .bo3-choice.active',row);
    const v=active?.dataset.value||'';
    return v==='first'?'G1先':v==='second'?'G1後':'';
  }
  const v=qs('.r-turn',row)?.value||'';
  return v==='first'?'先攻':v==='second'?'後攻':'';
}
function updateRow(row){
  if(!row?.matches?.('.round'))return;
  const box=qs(':scope>.round-summary-v15 .v15-result-summary',row);
  if(!box)return;
  let tag=qs(':scope>.v15-turn-summary',box);
  if(!tag){
    tag=document.createElement('em');
    tag.className='v15-turn-summary';
    box.insertBefore(tag,box.firstChild);
  }
  const text=turnText(row);
  tag.textContent=text;
  tag.hidden=!text;
  box.classList.toggle('v15-has-turn',!!text);
}
function scan(){qsa('.round').forEach(updateRow)}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener('change',e=>{if(e.target.closest?.('.round'))setTimeout(queue,0)},true);
document.addEventListener('click',e=>{if(e.target.closest?.('.bo3-choice,.seg-btn'))setTimeout(queue,30)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scan();setTimeout(scan,180)});else{scan();setTimeout(scan,180)}
})();
