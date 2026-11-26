/* Trembling on Dorset Street loader for Weebly: <script src="https://ealoiontoir.github.io/philosophical-essays/trembling-on-dorset-street/embed.js"></script> */
(function(){
  var s=document.currentScript,base="https://ealoiontoir.github.io/philosophical-essays/trembling-on-dorset-street/";
  var host=document.getElementById("dsp-host");
  if(!host){host=document.createElement("div");host.id="dsp-host";s.parentNode.insertBefore(host,s);}
  var v=Math.floor(Date.now()/600000);
  fetch(base+"weebly_embed.html?v="+v).then(function(r){if(!r.ok)throw 0;return r.text()}).then(function(h){
    host.innerHTML=h;
    host.querySelectorAll("script").forEach(function(o){var n=document.createElement("script");if(o.src)n.src=o.src;else n.textContent=o.textContent;o.parentNode.replaceChild(n,o)});
  }).catch(function(){});
})();
