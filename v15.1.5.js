(()=>{'use strict';
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function ensure(row){
  if(!row?.matches?.('.round'))return;
  const detail=qs(':scope>.round-detail-v15',row);if(!detail)return;
  let btn=qs(':scope>.v15-mobile-collapse',detail);
  if(btn)return;
  btn=document.createElement('button');
  btn.type='button';
  btn.className='v15-mobile-collapse';
  btn.textContent='▲ 收起此輪';
  btn.setAttribute('aria-label','收起此輪');
  btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const summary=qs(':scope>.round-summary-v15',row);
    if(summary)summary.click();
  });
  detail.appendChild(btn);
}
function scan(){qsa('.round').forEach(ensure)}
let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})}
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scan);else scan();
})();
