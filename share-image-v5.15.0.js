(()=>{'use strict';
if(window.__pokemonShareImageV515)return;
window.__pokemonShareImageV515=true;

const VERSION='V5.15.0';
const HTML2CANVAS_URL='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
const prepared=new WeakMap();
const bypass=new WeakSet();
let rendererPromise=null;
let scanQueued=false;

const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

function isMobileShare(){
  const touch=Number(navigator.maxTouchPoints||0)>0||'ontouchstart' in window;
  return touch&&window.matchMedia('(max-width: 900px)').matches;
}

function stampVersion(){
  const el=qs('.app-version-v14');
  if(el){el.textContent=VERSION;el.title='目前版本 '+VERSION;}
}

function loadRenderer(){
  if(window.html2canvas)return Promise.resolve(window.html2canvas);
  if(rendererPromise)return rendererPromise;
  rendererPromise=new Promise((resolve,reject)=>{
    const existing=qs('script[data-v515-html2canvas]');
    if(existing){
      existing.addEventListener('load',()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('html2canvas unavailable')),{once:true});
      existing.addEventListener('error',()=>reject(new Error('html2canvas load failed')),{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=HTML2CANVAS_URL;
    script.async=true;
    script.dataset.v515Html2canvas='1';
    script.onload=()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('html2canvas unavailable'));
    script.onerror=()=>reject(new Error('html2canvas load failed'));
    document.head.appendChild(script);
  });
  return rendererPromise;
}

function waitForImages(card){
  const images=qsa('img',card);
  return Promise.all(images.map(img=>{
    if(img.complete&&img.naturalWidth>0)return Promise.resolve();
    return new Promise(resolve=>{
      let done=false;
      const finish=()=>{if(done)return;done=true;resolve();};
      img.addEventListener('load',finish,{once:true});
      img.addEventListener('error',finish,{once:true});
      setTimeout(finish,1800);
    });
  }));
}

function safePart(value,fallback){
  const out=String(value||'').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,36);
  return out||fallback;
}

function imageFileName(card){
  const date=safePart(qs('.date',card)?.textContent,'日期').replaceAll('/','-');
  const place=safePart(qs('.loc',card)?.textContent,'戰報');
  return `PTCG-${date}-${place}.png`;
}

function canvasBlob(canvas){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encode failed')),'image/png');
  });
}

// Mobile "prominent safe" export: keep the report comfortably inside the image
// so Dynamic Island / rounded screen corners cover white space instead of content.
function frameShareCanvas(source,renderScale){
  const contentScale=.93;
  const side=Math.max(1,Math.round(24*renderScale));
  const top=Math.max(1,Math.round(42*renderScale));
  const bottom=Math.max(1,Math.round(30*renderScale));
  const contentWidth=Math.max(1,Math.round(source.width*contentScale));
  const contentHeight=Math.max(1,Math.round(source.height*contentScale));
  const framed=document.createElement('canvas');
  framed.width=contentWidth+side*2;
  framed.height=contentHeight+top+bottom;
  const ctx=framed.getContext('2d');
  if(!ctx)return source;
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,framed.width,framed.height);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  ctx.drawImage(source,0,0,source.width,source.height,side,top,contentWidth,contentHeight);
  return framed;
}

async function buildShareFile(card){
  const render=await loadRenderer();
  try{await document.fonts?.ready}catch{}
  await waitForImages(card);
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

  const rect=card.getBoundingClientRect();
  const width=Math.max(1,rect.width);
  const height=Math.max(1,card.scrollHeight||rect.height);
  let scale=Math.min(3,Math.max(1.6,1080/width));
  if(height*scale>12000)scale=Math.max(1.2,12000/height);

  const canvas=await render(card,{
    backgroundColor:'#ffffff',
    scale,
    useCORS:true,
    allowTaint:false,
    logging:false,
    imageTimeout:3500,
    scrollX:-window.scrollX,
    scrollY:-window.scrollY,
    onclone:doc=>{
      doc.querySelectorAll('.v15-share-exit-top,.rowactions').forEach(el=>el.remove());
      const cloneCard=doc.querySelector('.event-card.v15-card-share-mode');
      if(cloneCard){
        cloneCard.style.margin='0';
        cloneCard.style.transform='none';
        cloneCard.style.maxHeight='none';
        cloneCard.style.overflow='visible';
      }
    }
  });
  const finalCanvas=frameShareCanvas(canvas,scale);
  const blob=await canvasBlob(finalCanvas);
  return new File([blob],imageFileName(card),{type:'image/png',lastModified:Date.now()});
}

function setButtonState(card,text,disabled=false){
  const btn=qs('.v15-share-exit-top',card);
  if(!btn)return;
  btn.textContent=text;
  btn.disabled=disabled;
  btn.setAttribute('aria-busy',disabled?'true':'false');
}

function prepare(card){
  if(!isMobileShare()||!card?.classList.contains('v15-card-share-mode'))return null;
  const old=prepared.get(card);
  if(old&&(old.status==='preparing'||old.status==='ready'))return old.promise||Promise.resolve(old.file);

  const state={status:'preparing',file:null,error:null,promise:null};
  setButtonState(card,'準備圖片…',true);
  state.promise=buildShareFile(card).then(file=>{
    state.status='ready';state.file=file;state.error=null;
    if(card.classList.contains('v15-card-share-mode'))setButtonState(card,'結束分享',false);
    return file;
  }).catch(error=>{
    console.error('戰報圖片產生失敗',error);
    state.status='error';state.error=error;
    if(card.classList.contains('v15-card-share-mode'))setButtonState(card,'結束分享',false);
    throw error;
  });
  prepared.set(card,state);
  return state.promise;
}

function fallbackDownload(file){
  const url=URL.createObjectURL(file);
  const a=document.createElement('a');
  a.href=url;a.download=file.name||'PTCG-戰報.png';
  a.style.display='none';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}

function exitOriginal(button){
  if(!button?.isConnected)return;
  bypass.add(button);
  button.disabled=false;
  button.textContent='結束分享';
  button.click();
}

function sharePrepared(button,card,file){
  const finish=()=>{
    prepared.delete(card);
    exitOriginal(button);
  };

  const shareFiles=()=>{
    if(!navigator.share)return false;
    try{
      if(navigator.canShare&&!navigator.canShare({files:[file]}))return false;
      const p=navigator.share({files:[file],title:'寶可夢比賽戰報'});
      Promise.resolve(p).catch(error=>{
        if(error?.name!=='AbortError'){
          console.warn('系統分享失敗，改用下載',error);
          fallbackDownload(file);
        }
      }).finally(finish);
      return true;
    }catch(error){
      console.warn('系統分享啟動失敗',error);
      return false;
    }
  };

  if(shareFiles())return;
  fallbackDownload(file);
  finish();
}

function handleExitClick(event){
  const button=event.target.closest?.('.v15-share-exit-top');
  if(!button)return;
  if(bypass.has(button)){bypass.delete(button);return;}
  if(!isMobileShare())return;

  const card=button.closest('.event-card.v15-card-share-mode');
  if(!card)return;
  event.preventDefault();
  event.stopImmediatePropagation();

  let state=prepared.get(card);
  if(state?.status==='ready'&&state.file){
    setButtonState(card,'開啟分享…',true);
    sharePrepared(button,card,state.file);
    return;
  }

  setButtonState(card,'產生圖片…',true);
  const promise=state?.status==='preparing'&&state.promise?state.promise:prepare(card);
  Promise.resolve(promise).then(file=>{
    if(!file)throw new Error('no share image');
    setButtonState(card,'開啟分享…',true);
    sharePrepared(button,card,file);
  }).catch(()=>{
    setButtonState(card,'結束分享',false);
    window.alert('戰報圖片產生失敗，請確認網路後再試一次。');
  });
}

function scan(){
  if(!isMobileShare())return;
  qsa('.event-card').forEach(card=>{
    if(card.classList.contains('v15-card-share-mode'))prepare(card);
    else prepared.delete(card);
  });
}
function queueScan(){
  if(scanQueued)return;scanQueued=true;
  requestAnimationFrame(()=>{scanQueued=false;scan();stampVersion();});
}

// Capture phase intercepts the existing "結束分享" handler only on phones.
document.addEventListener('click',handleExitClick,true);
new MutationObserver(queueScan).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

stampVersion();
[100,650,1600].forEach(ms=>setTimeout(stampVersion,ms));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{stampVersion();scan()});
else scan();
})();
