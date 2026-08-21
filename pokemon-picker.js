(()=>{'use strict';
const BASE='https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/';
const SPECIES_URL=BASE+'pokemon_species_names.csv';
const POKEMON_URL=BASE+'pokemon.csv';
const FORMS_URL=BASE+'pokemon_forms.csv';
const FORM_NAMES_URL=BASE+'pokemon_form_names.csv';
const SPRITE=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const CACHE_KEY='pokemon-catalog-zh-hant-v4';
let catalog=null,loading=null,selected=null;
const $=id=>document.getElementById(id);
function csv(line){const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){out.push(cur);cur=''}else cur+=c}out.push(cur);return out}
function parseSpecies(text){const map=new Map();for(const line of text.split(/\r?\n/).slice(1)){if(!line)continue;const a=csv(line),id=Number(a[0]),lang=Number(a[1]),name=a[2]||'';if(id<1||id>1025||(lang!==4&&lang!==9)||!name)continue;const item=map.get(id)||{id,dexId:id,zh:'',en:'',isMega:false,isForm:false,isDefault:true,formOrder:0};if(lang===4)item.zh=name;else item.en=name;map.set(id,item)}return map}
function parsePokemonSpeciesMap(text){const map=new Map();for(const line of text.split(/\r?\n/).slice(1)){if(!line)continue;const a=csv(line),pokemonId=Number(a[0]),speciesId=Number(a[2]);if(pokemonId&&speciesId)map.set(pokemonId,speciesId)}return map}
function isGenericDefaultName(name){return /(的樣子|普通形態|普通模式|平常的樣子|雄性的樣子|雌性的樣子|通常形態|一般形態)$/u.test(String(name||''))}
function parseNamedForms(formsText,namesText,pokemonSpecies,species){
  const forms=new Map();
  for(const line of formsText.split(/\r?\n/).slice(1)){
    if(!line)continue;
    const a=csv(line),formId=Number(a[0]),spriteId=Number(a[3]),isDefault=Number(a[5])===1,isMega=Number(a[7])===1,formOrder=Number(a[8])||1,dexId=pokemonSpecies.get(spriteId)||null;
    if(!formId||!spriteId||!dexId||dexId<1||dexId>1025)continue;
    forms.set(formId,{formId,id:spriteId,dexId,isDefault,isMega,formOrder,zhForm:'',enForm:'',enFull:''});
  }
  for(const line of namesText.split(/\r?\n/).slice(1)){
    if(!line)continue;
    const a=csv(line),formId=Number(a[0]),lang=Number(a[1]),item=forms.get(formId);
    if(!item||(lang!==4&&lang!==9))continue;
    const formName=(a[2]||'').trim(),pokemonName=(a[3]||'').trim();
    if(lang===4)item.zhForm=formName||pokemonName;
    else{item.enForm=formName;item.enFull=pokemonName}
  }
  const items=new Map();
  for(const b of species.values())if(b.zh)items.set(b.id,{...b});
  const named=[...forms.values()].filter(x=>x.zhForm);
  const countByDex=new Map();
  for(const x of named)countByDex.set(x.dexId,(countByDex.get(x.dexId)||0)+1);
  for(const x of named){
    const b=species.get(x.dexId);if(!b?.zh)continue;
    const baseZh=b.zh||'',baseEn=b.en||'';
    let zh='';
    if(x.zhForm.includes(baseZh))zh=x.zhForm;
    else if(x.isDefault&&isGenericDefaultName(x.zhForm))zh=baseZh;
    else zh=[baseZh,x.zhForm].filter(Boolean).join(' ');
    const en=x.enFull||((x.enForm&&baseEn)?`${baseEn} ${x.enForm}`:(x.enForm||baseEn));
    const item={id:x.id,dexId:x.dexId,zh,en,isMega:x.isMega,isForm:true,isDefault:x.isDefault,formOrder:x.formOrder};
    if(x.isDefault&&x.id===x.dexId){
      if((countByDex.get(x.dexId)||0)>1&&!isGenericDefaultName(x.zhForm))items.set(x.id,item);
    }else items.set(x.id,item);
  }
  return[...items.values()];
}
async function loadCatalog(){if(catalog)return catalog;if(loading)return loading;loading=(async()=>{try{const cached=localStorage.getItem(CACHE_KEY);if(cached){const data=JSON.parse(cached);if(Array.isArray(data)&&data.length>1025){catalog=data;return catalog}}}catch{}const[s,p,f,n]=await Promise.all([fetch(SPECIES_URL,{cache:'force-cache'}),fetch(POKEMON_URL,{cache:'force-cache'}),fetch(FORMS_URL,{cache:'force-cache'}),fetch(FORM_NAMES_URL,{cache:'force-cache'})]);if(!s.ok||!p.ok||!f.ok||!n.ok)throw new Error('寶可夢資料載入失敗');const[st,pt,ft,nt]=await Promise.all([s.text(),p.text(),f.text(),n.text()]);const species=parseSpecies(st),pokemonSpecies=parsePokemonSpeciesMap(pt);catalog=parseNamedForms(ft,nt,pokemonSpecies,species).sort((a,b)=>(a.dexId||99999)-(b.dexId||99999)||(a.formOrder||0)-(b.formOrder||0)||Number(a.isForm)-Number(b.isForm)||a.zh.localeCompare(b.zh,'zh-Hant'));try{localStorage.setItem(CACHE_KEY,JSON.stringify(catalog))}catch{}return catalog})();try{return await loading}finally{loading=null}}
function cleanQuery(q){return String(q??'').trim().toLowerCase().replace(/\s*(ex|gx|vmax|vstar)\s*$/i,'').replace(/[（）()【】\[\]]/g,' ').trim()}
async function searchCatalog(q,limit=12){const raw=String(q??'').trim().toLowerCase();if(!raw)return[];const data=await loadCatalog(),n=Number(raw.replace(/^#/,''));if(Number.isFinite(n)&&n>0)return data.filter(p=>p.id===n||p.dexId===n).slice(0,limit);const cleaned=cleanQuery(raw);const hits=data.filter(p=>{const zh=(p.zh||'').toLowerCase(),en=(p.en||'').toLowerCase();return zh.includes(raw)||en.includes(raw)||(cleaned&&cleaned!==raw&&(zh.includes(cleaned)||en.includes(cleaned)))});hits.sort((a,b)=>{const az=(a.zh||'').toLowerCase(),bz=(b.zh||'').toLowerCase(),ae=(a.en||'').toLowerCase(),be=(b.en||'').toLowerCase();const aExact=az===cleaned||ae===cleaned?0:(az.startsWith(cleaned)||ae.startsWith(cleaned)?1:2);const bExact=bz===cleaned||be===cleaned?0:(bz.startsWith(cleaned)||be.startsWith(cleaned)?1:2);return aExact-bExact||(a.dexId||99999)-(b.dexId||99999)||(a.formOrder||0)-(b.formOrder||0)});return hits.slice(0,limit)}
function dexLabel(p){return '#'+String(p.dexId||p.id).padStart(4,'0')}
function formLabel(p){if(p.isMega)return'｜Mega';if(p.isForm&&!p.isDefault)return'｜型態';return''}
function resultHtml(p){return `<button class="pokemon-result" type="button" data-id="${p.id}"><img src="${SPRITE(p.id)}" alt="${p.zh}" loading="lazy"><span><b>${dexLabel(p)} ${p.zh}</b><small>${p.en||''}${formLabel(p)}</small></span></button>`}
function renderResults(items){const box=$('pokemonResults');if(!box)return;box.innerHTML=items.length?items.map(resultHtml).join(''):'<div class="pokemon-empty">找不到符合的寶可夢</div>';box.hidden=false;box.querySelectorAll('.pokemon-result').forEach(btn=>btn.addEventListener('click',()=>choosePokemon(Number(btn.dataset.id))))}
async function search(){const input=$('pokemonSearch'),status=$('pokemonStatus');if(!input)return;const q=input.value.trim();if(!q){$('pokemonResults').hidden=true;return}status.textContent='搜尋中…';try{const data=await loadCatalog(),items=await searchCatalog(q,16);renderResults(items);status.textContent=`已載入 ${data.length} 筆寶可夢／型態資料`}catch(e){status.textContent='寶可夢資料載入失敗，仍可改用下方自行上傳圖片。'}}
async function choosePokemon(id){const data=await loadCatalog(),p=data.find(x=>x.id===id);if(!p)return;selected=p;const status=$('pokemonStatus'),chosen=$('pokemonChosen'),preview=$('deckPreview'),fileInput=$('deckImage');status.textContent='正在套用縮圖…';chosen.hidden=false;chosen.innerHTML=`<img src="${SPRITE(p.id)}" alt="${p.zh}"><div><b>${dexLabel(p)} ${p.zh}</b><small>${p.en||''}${formLabel(p)}</small></div><button id="pokemonClear" type="button">清除</button>`;$('pokemonResults').hidden=true;$('pokemonSearch').value=p.zh;try{const res=await fetch(SPRITE(p.id));if(!res.ok)throw new Error();const blob=await res.blob(),file=new File([blob],`pokemon-${p.id}.png`,{type:blob.type||'image/png'}),dt=new DataTransfer();dt.items.add(file);fileInput.files=dt.files;fileInput.dispatchEvent(new Event('change',{bubbles:true}));status.textContent='已選擇 '+p.zh}catch{preview.src=SPRITE(p.id);preview.style.display='block';status.textContent='縮圖無法寫入檔案欄位，可改用下方自行上傳。'}setTimeout(()=>{$('pokemonClear')?.addEventListener('click',clearPokemon)},0)}
function clearPokemon(){selected=null;$('pokemonSearch').value='';$('pokemonResults').hidden=true;$('pokemonChosen').hidden=true;$('pokemonChosen').innerHTML='';$('pokemonStatus').textContent='輸入繁中名稱、英文名稱、圖鑑編號、「超級」或型態名稱';$('deckImage').value='';$('deckPreview').style.display='none';$('deckPreview').removeAttribute('src')}
function init(){const input=$('pokemonSearch'),dialog=$('deckDialog');if(!input||!dialog)return;let timer;input.placeholder='搜尋：噴火龍、厄鬼椪、超級、0006';const status=$('pokemonStatus');if(status)status.textContent='輸入繁中名稱、英文名稱、圖鑑編號、「超級」或型態名稱';input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,180)});input.addEventListener('focus',()=>{if(input.value.trim())search();else loadCatalog().then(data=>status.textContent=`已載入 ${data.length} 筆寶可夢／型態資料`).catch(()=>{})});dialog.addEventListener('close',clearPokemon)}
window.PokemonCatalog={load:loadCatalog,search:searchCatalog,sprite:SPRITE};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();