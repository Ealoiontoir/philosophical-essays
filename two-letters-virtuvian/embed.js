(function(){var s=document.currentScript,base="https://ealoiontoir.github.io/philosophical-essays/two-letters-virtuvian/";
var host=document.getElementById("tlv-host");if(!host){host=document.createElement("div");host.id="tlv-host";s.parentNode.insertBefore(host,s);}
var v=Math.floor(Date.now()/600000);fetch(base+"weebly_embed.html?v="+v).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(h){host.innerHTML=h;}).catch(function(){host.innerHTML='<p><a href="'+base+'">Two Letters. How the name Virtuvian came</a></p>';});})();
