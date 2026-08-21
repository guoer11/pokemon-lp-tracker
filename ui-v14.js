(()=>{'use strict';
const VERSION='V14';
const $=(s,r=document)=>r.querySelector(s);

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

  // Existing edit buttons stop bubbling, so capture first and open after app.js fills the form.
  document.addEventListener('click',e=>{
    if(e.target.closest?.('.event-card .edit'))setTimeout(()=>openDialog(dlg),0);
  },true);

  // Desktop save/update: close after the existing app reports success.
  const msg=document.getElementById('msg');
  if(msg){
    new MutationObserver(()=>{
      if(dlg.open&&msg.classList.contains('ok')&&msg.textContent.trim())setTimeout(()=>{if(dlg.open)dlg.close()},350);
    }).observe(msg,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
  }
}

function initVersion(){
  const app=$('.app');if(!app||$('.app-version-v14',app))return;
  const v=document.createElement('div');v.className='app-version-v14';v.textContent=VERSION;v.title='目前版本 '+VERSION;app.append(v);
}

function init(){initTournamentDialog();initVersion()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
