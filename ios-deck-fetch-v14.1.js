(()=>{'use strict';
const IS_IOS=/iP(hone|ad|od)/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(!IS_IOS||window.__pokemonDeckFetchV141)return;
window.__pokemonDeckFetchV141=true;

const nativeFetch=window.fetch.bind(window);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const transient=e=>/load failed|failed to fetch|networkerror|network request failed|fetch/i.test(String(e?.message||e||''));
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});

function isDeckInsert(req){
  try{const u=new URL(req.url);return /\.supabase\.co$/i.test(u.hostname)&&u.pathname.endsWith('/rest/v1/decks')&&req.method==='POST'}catch{return false}
}

async function confirmSaved(req,id){
  try{
    const u=new URL(req.url);
    u.search='?id=eq.'+encodeURIComponent(id)+'&select=*';
    const headers=new Headers(req.headers);
    headers.delete('content-length');
    const check=new Request(u.toString(),{
      method:'GET',headers,cache:'no-store',credentials:req.credentials,mode:req.mode,
      redirect:req.redirect,referrer:req.referrer,referrerPolicy:req.referrerPolicy
    });
    const r=await nativeFetch(check);
    return r.ok?r:null;
  }catch{return null}
}

window.fetch=async function(input,init){
  const original=new Request(input,init);
  if(!isDeckInsert(original))return nativeFetch(input,init);

  let payload;
  try{payload=JSON.parse(await original.clone().text())}catch{return nativeFetch(input,init)}
  if(Array.isArray(payload)||!payload||typeof payload!=='object')return nativeFetch(input,init);

  if(!payload.id)payload.id=uuid();
  const id=payload.id;
  const request=new Request(original,{body:JSON.stringify(payload)});
  let lastError=null;

  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await nativeFetch(request.clone());
      if(response.ok)return response;

      // If the first POST reached Supabase but Safari lost the response,
      // the retry can hit the same UUID. Return the existing row instead.
      if((response.status===409||response.status===400)&&id){
        const existing=await confirmSaved(request,id);
        if(existing)return existing;
      }
      return response;
    }catch(e){
      if(!transient(e))throw e;
      lastError=e;
      const existing=await confirmSaved(request,id);
      if(existing)return existing;
      await sleep(550+attempt*650);
    }
  }

  const existing=await confirmSaved(request,id);
  if(existing)return existing;
  throw lastError||new TypeError('Load failed');
};
})();
