(()=>{'use strict';
const IS_IOS=/iP(hone|ad|od)/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!IS_IOS||window.__pokemonSafeWriteV142)return;
window.__pokemonSafeWriteV142=true;

const nativeFetch=window.fetch.bind(window);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const transient=e=>/load failed|failed to fetch|networkerror|network request failed|fetch/i.test(String(e?.message||e||''));
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
    const r=await nativeFetch(check);
    return r.ok?r:null;
  }catch{return null}
}

window.fetch=async function(input,init){
  const original=new Request(input,init);
  if(!targetTable(original))return nativeFetch(input,init);

  let body;
  try{body=JSON.parse(await original.clone().text())}catch{return nativeFetch(input,init)}
  const rows=Array.isArray(body)?body:[body];
  if(rows.length!==1||!rows[0]||typeof rows[0]!=='object')return nativeFetch(input,init);

  if(!rows[0].id)rows[0].id=uuid();
  const id=rows[0].id;
  const patched=Array.isArray(body)?rows:rows[0];
  const request=new Request(original,{body:JSON.stringify(patched)});

  // Fast path: one normal request, no extra query and no artificial wait.
  try{
    const response=await nativeFetch(request.clone());
    if(response.ok)return response;
    if(response.status===409||response.status===400){
      const existing=await confirmSaved(request,id);
      if(existing)return existing;
    }
    return response;
  }catch(firstError){
    if(!transient(firstError))throw firstError;

    // Recovery path only runs after Safari actually reports a network failure.
    let existing=await confirmSaved(request,id);
    if(existing)return existing;

    const waits=[220,420];
    let lastError=firstError;
    for(const wait of waits){
      await sleep(wait);
      try{
        const response=await nativeFetch(request.clone());
        if(response.ok)return response;
        if(response.status===409||response.status===400||response.status>=500){
          existing=await confirmSaved(request,id);
          if(existing)return existing;
          if(response.status<500)return response;
        }else return response;
      }catch(e){
        lastError=e;
        if(!transient(e))throw e;
        existing=await confirmSaved(request,id);
        if(existing)return existing;
      }
    }
    throw lastError;
  }
};
})();
