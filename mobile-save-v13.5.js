(()=>{'use strict';
const SUPABASE_URL='https://ceobnyikrudlxasyjukg.supabase.co';
const SUPABASE_KEY='sb_publishable_6uVBALI1T3lMZoFEUiLK4g__R7gv0fz';
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const transient=e=>/load failed|failed to fetch|networkerror|network request failed|fetch/i.test(String(e?.message||e||''));
const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
function gScore(p,r){if(!Number.isInteger(p)||p<17||p>256||!Number.isInteger(r)||r<1||r>p)return 0;let t=[[1,1,20],[2,2,12],[3,4,10],[5,8,8]];if(p>=33)t.push([9,16,6]);if(p>=65)t.push([17,32,4]);if(p>=129)t.push([33,64,3]);for(const[a,b,s]of t)if(r>=a&&r<=b)return s;return 0}
function pScore(p,r){if(!Number.isInteger(p)||p<1||!Number.isInteger(r)||r<1||r>p)return 0;for(const[a,b,s]of [[1,1,150],[2,2,100],[3,4,75],[5,8,50],[9,16,25],[17,32,15],[33,64,10],[65,128,5]])if(r>=a&&r<=b)return s;return 0}
function auto(l,p,r){if(l==='world')return 0;if(l==='great')return gScore(p,r);if(l==='premier')return pScore(p,r);return null}
function show(text,ok=false){const m=$('msg');if(!m)return;m.textContent=text;m.className='msg'+(ok?' ok':'')}
function busy(on,text='儲存到雲端…'){const b=$('submitBtn');if(b)b.disabled=on;const s=$('syncState');if(s&&on)s.textContent=text}
async function findById(id,uid){try{const{data,error}=await db.from('events').select('*').eq('id',id).eq('user_id',uid).maybeSingle();if(error)return null;return data||null}catch{return null}}
async function insertSafely(row){const uid=row.user_id,id=row.id;let last=null;for(let attempt=0;attempt<3;attempt++){
  try{
    const{data,error}=await db.from('events').insert(row).select().single();
    if(!error)return data;
    last=error;
    if(error.code==='23505'){const existing=await findById(id,uid);if(existing)return existing}
    if(!transient(error))throw error;
  }catch(e){last=e;if(!transient(e))throw e}
  const existing=await findById(id,uid);if(existing)return existing;
  if(attempt===0){try{await db.auth.refreshSession()}catch{}}
  await sleep(800+attempt*700);
 }
 const existing=await findById(id,uid);if(existing)return existing;
 throw last||new Error('網路連線失敗');
}
async function handle(ev){
 const submit=$('submitBtn');
 if(!submit||submit.textContent.trim()!=='儲存比賽')return;
 let session=null;try{session=(await db.auth.getSession()).data.session}catch{return}
 if(!session)return;
 ev.preventDefault();ev.stopImmediatePropagation();
 const date=$('date')?.value||'',location=$('location')?.value.trim()||'',league=$('league')?.value||'great',format=$('matchFormat')?.value||'bo1';
 const participants=Number($('participants')?.value),placement=Number($('placement')?.value);
 if(!date)return show('請選擇比賽日期。');if(!location)return show('請輸入比賽地點。');
 if(!Number.isInteger(participants)||participants<1)return show('參加人數要大於 0。');
 if(!Number.isInteger(placement)||placement<1||placement>participants)return show('請確認最終名次。');
 if(league==='great'&&(participants<17||participants>256))return show('超級球官方 LP 表適用 17～256 人。');
 const a=auto(league,participants,placement),lp=league==='world'?0:(a===null?Number($('lp')?.value):a);
 if(!Number.isFinite(lp)||lp<0)return show('請輸入有效 LP。');
 const id=uuid();
 const row={id,user_id:session.user.id,season:'2026-27',event_date:date,location,league_type:league,match_format:format,participants,placement,lp};
 busy(true,'儲存到雲端…');show('');
 try{await insertSafely(row);show('已儲存。',true);const s=$('syncState');if(s){s.textContent='已與 Supabase 雲端同步';s.className='sync ok'}setTimeout(()=>locationReload(),450)}catch(e){show('儲存失敗：'+(e?.message||e));const s=$('syncState');if(s)s.textContent='雲端連線暫時失敗，資料尚未確認儲存';busy(false)}
}
function locationReload(){try{window.location.reload()}catch{}}
const form=$('form');if(form)form.addEventListener('submit',handle,true);
})();