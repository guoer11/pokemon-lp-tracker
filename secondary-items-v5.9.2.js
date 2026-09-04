(()=>{'use strict';
const asset=path=>new URL(path,document.baseURI).href;
window.SecondaryItemCatalog=Object.freeze([
  Object.freeze({key:'crushing-hammer',name:'粉碎之錘',imageUrl:asset('./assets/secondary/crushing-hammer.png?v=5.9.2'),keywords:'粉碎之錘 粉碎 錘子 槌子 hammer crushing hammer'}),
  Object.freeze({key:'heros-cape',name:'英雄斗篷',imageUrl:asset('./assets/secondary/heros-cape.png?v=5.9.2'),keywords:'英雄斗篷 斗篷 披風 cape hero heroes'}),
]);
})();
