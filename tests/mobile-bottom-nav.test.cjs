'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const css=read('v5.7.2.css'),html=read('index.html'),sw=read('sw.js'),js=read('v5.7.2.js');
const rule=css.match(/\.v572-mobile-nav\{position:fixed!important;[^}]+\}/)?.[0];
assert(rule,'mobile bar must be fixed');
for(const pattern of [/left:0!important/,/right:0!important/,/bottom:0!important/,/width:100%/,/background:#fff/,/border-radius:18px 18px 0 0/,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/,/calc\(6px \+ var\(--v572-nav-safe-bottom\)\)/])
  assert.match(rule,pattern);
assert.match(css,/--v572-nav-safe-bottom:max\(0px,calc\(env\(safe-area-inset-bottom,0px\) - 20px\)\)/);
assert.match(css,/padding-bottom:calc\(102px \+ var\(--v572-nav-safe-bottom\)\)/);
assert.doesNotMatch(css,/body\.v572-ready::after/);
assert.match(css,/\.v572-desktop-nav\{display:none\}/);
assert.match(js,/navBtn\('home','首頁'\)\+navBtn\('search','搜尋'\)\+navBtn\('add','新增',true\)\+navBtn\('analysis','分析'\)\+navBtn\('account','我的'\)/);
const asset=html.match(/href="(\.\/v5\.7\.2\.css\?v=[^"]+)"/)?.[1];
assert(asset&&sw.includes("'"+asset+"'"),'PWA must cache the same stylesheet as index');
assert.match(html,/viewport-fit=cover/);
console.log('PASS: opaque edge-to-edge mobile nav, five original actions, safe area, PWA asset match');
