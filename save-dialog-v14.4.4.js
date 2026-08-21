(()=>{'use strict';
if(window.__pokemonSaveDialogV1444)return;
window.__pokemonSaveDialogV1444=true;

let pending=false,beforeCount=0,wasEdit=false;
const $=id=>document.getElementById(id);

function getDialog(){return $('eventDialogV14')}
function closeSavedDialog(){
  const dlg=getDialog();
  pending=false;
  if(dlg?.open){try{dlg.close()}catch{dlg.removeAttribute('open')}}
}

function init(){
  const form=$('form'),msg=$('msg'),list=$('list'),btn=$('submitBtn');
  if(!form||!msg||!list||!btn)return;

  // Shared desktop/mobile guard: one submit at a time.
  form.addEventListener('submit',e=>{
    if(pending){
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    pending=true;
    beforeCount=list.children.length;
    wasEdit=btn.textContent.trim()==='儲存修改';

    // Synchronous validation errors do not enter a busy state; release the guard.
    setTimeout(()=>{
      if(pending&&!btn.disabled&&msg.textContent.trim()&&!msg.classList.contains('ok'))pending=false;
    },0);
  },true);

  // New event render happens immediately after a successful save on PC/local mode.
  new MutationObserver(()=>{
    if(pending&&!wasEdit&&list.children.length!==beforeCount)closeSavedDialog();
  }).observe(list,{childList:true});

  // Covers desktop cloud saves and edit-mode saves.
  new MutationObserver(()=>{
    if(!pending)return;
    if(msg.classList.contains('ok')&&/已儲存/.test(msg.textContent)){
      closeSavedDialog();
      return;
    }
    if(!btn.disabled&&msg.textContent.trim()&&!msg.classList.contains('ok'))pending=false;
  }).observe(msg,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});

  // iPhone safe-write layer emits this as soon as Supabase confirms success.
  window.addEventListener('pokemon:event-save-success',closeSavedDialog);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
