console.log("GemScout content script loaded");window.gemscoutLoaded=!0;let l=!1,r=null;function m(){if(l)return;r=document.createElement("div"),r.id="gemscout-overlay-root",r.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;const e=r.attachShadow({mode:"open"}),t=document.createElement("div");t.style.cssText="pointer-events: auto;",t.innerHTML=`
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: #2563eb;
      color: white;
      padding: 12px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: background-color 0.2s;
    " class="gemscout-toggle" onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>
  `,e.appendChild(t),document.body.appendChild(r);const o=e.querySelector(".gemscout-toggle");o&&o.addEventListener("click",()=>{d("GemScout: Analyzing page for job opportunities...")}),l=!0,console.log("GemScout overlay injected")}function g(){r&&r.parentNode&&(r.parentNode.removeChild(r),r=null,l=!1,console.log("GemScout overlay removed"))}function d(e){const t=document.createElement("div");t.style.cssText=`
    position: fixed;
    top: 20px;
    right: 80px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10001;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
  `,t.textContent=e,document.body.appendChild(t),setTimeout(()=>{t.style.opacity="1"},10),setTimeout(()=>{t.style.opacity="0",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300)},3e3)}function f(){const e={url:window.location.href,text:h(),links:y()};return console.log("DOM snapshot collected:",{url:e.url,textLength:e.text.length,linksCount:e.links.length}),e}function h(){document.querySelectorAll("script, style, noscript, iframe");const e=document.body.cloneNode(!0);e.querySelectorAll("script, style, noscript, iframe").forEach(o=>o.remove());let t=e.innerText||e.textContent||"";return t=t.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim(),t}function y(){const e=[];return document.querySelectorAll("a[href]").forEach(o=>{var n;const s=o.getAttribute("href"),c=(n=o.textContent)==null?void 0:n.trim();if(s&&c&&s!=="#"&&!s.startsWith("javascript:")){let a;try{a=new URL(s,window.location.href).href}catch{return}e.find(i=>i.href===a)||e.push({href:a,text:c})}}),e}function u(){const e={url:window.location.href,title:document.title,description:x(),keywords:b(),jobIndicators:p()};return console.log("Page analysis:",e),e}function x(){const e=document.querySelector('meta[name="description"]');return(e==null?void 0:e.content)||""}function b(){const e=document.body.innerText.toLowerCase();return["software engineer","developer","programmer","frontend","backend","full stack","react","javascript","typescript","node.js","python","java","remote","salary","benefits","apply","job","career","position","role","hiring","employment"].filter(o=>e.includes(o))}function p(){const e=window.location.href.toLowerCase(),t=document.title.toLowerCase(),o=document.body.innerText.toLowerCase(),s=["linkedin.com/jobs","indeed.com","glassdoor.com","stackoverflow.com/jobs"],c=["apply","salary","requirements","responsibilities","qualifications"],n=s.some(i=>e.includes(i)),a=c.some(i=>t.includes(i)||o.includes(i));return n||a}chrome.runtime.onMessage.addListener((e,t,o)=>{console.log("Content script received message:",e);const s=e.type||e.action;switch(s){case"ANALYZE_PAGE":const c=u();o({success:!0,data:c});break;case"extract_snapshot":try{const n=f();console.log("Sending DOM snapshot to background:",{url:n.url,textLength:n.text.length,linksCount:n.links.length}),n&&n.url&&n.text&&n.links?(console.log("Snapshot validation passed, sending response..."),o(n)):(console.error("Invalid snapshot data:",n),o({error:"Invalid snapshot data collected"}))}catch(n){console.error("Error collecting snapshot:",n),o({error:"Failed to collect snapshot: "+(n instanceof Error?n.message:String(n))})}break;case"TOGGLE_OVERLAY":l?g():m(),o({success:!0,overlayVisible:l});break;case"SHOW_NOTIFICATION":d(e.message||"GemScout notification"),o({success:!0});break;default:o({success:!1,error:"Unknown message type: "+s})}return!0});p()&&(console.log("Job indicators detected, auto-analyzing page"),setTimeout(()=>{chrome.runtime.sendMessage({type:"PAGE_ANALYZED",data:u()})},1e3));
