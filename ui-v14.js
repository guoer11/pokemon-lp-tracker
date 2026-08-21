(()=>{'use strict';
const VERSION='V5.3.5';
const $=(s,r=document)=>r.querySelector(s);

function ensureFavicon(){
  let link=document.querySelector('link[rel="icon"][data-masterball]');
  if(!link){
    link=document.createElement('link');
    link.rel='icon';
    link.type='image/svg+xml';
    link.dataset.masterball='1';
    document.head.appendChild(link);
  }
  link.href='./favicon.svg?v=15.1';
}

function loadV143Assets(){
  if(!document.querySelector('link[data-v143]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./ui-v14.3.css?v=14.3';link.dataset.v143='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-v143]')){
    const s=document.createElement('script');s.src='./ui-v14.3.js?v=14.3';s.dataset.v143='1';document.body.appendChild(s);
  }
}

function loadV1515Fixes(){
  if(!document.querySelector('link[data-v1515]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./v15.1.5.css?v=15.1.5';link.dataset.v1515='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-v1515]')){
    const s=document.createElement('script');s.src='./v15.1.5.js?v=15.1.5';s.dataset.v1515='1';document.body.appendChild(s);
  }
}

function loadV152Assets(){
  if(!document.querySelector('link[data-v152]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./v15.2.css?v=15.3';link.dataset.v152='1';document.head.appendChild(link);
  }
  if(!document.querySelector('script[data-v152]')){
    const s=document.createElement('script');s.src='./v15.2.js?v=15.3';s.dataset.v152='1';document.body.appendChild(s);
  }
}

function loadV153Assets(){
  if(!document.querySelector('script[data-v153]')){
    const s=document.createElement('script');s.src='./v15.3.js?v=15.3.1';s.dataset.v153='1';document.body.appendChild(s);
  }
}

function openDialog(dlg){
  if(!dlg)return;
  try{if(!dlg.open)dlg.showModal()}catch{dlg.setAttribute('open','')}
  setTimeout(()=>{const first=$('#date',dlg);first?.focus({preventScroll:true})},60);
}

function initTournamentDialog(){
  const form=document.getElementById('form');
  const panel=form?.closest('section.panel');
  const app=$('.app');
  if(!form||!panel||!app||panel.dataset.v14==='1')return;
  panel.dataset.v14='1';
  panel.classList.add('event-form-panel-v14');

  const dlg=document.createElement('dialog');
  dlg.id='eventDialogV14';
  dlg.className='event-dialog-v14';
  const close=document.createElement('button');
  close.type='button';
  close.className='event-dialog-close-v14';
  close.setAttribute('aria-label','取消');
  close.title='取消';
  close.textContent='×';

  panel.parentNode.insertBefore(dlg,panel);
  dlg.append(close,panel);

  const add=document.createElement('button');
  add.type='button';
  add.className='quick-add-v14';
  add.title='新增比賽';
  add.setAttribute('aria-label','新增比賽');
  add.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M12 13v5M9.5 15.5h5"/></svg>';
  app.append(add);

  add.addEventListener('click',()=>{
    document.getElementById('reset')?.click();
    openDialog(dlg);
  });
  close.addEventListener('click',()=>dlg.close());

  dlg.addEventListener('cancel',e=>e.preventDefault());

  document.addEventListener('click',e=>{
    if(e.target.closest?.('.event-card .edit'))setTimeout(()=>openDialog(dlg),0);
  },true);

  window.addEventListener('pokemon:event-save-success',()=>{
    if(dlg.open)dlg.close();
  });

  const msg=document.getElementById('msg');
  if(msg){
    new MutationObserver(()=>{
      if(dlg.open&&msg.classList.contains('ok')&&msg.textContent.trim())setTimeout(()=>{if(dlg.open)dlg.close()},80);
    }).observe(msg,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
}

function initCompetitionHint(){
  const hint=$('.listhead .hint');
  if(!hint)return;
  hint.innerHTML='<span class="competition-hint-line">依最終名次顯示冠軍／亞軍／TOP 4／TOP 8／TOP 16</span><span class="competition-hint-line">LP 總分仍取可計分賽事最高 8 場。點比賽卡片可展開／收起戰報。</span>';
}

function initVersion(){
  const app=$('.app');if(!app)return;
  let v=$('.app-version-v14',app);
  if(!v){v=document.createElement('div');v.className='app-version-v14';app.append(v)}
  v.textContent=VERSION;v.title='目前版本 '+VERSION;
}

function init(){ensureFavicon();loadV143Assets();loadV1515Fixes();loadV152Assets();loadV153Assets();initTournamentDialog();initCompetitionHint();initVersion()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
