async function M(){var l,n,r,f,c;console.log("🧪 Testing AI availability in content script context...");const e=window,o=globalThis,t={"window.ai":typeof e.ai,"window.chrome?.ai":typeof((l=e.chrome)==null?void 0:l.ai),"globalThis.ai":typeof o.ai,"self.ai":typeof(self==null?void 0:self.ai),"window.LanguageModel":typeof e.LanguageModel,"globalThis.LanguageModel":typeof o.LanguageModel,"window.Summarizer":typeof e.Summarizer,"window.Writer":typeof e.Writer,"window.Rewriter":typeof e.Rewriter,"window.Proofreader":typeof e.Proofreader};console.log("🔍 AI API availability checks in content script:",t);let a=null,i="";if(e.LanguageModel&&(console.log("✅ Found LanguageModel API at window.LanguageModel"),await T(e.LanguageModel,"window.LanguageModel")),o.LanguageModel&&(console.log("✅ Found LanguageModel API at globalThis.LanguageModel"),await T(o.LanguageModel,"globalThis.LanguageModel")),e.Summarizer&&(console.log("✅ Found Summarizer API"),await P(e.Summarizer)),e.Writer&&(console.log("✅ Found Writer API"),await O(e.Writer)),(n=e.ai)!=null&&n.languageModel?(a=e.ai,i="window.ai",console.log("✅ Found legacy AI API at window.ai")):(f=(r=e.chrome)==null?void 0:r.ai)!=null&&f.languageModel?(a=e.chrome.ai,i="window.chrome.ai",console.log("✅ Found legacy AI API at window.chrome.ai")):(c=o.ai)!=null&&c.languageModel&&(a=o.ai,i="globalThis.ai",console.log("✅ Found legacy AI API at globalThis.ai")),!a){console.warn("🚫 Chrome built-in AI not found in content script context");return}try{console.log("📊 Checking AI capabilities from content script...");const g=await a.languageModel.capabilities();if(console.log(`Full AI capabilities from ${i}:`,JSON.stringify(g,null,2)),g.available==="readily"){console.log("✅ AI is readily available in content script context!");try{console.log("🔄 Attempting to create AI session from content script...");const u=await a.languageModel.create();console.log("✅ AI session created successfully from content script!");const m=await u.prompt('Say "Hello from AI in content script!"');console.log("🤖 AI test response from content script:",m),await u.destroy(),console.log("✅ AI session destroyed successfully")}catch(u){console.error("❌ Failed to create AI session from content script:",u)}}else if(console.warn(`⚠️  AI not readily available in content script: "${g.available}"`),g.available==="after-download"){console.log("📥 Model download required. Trying to trigger download...");try{const u=await a.languageModel.create();console.log("✅ Model download triggered successfully!"),await u.destroy()}catch(u){console.error("❌ Model download failed:",u)}}}catch(g){console.error("❌ AI capabilities check failed in content script:",g)}}async function T(e,o){try{console.log(`🧪 Testing LanguageModel API at ${o}...`);const t=await e.availability();console.log(`LanguageModel availability at ${o}:`,t);const a=navigator.userActivation;if(a&&console.log("User activation status:",{isActive:a.isActive,hasBeenActive:a.hasBeenActive}),t==="available"){console.log("✅ LanguageModel is immediately available!");const i=await e.create(),l=await i.prompt('Say "Hello from new LanguageModel API!"');console.log("🤖 New LanguageModel response:",l),await i.destroy()}else if(t==="downloadable")if(console.log("📥 LanguageModel needs download, checking user activation..."),a!=null&&a.isActive){console.log("🎆 User activation detected, trying to create session...");const i=await e.create();console.log("✅ LanguageModel session created after download!"),await i.destroy()}else console.log("⚠️  User activation required for model download");else console.log(`❌ LanguageModel not available: ${t}`)}catch(t){console.error(`❌ Error testing LanguageModel at ${o}:`,t)}}async function P(e){try{console.log("📄 Testing Summarizer API...");const o=await e.availability();if(console.log("Summarizer availability:",o),o==="available"){const t=await e.create(),a=await t.summarize("This is a long text that needs to be summarized for testing purposes. Chrome has built-in AI APIs now.");console.log("⚙️ Summarizer response:",a),await t.destroy()}}catch(o){console.error("❌ Error testing Summarizer:",o)}}async function O(e){try{console.log("✍️ Testing Writer API...");const o=await e.availability();if(console.log("Writer availability:",o),o==="available"){const t=await e.create(),a=await t.write("Write a short job description");console.log("📝 Writer response:",a),await t.destroy()}}catch(o){console.error("❌ Error testing Writer:",o)}}typeof window<"u"&&M();console.log("🚀 GemScout content script loaded - VERSION 2.0 WITH ENHANCED AI");console.log("📅 Build timestamp:",new Date().toISOString());window.gemscoutLoaded=!0;window.gemscoutVersion="2.0-enhanced";setTimeout(()=>{M().catch(e=>{console.error("AI test in content script failed:",e)})},2e3);let A=!1,h=null;function $(){if(A)return;h=document.createElement("div"),h.id="gemscout-overlay-root",h.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;const e=h.attachShadow({mode:"open"}),o=document.createElement("div");o.style.cssText="pointer-events: auto;",o.innerHTML=`
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
  `,e.appendChild(o),document.body.appendChild(h);const t=e.querySelector(".gemscout-toggle");t&&t.addEventListener("click",()=>{N("GemScout: Analyzing page for job opportunities...")}),A=!0,console.log("GemScout overlay injected")}function F(){h&&h.parentNode&&(h.parentNode.removeChild(h),h=null,A=!1,console.log("GemScout overlay removed"))}function N(e){const o=document.createElement("div");o.style.cssText=`
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
  `,o.textContent=e,document.body.appendChild(o),setTimeout(()=>{o.style.opacity="1"},10),setTimeout(()=>{o.style.opacity="0",setTimeout(()=>{o.parentNode&&o.parentNode.removeChild(o)},300)},3e3)}function k(){const e={url:window.location.href,text:U(),links:J(),htmlStructure:j(),pageTitle:document.title,metaDescription:E()};return console.log("DOM snapshot collected:",{url:e.url,textLength:e.text.length,linksCount:e.links.length,htmlBlocks:e.htmlStructure.length}),console.log("📄 Pure content snapshot ready for AI analysis"),e}function U(){document.querySelectorAll("script, style, noscript, iframe");const e=document.body.cloneNode(!0);e.querySelectorAll("script, style, noscript, iframe").forEach(t=>t.remove());let o=e.innerText||e.textContent||"";return o=o.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim(),o}function J(){const e=[];return document.querySelectorAll("a[href]").forEach(t=>{var l,n;const a=t.getAttribute("href"),i=(l=t.textContent)==null?void 0:l.trim();if(a&&i&&a!=="#"&&!a.startsWith("javascript:")){let r;try{r=new URL(a,window.location.href).href}catch{return}const f=t.parentElement,c=f?(n=f.textContent)==null?void 0:n.trim().substring(0,200):"";e.find(g=>g.href===r&&g.text===i)||e.push({href:r,text:i,context:c})}}),e.slice(0,50)}function j(){const e=[];return document.querySelectorAll("div, article, section, li, h1, h2, h3, h4, h5, h6, p, span, a").forEach((t,a)=>{var r;if(a>200)return;const i=(r=t.textContent)==null?void 0:r.trim();if(!i||i.length<10)return;const l={};t.id&&(l.id=t.id),t.className&&(l.class=t.className);const n=t.children.length;e.push({tag:t.tagName.toLowerCase(),text:i.substring(0,300),attributes:l,children:n})}),e}function z(){const e={url:window.location.href,title:document.title,description:E(),contentLength:document.body.innerText.length,linkCount:document.querySelectorAll("a[href]").length};return console.log("Basic page data (AI will determine relevance):",e),e}function E(){const e=document.querySelector('meta[name="description"]');return(e==null?void 0:e.content)||""}async function R(e,o=5){var t,a,i,l,n;try{console.log("🤖 Starting AI analysis in content script context...");const r=window;console.log("🔍 Checking AI availability in content script...");const f={"window.ai":typeof r.ai,"window.chrome?.ai":typeof((t=r.chrome)==null?void 0:t.ai),"globalThis.ai":typeof globalThis.ai,"window.LanguageModel":typeof r.LanguageModel,"globalThis.LanguageModel":typeof globalThis.LanguageModel};console.log("AI API availability in content script:",f);let c=null,g="",u=!1;if(r.LanguageModel?(c=r.LanguageModel,g="window.LanguageModel",u=!0,console.log("✅ Found NEW LanguageModel API at window.LanguageModel")):globalThis.LanguageModel?(c=globalThis.LanguageModel,g="globalThis.LanguageModel",u=!0,console.log("✅ Found NEW LanguageModel API at globalThis.LanguageModel")):(a=r.ai)!=null&&a.languageModel?(c=r.ai,g="window.ai",u=!1,console.log("✅ Found legacy AI API at window.ai")):(l=(i=r.chrome)==null?void 0:i.ai)!=null&&l.languageModel?(c=r.chrome.ai,g="window.chrome.ai",u=!1,console.log("✅ Found legacy AI API at window.chrome.ai")):(n=globalThis.ai)!=null&&n.languageModel&&(c=globalThis.ai,g="globalThis.ai",u=!1,console.log("✅ Found legacy AI API at globalThis.ai")),!c)return console.warn("🚫 Chrome built-in AI not found in content script context either"),console.log("Falling back to mock data generation"),w(e);console.log("📊 Checking AI capabilities in content script...");let m;if(u){m={available:await c.availability()},console.log(`NEW API availability at ${g}:`,m.available);const s=navigator.userActivation;s&&console.log("User activation status:",{isActive:s.isActive,hasBeenActive:s.hasBeenActive})}else m=await c.languageModel.capabilities(),console.log(`Legacy AI capabilities at ${g}:`,JSON.stringify(m,null,2));if(m.available==="no")return console.warn("🚫 AI explicitly not available in content script"),w(e);const b=m.available;if(b==="after-download"||b==="downloadable"){console.log("📥 AI available after download, attempting to trigger download...");try{console.log("🔄 Creating session to trigger model download...");const s=u?await c.create():await c.languageModel.create();console.log("✅ Model download triggered successfully!"),await s.destroy();const y=u?await c.availability():(await c.languageModel.capabilities()).available;if(console.log("Updated availability after download:",y),y!=="readily"&&y!=="available")return console.warn("🚫 AI still not ready after download attempt"),w(e)}catch(s){return console.error("❌ Model download failed:",s),w(e)}}if(b!=="readily"&&b!=="available")return console.warn(`🚫 AI not ready in content script: "${b}"`),w(e);console.log("✅ AI is readily available in content script, creating session...");const S=u?await c.create():await c.languageModel.create();let C=`You are an intelligent webpage analyzer. Your task is to examine this page and determine if it contains employment opportunities, career postings, or hiring information of any kind.

**WEBPAGE CONTENT:**
URL: ${e.url}
Page Title: ${e.pageTitle}
Meta Description: ${e.metaDescription}

**PAGE TEXT CONTENT:**
${e.text.substring(0,4e3)}

**HTML STRUCTURE ELEMENTS:**
${JSON.stringify(e.htmlStructure.slice(0,20),null,2)}

**ALL AVAILABLE LINKS:**
${e.links.slice(0,30).map(s=>{var y;return`- "${s.text}" -> ${s.href} (Context: ${((y=s.context)==null?void 0:y.substring(0,100))||"N/A"})`}).join(`
`)}

**ANALYSIS INSTRUCTIONS:**
1. First, analyze if this page contains any employment opportunities, career postings, or hiring information
2. Look for patterns in the content that suggest job listings, career opportunities, or recruitment information
3. If you find employment-related content, extract up to ${o} of the most relevant opportunities
4. Use your understanding of the page structure and links to determine specific URLs for each opportunity
5. Be creative and analytical - don't rely on obvious patterns, understand the context
6. Consider all types of employment: full-time, part-time, contract, internship, remote, etc.

**DECISION PROCESS:**
- Does this page appear to be related to employment, careers, or hiring?
- What evidence supports this conclusion?
- Where on the page are opportunities located?
- How can someone access more details about each opportunity?

**OUTPUT FORMAT:**
Return ONLY a JSON array. If no employment opportunities found, return empty array [].
If opportunities found, return up to ${o} items with this structure:
[{
  "title": "What you determine is the opportunity title",
  "company": "Organization or company offering this",
  "location": "Geographic location if determinable",
  "link": "Most specific URL for this opportunity",
  "description": "Your analysis of what this opportunity entails",
  "salary": "Compensation info if visible (optional)"
}]

JSON:`;console.log("📝 Sending prompt to AI from content script...");const v=await S.prompt(C);console.log("🤖 AI Response received in content script:",v.substring(0,200)+"...");let d=[];try{console.log("🔍 Starting JSON parsing..."),console.log("Raw AI response (full):",v);let s=v.trim();console.log("After trim:",s.substring(0,200)+"..."),s=s.replace(/```json\s*/g,"").replace(/```\s*/g,""),console.log("After markdown removal:",s.substring(0,200)+"...");let y=s.indexOf("["),I=s.lastIndexOf("]");if(y!==-1&&I!==-1&&I>y)s=s.substring(y,I+1),console.log("Extracted JSON substring:",s.substring(0,300)+"...");else{console.warn("⚠️ No JSON array brackets found in response");const p=s.match(/\{.*\}/s);p&&(s="["+p[0]+"]",console.log("Wrapped single object in array:",s.substring(0,200)+"..."))}if(console.log("🧪 Attempting JSON.parse on:",s.substring(0,500)+"..."),d=JSON.parse(s),console.log("✅ JSON parsing successful, got:",typeof d,"with length:",d==null?void 0:d.length),!Array.isArray(d))if(console.warn("⚠️ Response is not an array, attempting to wrap:",d),typeof d=="object"&&d!==null)d=[d];else throw new Error("Response is not an array or object");console.log("🔍 Pre-filter jobs count:",d.length),console.log("Sample jobs before filtering:",d.slice(0,2));const L=d.filter(p=>{const x=p&&typeof p.title=="string"&&p.title.length>0&&typeof p.company=="string"&&p.company.length>0;return x||console.log("❌ Invalid job filtered out:",p),x});console.log("🔍 Valid jobs after filtering:",L.length),d=L.map(p=>({title:p.title,company:p.company,location:p.location||"Location TBD",link:p.link||e.url,description:p.description||"Job description not available",...p.salary&&{salary:p.salary}})),console.log("✅ AI successfully extracted",d.length,"job postings in content script"),console.log("Final extracted jobs:",d)}catch(s){console.error("❌ JSON parsing failed in content script:",s),console.log("Failed on this text:",jsonStr),console.log("Full raw response was:",v),d=[]}return await S.destroy(),d.length>0?(console.log(`✨ SUCCESS: AI extracted ${d.length} real jobs, returning them`),d):(console.warn("🎭 FALLBACK: AI parsing resulted in 0 jobs, falling back to mock data"),console.log("This could be due to:"),console.log("1. JSON parsing failed (check logs above)"),console.log("2. AI returned empty array []"),console.log("3. All jobs were filtered out as invalid"),console.log("4. AI response was not in expected format"),w(e))}catch(r){return console.error("❌ AI analysis completely failed in content script:",r),w()}}async function W(e,o){console.log("🔍 Starting breadth-first job discovery...");const t=new Set,a=[];let i=e,l=3;for(let n=0;n<l;n++){console.log(`🌍 Analyzing page at depth ${n}: ${i.url}`),a.push(i.url),t.add(i.url);const r=await B(i,o);if(r.hasJobs&&r.jobs.length>0)return console.log(`✅ Found ${r.jobs.length} jobs at: ${i.url}`),{jobs:r.jobs,navigationPath:a,finalUrl:i.url};const f=await D(i);if(f.length===0){console.log("⚠️ No navigation targets found, ending search");break}const c=f[0];if(t.has(c)){console.log("🔄 Already visited",c,"trying next target...");continue}console.log(`🧦 Navigating to: ${c}`);try{i=await G(c)}catch(g){console.error("Failed to navigate to:",c,g);break}}return console.log("🎭 No jobs found after breadth-first search"),{jobs:[],navigationPath:a,finalUrl:i.url}}async function B(e,o){return R(e,o).then(t=>({hasJobs:t.length>0,jobs:t})).catch(()=>({hasJobs:!1,jobs:[]}))}async function D(e){try{const o=await H();if(!o)return[];const t=await V(o);if(!t)return[];const a=`You are a web navigation AI. Analyze this page and find the most likely links that would lead to career/employment/job opportunities.

**CURRENT PAGE:**
URL: ${e.url}
Title: ${e.pageTitle}

**AVAILABLE LINKS (first 20):**
${e.links.slice(0,20).map((l,n)=>`${n+1}. "${l.text}" -> ${l.href}`).join(`
`)}

**PAGE CONTENT (first 2000 chars):**
${e.text.substring(0,2e3)}

**NAVIGATION INSTRUCTIONS:**
1. Identify links that might lead to career pages, job listings, or hiring information
2. Consider text like "Careers", "Jobs", "Work with us", "Join us", "Opportunities", "Hiring", "Team", etc.
3. Also consider company-specific patterns like "About" -> "Careers" or "Company" -> "Jobs"
4. Return URLs in order of likelihood (most promising first)
5. Limit to top 3 most promising URLs

**REQUIRED OUTPUT:**
Return ONLY a JSON array of URLs (no explanations):
["https://company.com/careers", "https://company.com/jobs", "https://company.com/about/team"]

JSON:`,i=await t.prompt(a);await t.destroy();try{let l=i.trim();l=l.replace(/```json\s*/g,"").replace(/```\s*/g,"");const n=l.match(/\[.*\]/s);n&&(l=n[0]);const r=JSON.parse(l);return Array.isArray(r)?r.slice(0,3):[]}catch(l){return console.error("Failed to parse navigation targets:",l),[]}}catch(o){return console.error("Failed to find navigation targets:",o),[]}}async function G(e){return console.log("🛫 Simulating navigation to:",e),window.location.href=e,new Promise((o,t)=>{setTimeout(()=>{const a=k();o(a)},2e3)})}async function H(){const e=window;return e.LanguageModel&&await e.LanguageModel.availability()==="available"?e.LanguageModel:null}async function V(e){try{return await e.create()}catch(o){return console.error("Failed to create AI session:",o),null}}function w(e){return console.log("🎭 AI analysis unavailable - no fallback assumptions made"),[]}chrome.runtime.onMessage.addListener((e,o,t)=>{console.log("Content script received message:",e);const a=e.type||e.action;switch(a){case"ANALYZE_PAGE":const i=z();t({success:!0,data:i});break;case"extract_snapshot":try{const n=k();console.log("Sending DOM snapshot to background:",{url:n.url,textLength:n.text.length,linksCount:n.links.length}),n&&n.url&&n.text&&n.links?(console.log("Snapshot validation passed, sending response..."),t(n)):(console.error("Invalid snapshot data:",n),t({error:"Invalid snapshot data collected"}))}catch(n){console.error("Error collecting snapshot:",n),t({error:"Failed to collect snapshot: "+(n instanceof Error?n.message:String(n))})}break;case"TOGGLE_OVERLAY":A?F():$(),t({success:!0,overlayVisible:A});break;case"SHOW_NOTIFICATION":N(e.message||"GemScout notification"),t({success:!0});break;case"analyze_with_ai":console.log("🤖 Content script received AI analysis request");const l=e.maxJobs||5;return W(e.snapshot,l).then(n=>{console.log("✅ Breadth-first discovery completed:",n),t({success:!0,...n})}).catch(n=>{console.error("❌ Breadth-first discovery failed:",n),t({success:!1,error:n.message})}),!0;default:t({success:!1,error:"Unknown message type: "+a})}return!0});console.log("Content script ready - AI will analyze page when requested");
