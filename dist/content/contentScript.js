console.log("GemScout content script loaded");let s=!1,n=null;function m(){if(s)return;n=document.createElement("div"),n.id="gemscout-overlay-root",n.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;const e=n.attachShadow({mode:"open"}),o=document.createElement("div");o.style.cssText="pointer-events: auto;",o.innerHTML=`
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
  `,e.appendChild(o),document.body.appendChild(n);const t=e.querySelector(".gemscout-toggle");t&&t.addEventListener("click",()=>{a("GemScout: Analyzing page for job opportunities...")}),s=!0,console.log("GemScout overlay injected")}function y(){n&&n.parentNode&&(n.parentNode.removeChild(n),n=null,s=!1,console.log("GemScout overlay removed"))}function a(e){const o=document.createElement("div");o.style.cssText=`
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
  `,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="1"},10),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},300)},3e3)}function c(){const e={url:window.location.href,title:document.title,description:g(),keywords:f(),jobIndicators:l()};return console.log("Page analysis:",e),e}function g(){const e=document.querySelector('meta[name="description"]');return(e==null?void 0:e.content)||""}function f(){const e=document.body.innerText.toLowerCase();return["software engineer","developer","programmer","frontend","backend","full stack","react","javascript","typescript","node.js","python","java","remote","salary","benefits","apply","job","career","position","role","hiring","employment"].filter(t=>e.includes(t))}function l(){const e=window.location.href.toLowerCase(),o=document.title.toLowerCase(),t=document.body.innerText.toLowerCase(),r=["linkedin.com/jobs","indeed.com","glassdoor.com","stackoverflow.com/jobs"],d=["apply","salary","requirements","responsibilities","qualifications"],u=r.some(i=>e.includes(i)),p=d.some(i=>o.includes(i)||t.includes(i));return u||p}chrome.runtime.onMessage.addListener((e,o,t)=>{switch(console.log("Content script received message:",e),e.type){case"ANALYZE_PAGE":const r=c();t({success:!0,data:r});break;case"TOGGLE_OVERLAY":s?y():m(),t({success:!0,overlayVisible:s});break;case"SHOW_NOTIFICATION":a(e.message||"GemScout notification"),t({success:!0});break;default:t({success:!1,error:"Unknown message type"})}});l()&&(console.log("Job indicators detected, auto-analyzing page"),setTimeout(()=>{chrome.runtime.sendMessage({type:"PAGE_ANALYZED",data:c()})},1e3));
