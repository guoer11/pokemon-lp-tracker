(()=>{'use strict';
const IS_IOS=/iP(hone|ad|od)/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!IS_IOS||window.__pokemonSafeWriteV1516)return;
window.__pokemonSafeWriteV1516=true;
window.__pokemonSafeWriteV142=true;

const nativeFetch=window.fetch.bind(window);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const transient=e=>/load failed|failed to fetch|networkerror|network request failed|fetch|abort/i.test(String(e?.name||'')+' '+String(e?.message||e||''));
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});

function targetTable(req){
  try{
    const u=new URL(req.url);
    if(!/\.supabase\.co$/i.test(u.hostname)||req.method!=='POST')return null;
    if(u.pathname.endsWith('/rest/v1/events'))return'events';
    if(u.pathname.endsWith('/rest/v1/decks'))return'decks';
  }catch{}
  return null;
}

function signalSaved(table,id){
  if(table!=='events')return;
  window.dispatchEvent(new CustomEvent('pokemon:event-save-success',{detail:{id}}));
}

async function timedFetch(req,ms){
  if(!('AbortController'in window))return nativeFetch(req.clone());
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{return await nativeFetch(new Request(req.clone(),{signal:controller.signal}))}
  finally{clearTimeout(timer)}
}

async function confirmSaved(req,id){
  if(!id)return null;
  try{
    const u=new URL(req.url);
    u.search='?id=eq.'+encodeURIComponent(id)+'&select=*';
    const headers=new Headers(req.headers);
    headers.delete('content-type');
    headers.delete('content-length');
    headers.delete('prefer');
    headers.set('accept','application/vnd.pgrst.object+json');
    const check=new Request(u.toString(),{method:'GET',headers,cache:'no-store',credentials:req.credentials,mode:req.mode,redirect:req.redirect,referrer:req.referrer,referrerPolicy:req.referrerPolicy});
    const r=await timedFetch(check,1200);
    return r.ok?r:null;
  }catch{return null}
}

async function postAttempt(request,table,id,timeoutMs){
  try{
    const response=await timedFetch(request,timeoutMs);
    if(response.ok){signalSaved(table,id);return{done:true,response}}
    if(response.status===409||response.status===400||response.status>=500){
      const existing=await confirmSaved(request,id);
      if(existing){signalSaved(table,id);return{done:true,response:existing}}
      if(response.status<500)return{done:true,response};
      return{done:false,error:new Error('HTTP '+response.status)};
    }
    return{done:true,response};
  }catch(error){
    if(!transient(error))throw error;
    return{done:false,error};
  }
}

window.fetch=async function(input,init){
  const original=new Request(input,init);
  const table=targetTable(original);
  if(!table)return nativeFetch(input,init);

  let body;
  try{body=JSON.parse(await original.clone().text())}catch{return nativeFetch(input,init)}
  const rows=Array.isArray(body)?body:[body];
  if(rows.length!==1||!rows[0]||typeof rows[0]!=='object')return nativeFetch(input,init);

  if(!rows[0].id)rows[0].id=uuid();
  const id=rows[0].id;
  const patched=Array.isArray(body)?rows:rows[0];
  const request=new Request(original,{body:JSON.stringify(patched)});

  // Fast path: normal iPhone requests should finish here immediately.
  let attempt=await postAttempt(request,table,id,1700);
  if(attempt.done)return attempt.response;
  let lastError=attempt.error;

  // Safari sometimes sends the POST successfully but stalls while waiting for the response.
  // Confirm the fixed UUID instead of waiting 10–20 seconds for that stalled response.
  let existing=await confirmSaved(request,id);
  if(existing){signalSaved(table,id);return existing}

  // One short retry with the same UUID. This cannot create a duplicate row.
  await sleep(120);
  attempt=await postAttempt(request,table,id,2300);
  if(attempt.done)return attempt.response;
  lastError=attempt.error||lastError;

  existing=await confirmSaved(request,id);
  if(existing){signalSaved(table,id);return existing}
  throw lastError||new TypeError('Load failed');
};
})();
