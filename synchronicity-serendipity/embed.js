/* Synchronicity & Serendipity loader for Weebly: <script src="https://ealoiontoir.github.io/philosophical-essays/synchronicity-serendipity/embed.js"></script> */
(function(){
  var s=document.currentScript,base="https://ealoiontoir.github.io/philosophical-essays/synchronicity-serendipity/";
  var host=document.createElement("div");host.id="sxs-host";
  host.style.cssText="width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;background:#070a17;min-height:100vh";
  s.parentNode.insertBefore(host,s);
  var v=Math.floor(Date.now()/600000);
  fetch(base+"weebly_embed.html?v="+v).then(function(r){return r.text()}).then(function(h){
    host.innerHTML=h;
    host.querySelectorAll("script").forEach(function(o){var n=document.createElement("script");if(o.src)n.src=o.src;else n.textContent=o.textContent;o.parentNode.replaceChild(n,o)});
  }).catch(function(){host.innerHTML='<p style="color:#ece6d6;padding:40px;font-family:Georgia,serif">The field could not load here. <a style="color:#d8b46a" href="'+base+'">Open Synchronicity &amp; Serendipity</a></p>'});
})();
