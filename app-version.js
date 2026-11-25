(()=>{'use strict';
// Single source of truth for the visible release version.
const VERSION='V5.16.2';
window.PokemonAppVersion=VERSION;
function render(){
  const app=document.querySelector('.app');if(!app)return;
  let el=app.querySelector('.app-version-v14');
  if(!el){el=document.createElement('div');el.className='app-version-v14';app.appendChild(el);}
  if(el.textContent!==VERSION)el.textContent=VERSION;
  if(el.title!=='目前版本 '+VERSION)el.title='目前版本 '+VERSION;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
else render();
window.addEventListener('load',render,{once:true});
})();
