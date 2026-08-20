(()=>{'use strict';
const css=document.createElement('link');css.rel='stylesheet';css.href='./battle-v11.css?v=11';document.head.appendChild(css);
const core=document.createElement('script');core.src='./opponent-history-core-v10.js?v=11';core.onload=()=>{const battle=document.createElement('script');battle.src='./battle-v11.js?v=11';document.head.appendChild(battle)};core.onerror=()=>console.error('Opponent history core failed to load');document.head.appendChild(core);
})();