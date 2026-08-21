(()=>{'use strict';
if(window.__pokemonOpponentHistoryKeepOpen541)return;
window.__pokemonOpponentHistoryKeepOpen541=true;

// The iPhone keyboard dismissal blurs the input. Keep the suggestion/history
// panel open on blur; close it only when the user taps outside that opponent field.
document.addEventListener('blur',e=>{
  const input=e.target?.closest?.('.r-opponent');
  if(!input)return;
  e.stopImmediatePropagation();
  e.stopPropagation();
},true);

function closeOutside(activeSearch){
  document.querySelectorAll('.opponent-results').forEach(box=>{
    if(!activeSearch||box.closest('.opponent-search')!==activeSearch){
      box.hidden=true;
      delete box.dataset.mode;
    }
  });
}

document.addEventListener('pointerdown',e=>{
  const activeSearch=e.target?.closest?.('.opponent-search')||null;
  closeOutside(activeSearch);
},true);
})();
