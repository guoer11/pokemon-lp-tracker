(()=>{'use strict';
if(window.__pokemonV573)return;window.__pokemonV573=true;
const VERSION='V5.8.3';
function ensureStyle(){
  if(!document.querySelector('link[data-v575]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./v5.7.5.css?v=5.7.5';link.dataset.v575='1';document.head.appendChild(link)}
  if(!document.querySelector('link[data-v576]')){const link=document.createElement('link');link.rel='stylesheet';link.href='./v5.7.6.css?v=5.7.6';link.dataset.v576='1';document.head.appendChild(link)}
}
function organizeAccount(){
  const account=document.querySelector('.v572-page-account');
  if(!account)return;
  const heading=account.querySelector('.v572-page-head h2');
  if(heading&&heading.textContent!=='我的帳號')heading.textContent='我的帳號';
  const summary=account.querySelector('.v572-account-summary');
  if(summary&&!account.querySelector('.v575-account-label')){
    const label=document.createElement('h3');label.className='v575-account-label';label.textContent='帳號與同步';account.insertBefore(label,summary);
  }
  const bottom=account.querySelector('.bottom');
  if(!bottom)return;
  bottom.classList.add('v575-backup-only');
  if(!account.querySelector('.v575-usage')){
    const usage=document.createElement('section');usage.className='v575-section v575-usage';
    const title=document.createElement('h3');title.className='v575-section-title';title.textContent='使用說明';usage.appendChild(title);
    const list=document.createElement('div');list.className='v575-help-list';usage.appendChild(list);
    const storageItem=document.createElement('div');storageItem.className='v575-help-item';const storageLabel=document.createElement('strong');storageLabel.textContent='資料儲存：';storageItem.appendChild(storageLabel);const storage=document.getElementById('storageText');if(storage)storageItem.appendChild(storage);else storageItem.append('比賽與戰報儲存在 Supabase，手機與電腦登入同一 Google 帳號即可共用。');list.appendChild(storageItem);
    const best=document.createElement('div');best.className='v575-help-item';best.innerHTML='<strong>Best Finish Limit：</strong>取可計 LP 賽事最高的 8 場結果加總；世界賽不納入。';list.appendChild(best);
    const report=document.createElement('div');report.className='v575-help-item';report.innerHTML='<strong>戰報：</strong>自己的牌組與對手牌組皆可記主／副打手；BO3 可逐局記 W/L/D 與先／後攻。';list.appendChild(report);
    account.insertBefore(usage,bottom);
    const cloud=bottom.querySelector('#cloudBox');
    const backupActions=[...bottom.children].find(el=>el.classList.contains('actions')&&(el.querySelector('#export')||el.querySelector('#import')));
    [...bottom.childNodes].forEach(node=>{if(node===cloud||node===backupActions)return;node.remove()});
  }
}
function fixRecords(){
  document.querySelectorAll('.event-card .meta').forEach(meta=>{
    if(meta.querySelector('.event-record-nowrap'))return;
    const text=meta.textContent||'';
    const m=text.match(/^(.*?)(｜\s*\d+W\s+\d+L(?:\s+\d+D)?)$/);
    if(!m)return;
    meta.textContent=m[1];
    const span=document.createElement('span');span.className='event-record-nowrap';span.textContent=m[2];meta.appendChild(span);
  });
}
function fix(){
  ensureStyle();organizeAccount();fixRecords();
  const v=document.querySelector('.app-version-v14');
  if(v&&v.textContent!==VERSION){v.textContent=VERSION;v.title='目前版本 '+VERSION}
}
function startGuard(){
  fix();
  const root=document.querySelector('.app')||document.body;if(!root)return;
  const observer=new MutationObserver(()=>fix());observer.observe(root,{childList:true,characterData:true,subtree:true});
  setTimeout(fix,100);setTimeout(fix,500);setTimeout(fix,1200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startGuard);else startGuard();
})();
