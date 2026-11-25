'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html'),sw=read('sw.js'),source=read('app-version.js');
const version=source.match(/const VERSION='(V\d+\.\d+\.\d+)';/)[1];
for(const file of ['v5.5.js','v5.6.js','v5.7.js','v5.7.1.js','v5.7.2.js','v5.7.3.js','ui-v14.js','v5.10.0.js','share-image-v5.16.0.js']){
 assert.doesNotMatch(read(file),/app-version-v14|目前版本|stampVersion|initVersion/,file+' must not write version');
}
const asset=html.match(/src="(\.\/app-version\.js\?v=[^"]+)"/)[1];
assert(sw.includes("'"+asset+"'"));
let badge=null;const app={querySelector(){return badge},appendChild(el){badge=el}};
const callbacks={};const document={readyState:'complete',querySelector(){return app},createElement(){return {textContent:'',title:''}}};
const window={addEventListener(name,fn){callbacks[name]=fn}};
vm.runInNewContext(source,{document,window});
assert.equal(badge.textContent,version);
assert.equal(window.PokemonAppVersion,version);
const first=badge;callbacks.load();assert.equal(badge,first);
console.log('PASS: single visible version source; legacy writers removed; PWA asset cached');
