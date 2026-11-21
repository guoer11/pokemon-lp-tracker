(function(root){
'use strict';
const SIZES=[256,128,64,32,16,8,4,2];
function config(startRound,topSize){
  const start=Number(startRound),size=Number(topSize);
  return Number.isInteger(start)&&start>=1&&start<=64&&SIZES.includes(size)
    ? {startRound:start,topSize:size}:{startRound:null,topSize:null};
}
function label(roundNo,startRound,topSize){
  const n=Number(roundNo),plain='R'+(Number.isInteger(n)&&n>0?n:'?');
  const c=config(startRound,topSize);
  if(!Number.isInteger(n)||n<1||!c.startRound||n<c.startRound)return plain;
  const stage=c.topSize/Math.pow(2,n-c.startRound);
  if(stage===2)return 'FINAL';
  if(Number.isInteger(stage)&&stage>=4)return 'TOP '+stage;
  return plain;
}
function dbFields(e){
  const c=config(e?.playoffStartRound,e?.playoffStartSize);
  return {playoff_start_round:c.startRound,playoff_start_size:c.topSize};
}
const api={SIZES,config,label,dbFields};
root.PokemonPlayoffStages=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
