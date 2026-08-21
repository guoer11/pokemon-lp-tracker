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
  const form=$('form'),msg=$('msg'),list=$('list'),btn=$('submitBtn'),title=$('formTitle');
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

  // Successful edit calls resetForm(), which restores these labels.
  // This is a more reliable signal than waiting for the status message on Safari/Chrome.
  const detectEditSuccess=()=>{
    if(!pending||!wasEdit)return;
    const resetDone=btn.textContent.trim()==='儲存比賽'&&(!title||title.textContent.trim()==='新增比賽');
    if(resetDone)closeSavedDialog();
  };
  new MutationObserver(detectEditSuccess).observe(btn,{childList:true,characterData:true,subtree:true});
  if(title)new MutationObserver(detectEditSuccess).observe(title,{childList:true,characterData:true,subtree:true});

  // Success/failure message fallback for both new and edited events.
  new MutationObserver(()=>{
    if(!pending)return;
    if(msg.classList.contains('ok')&&msg.textContent.trim()){
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
