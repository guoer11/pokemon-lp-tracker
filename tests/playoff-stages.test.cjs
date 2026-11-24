'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {label,config,dbFields}=require('../playoff-stages-v5.16.0.js');

assert.deepEqual(config(8,16),{startRound:8,topSize:16});
assert.deepEqual(config(8,256),{startRound:8,topSize:256});
assert.deepEqual(config(8,512),{startRound:null,topSize:null});
assert.deepEqual(config(0,16),{startRound:null,topSize:null});
for(const [round,start,size,expected] of [
  [7,8,16,'R7'],[8,8,16,'TOP 16'],[9,8,16,'TOP 8'],
  [10,8,16,'TOP 4'],[11,8,16,'FINAL'],[12,8,16,'R12'],
  [8,8,256,'TOP 256'],[9,8,256,'TOP 128'],[10,8,256,'TOP 64'],
  [11,8,256,'TOP 32'],[12,8,256,'TOP 16'],[13,8,256,'TOP 8'],
  [14,8,256,'TOP 4'],[15,8,256,'FINAL'],
  [9,10,16,'R9'],[10,10,16,'TOP 16'],[13,10,16,'FINAL'],
  [4,null,null,'R4']
])assert.equal(label(round,start,size),expected);
assert.deepEqual(dbFields({playoffStartRound:8,playoffStartSize:256}),
  {playoff_start_round:8,playoff_start_size:256});
assert.deepEqual(dbFields({}),
  {playoff_start_round:null,playoff_start_size:null});
const app=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const summary=fs.readFileSync('v15.js','utf8');
assert.match(app,/playoffStartRound:r\.playoff_start_round/);
assert.match(app,/playoffStartSize:r\.playoff_start_size/);
assert.match(app,/\.\.\.window\.PokemonPlayoffStages\.dbFields\(e\)/);
assert.match(app,/data-stage-label/);
assert.match(app,/playoffStartSize\.value=e\.playoffStartSize/);
assert.match(app,/syncPlayoffControls/);
assert.match(html,/id="playoffStartSize"/);
assert.match(html,/id="playoffStartRound"/);
assert.match(html,/playoff-stages-v5\.16\.0\.js\?v=5\.16\.0/);
assert.match(html,/share-image-v5\.16\.0\.js\?v=5\.16\.1/);
assert.match(summary,/row\.dataset\.roundNo/);
assert.match(summary,/row\.dataset\.stageLabel/);
assert.match(summary,/v15-configure-playoff/);
console.log('PASS: stage labels TOP256–FINAL; unset legacy rounds remain unchanged; cloud/local and share code wired.');

const vm=require('node:vm');
const startSize={value:''},startRound={value:'6',disabled:true};
const context={playoffStartSize:startSize,playoffStartRound:startRound};
vm.runInNewContext(app.match(/^function syncPlayoffControls.*$/m)[0],context);
context.syncPlayoffControls();
assert.equal(startRound.disabled,false);
assert.equal(startRound.value,'6','round entered before stage must remain');
startSize.value='8';context.syncPlayoffControls({type:'change'});
assert.equal(startRound.value,'6');
assert.equal(startRound.disabled,false);
startSize.value='';context.syncPlayoffControls({type:'change'});
assert.equal(startRound.value,'','explicit removal clears old round');
assert.doesNotMatch(html.match(/<input id="playoffStartRound"[^>]*>/)[0],/\bdisabled\b/);
assert.match(app,/已輸入複賽輪次，請一併選擇複賽起始階段/);
console.log('PASS: playoff round is editable in either order, explicit reset and validation preserved');
