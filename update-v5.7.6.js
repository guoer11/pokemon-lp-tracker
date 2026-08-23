(()=>{'use strict';
if(!('serviceWorker' in navigator)||window.__pokemonUpdateV576)return;
window.__pokemonUpdateV576=true;
let reloading=false;
navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(reloading)return;
  reloading=true;
  window.location.reload();
});
window.addEventListener('load',async()=>{
  try{
    const reg=await navigator.serviceWorker.register('./sw.js?v=5.7.6-r2',{updateViaCache:'none'});
    await reg.update();
  }catch{}
});
})();
