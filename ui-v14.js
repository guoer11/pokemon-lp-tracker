(()=>{'use strict';
const VERSION='V14.4';
const $=(s,r=document)=>r.querySelector(s);

function loadV143Assets(){
  if(!document.querySelector('link[data-v143]')){
    const link=document.createElement('link');link.rel='stylesheet';link.href='./ui-v14.3.css?v=14.3';link.dataset.v143='1';document.head.append(link);
  }
  if(!document.querySelector('script[data-v143]')){
    const s=document.createElement('script');s.src='./ui-v14.3.js?v=14.3';s.dataset.v143='1';document.body.append(s);
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
  close.setAttribute('aria-label','關閉');
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
  dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});

  document.addEventListener('click',e=>{
    if(e.target.closest?.('.event-card .edit'))setTimeout(()=>openDialog(dlg),0);
  },true);

  const msg=document.getElementById('msg');
  if(msg){
    new MutationObserver(()=>{
      if(dlg.open&&msg.classList.contains('ok')&&msg.textContent.trim())setTimeout(()=>{if(dlg.open)dlg.close()},120);
    }).observe(msg,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
}

function initVersion(){
  const app=$('.app');if(!app)return;
  let v=$('.app-version-v14',app);
  if(!v){v=document.createElement('div');v.className='app-version-v14';app.append(v)}
  v.textContent=VERSION;v.title='目前版本 '+VERSION;
}

function init(){loadV143Assets();initTournamentDialog();initVersion()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
