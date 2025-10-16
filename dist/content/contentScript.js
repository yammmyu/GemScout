console.log("🚀 GemScout content script loaded - VERSION 3.0 WITH FULL DEBUGGING");console.log("📅 Build timestamp:",new Date().toISOString());console.log("🔧 DEBUGGING VERSION ACTIVE - Detailed AI logs enabled");window.gemscoutLoaded=!0;window.gemscoutVersion="2.0-enhanced";let y=!1,d=null;function M(){if(y)return;d=document.createElement("div"),d.id="gemscout-overlay-root",d.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;const o=d.attachShadow({mode:"open"}),t=document.createElement("div");t.style.cssText="pointer-events: auto;",t.innerHTML=`
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
  `,o.appendChild(t),document.body.appendChild(d);const e=o.querySelector(".gemscout-toggle");e&&e.addEventListener("click",()=>{x("GemScout: Analyzing page for job opportunities...")}),y=!0,console.log("GemScout overlay injected")}function J(){d&&d.parentNode&&(d.parentNode.removeChild(d),d=null,y=!1,console.log("GemScout overlay removed"))}function x(o){const t=document.createElement("div");t.style.cssText=`
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
  `,t.textContent=o,document.body.appendChild(t),setTimeout(()=>{t.style.opacity="1"},10),setTimeout(()=>{t.style.opacity="0",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300)},3e3)}function P(){const o={url:window.location.href,text:T(),links:N(),pageTitle:document.title,metaDescription:$()};return console.log("DOM snapshot collected:",{url:o.url,textLength:o.text.length,linksCount:o.links.length}),console.log("📄 Pure content snapshot ready for AI analysis"),o}function T(){document.querySelectorAll("script, style, noscript, iframe");const o=document.body.cloneNode(!0);o.querySelectorAll("script, style, noscript, iframe").forEach(e=>e.remove());let t=o.innerText||o.textContent||"";return t=t.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim(),t}function N(){const o=[];return document.querySelectorAll("a[href]").forEach(n=>{var r,u;const a=n.getAttribute("href"),s=(r=n.textContent)==null?void 0:r.trim();if(a&&s&&a!=="#"&&!a.startsWith("javascript:")){let g;try{g=new URL(a,window.location.href).href}catch{return}const c=n.parentElement,i=c?(u=c.textContent)==null?void 0:u.trim().substring(0,200):"";o.find(p=>p.href===g&&p.text===s)||o.push({href:g,text:s,context:i})}}),o.sort((n,a)=>{const s=k(n);return k(a)-s}).slice(0,50)}function k(o){let t=0;const e=(o.text+" "+o.href+" "+(o.context||"")).toLowerCase();return(e.includes("job")||e.includes("position")||e.includes("opening"))&&(t+=10),(e.includes("career")||e.includes("hiring"))&&(t+=8),(e.includes("apply")||e.includes("application"))&&(t+=7),(e.includes("engineer")||e.includes("developer")||e.includes("manager"))&&(t+=6),(e.includes("analyst")||e.includes("specialist")||e.includes("coordinator"))&&(t+=5),(e.includes("director")||e.includes("lead")||e.includes("senior")||e.includes("junior"))&&(t+=4),(o.href.includes("/job/")||o.href.includes("/jobs/")||o.href.includes("/career/"))&&(t+=8),(o.href.includes("greenhouse.io")||o.href.includes("lever.co")||o.href.includes("workday"))&&(t+=9),(e.includes("about")||e.includes("contact")||e.includes("home"))&&(t-=3),(e.includes("privacy")||e.includes("terms")||e.includes("cookie"))&&(t-=5),t}function $(){const o=document.querySelector('meta[name="description"]');return(o==null?void 0:o.content)||""}let l=[],m=!1,h=null,L=0;function D(){h||(console.log("🔍 Starting storage monitor..."),h=setInterval(()=>{try{const o=l.length;v({action:"jobs_update",count:o,jobs:l.slice(0,3)}),(o>=9||Date.now()-L>2e4)&&(w(),console.log(`🏁 Monitoring complete: ${o} jobs found`))}catch(o){console.error("Monitor error:",o),w()}},2e3))}function w(){h&&(console.log("⏹️ Stopping storage monitor..."),clearInterval(h),h=null)}async function O(o,t=5){console.log("🔄 Starting RECURSIVE job scanning system..."),l=[],L=Date.now(),m=!0,D();const e=new Set([o.url]);return A(o,t,e,0).catch(n=>{console.error("Recursive scanning failed:",n),m=!1}),[]}async function A(o,t,e,n){if(console.log(`🔍 Recursive scan: ${o.url} (depth: ${n}, visited: ${e.size})`),n>=2){console.log("⚠️ Max depth reached, stopping recursion");return}if(e.size>=10){console.log("⚠️ Max URLs visited, stopping recursion");return}if(l.length>=t){console.log("✅ Max jobs reached, stopping scan"),m=!1;return}if(e.has(o.url)){console.log("⚠️ URL already visited, skipping:",o.url);return}e.add(o.url);try{if(await F(o))if(console.log("✅ Page contains job listings"),await _(o)){console.log("✅ Full job details visible, extracting data...");const c=await R(o);c.length>0&&(l.push(...c),await B(),console.log(`✅ Extracted ${c.length} jobs (total: ${l.length})`),v({type:"jobs_found",jobs:c,batchNumber:n+1,totalJobs:l.length,isComplete:!1}))}else{console.log("⚠️ Only job cards/previews visible, finding detail links...");const c=await G(o);for(const i of c.slice(0,3)){if(l.length>=t)break;if(e.has(i))continue;console.log(`🔗 Following job detail link: ${i}`);const p=await S(i);p&&(await A(p,t,e,n+1),await new Promise(E=>setTimeout(E,1e3)))}}else{console.log("❌ No job listings found, looking for navigation links...");const g=await V(o);for(const c of g.slice(0,2)){if(l.length>=t)break;if(e.has(c))continue;console.log(`🔗 Following navigation link: ${c}`);const i=await S(c);i&&(await A(i,t,e,n+1),await new Promise(p=>setTimeout(p,1500)))}}}catch(u){console.error(`❌ Recursive scan failed at ${o.url}:`,u)}finally{n===0&&(m=!1,console.log(`🏁 Recursive scanning complete: ${l.length} total jobs`),v({type:"analysis_complete",totalJobs:l.length,isComplete:!0}))}}async function F(o){console.log("🤖 AI: Checking if page contains job listings...");const t=await f();if(!t)return!1;const e=await b(t);if(!e)return!1;try{const n=o.text.substring(0,2e3),a=`Does this page contain job listings?

Page: ${o.url}
Title: ${o.pageTitle}

Content:
${n}

Answer YES if:
- You see specific job titles (like "Software Engineer", "Marketing Manager", etc.)
- You see company names with job openings
- You see job-related content like salaries, requirements, job descriptions
- This appears to be a careers page, job board, or job listing page

Answer NO if:
- This is a general company website without job listings
- This is a blog, news site, or non-job related content
- You only see general information without specific job openings

Respond with only: YES or NO`,s=await e.prompt(a);await e.destroy();const r=s.trim().toUpperCase().includes("YES");return console.log(`✅ AI says page has job listings: ${r}`),r}catch(n){return console.error("❌ checkForJobListings failed:",n),await e.destroy(),!1}}async function _(o){console.log("🤖 AI: Checking job detail level...");const t=await f();if(!t)return!1;const e=await b(t);if(!e)return!1;try{const a=`Do we see full job details or just job cards/previews?

Content:
${o.text.substring(0,3e3)}

FULL DETAILS means:
- Complete job descriptions with requirements
- Detailed responsibilities and qualifications
- Full job postings with apply buttons
- Comprehensive information about roles

JOB CARDS/PREVIEWS means:
- Just job titles and company names
- Brief summaries or snippets
- "View More" or "Read More" links
- Preview cards that need clicking to see full details

Respond with: FULL or PREVIEW`,s=await e.prompt(a);await e.destroy();const r=s.trim().toUpperCase().includes("FULL");return console.log(`✅ AI says detail level: ${r?"FULL":"PREVIEW"}`),r}catch(n){return console.error("❌ checkJobDetailLevel failed:",n),await e.destroy(),!1}}async function R(o){console.log("🤖 AI: Extracting jobs from page with full details...");const t=await f();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.text.substring(0,4e3),a=`Extract all job postings from this page.

Page: ${o.url}
Content:
${n}

Extract each job as complete as possible. Look for:
- Job titles and company names
- Locations and remote work options
- Salary/compensation if mentioned
- Key requirements and responsibilities
- Job descriptions

Return jobs as JSON array:
[{
  "title": "Job title",
  "company": "Company name",
  "location": "Location or Remote",
  "link": "${o.url}",
  "description": "Detailed job description with requirements",
  "salary": "Salary if mentioned or null"
}]

If no jobs found, return: []

JSON:`,s=await e.prompt(a);await e.destroy();const r=z(s,o.url);return console.log(`✅ AI extracted ${r.length} jobs from page`),r}catch(n){return console.error("❌ extractJobsFromPage failed:",n),await e.destroy(),[]}}async function G(o){console.log("🤖 AI: Finding job detail links...");const t=await f();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.links.slice(0,30).map((u,g)=>`${g+1}. "${u.text}" -> ${u.href}`).join(`
`),a=`Find links that lead to individual job detail pages.

Page: ${o.url}

AVAILABLE LINKS:
${n}

Find links that:
- Lead to specific job postings (not job categories)
- Have job titles like "Software Engineer", "Marketing Manager"
- Say "View Details", "Apply Now", "Read More"
- Lead to individual job descriptions

Avoid links that:
- Lead to job search filters or categories
- Are navigation links (Home, About, Contact)
- Lead to general company pages

Return up to 5 job detail links as JSON array:
["https://example.com/job1", "https://example.com/job2"]

If no job detail links found, return: []

JSON:`,s=await e.prompt(a);await e.destroy();const r=C(s);return console.log(`✅ AI found ${r.length} job detail links`),r}catch(n){return console.error("❌ findJobDetailLinks failed:",n),await e.destroy(),[]}}async function V(o){console.log("🤖 AI: Finding navigation links to job listings...");const t=await f();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.links.slice(0,20).map((u,g)=>`${g+1}. "${u.text}" -> ${u.href}`).join(`
`),a=`Find links most likely to lead to job listings.

Page: ${o.url}
Title: ${o.pageTitle}

AVAILABLE LINKS:
${n}

Rank links by likelihood to contain job listings:
- "Careers", "Jobs", "Work with us", "Join our team"
- "Opportunities", "Openings", "Positions"
- Department pages that might have job listings
- Career or recruitment related links

Avoid:
- General company pages (About, Contact, Home)
- Product pages or services
- Blog posts or news

Return top 3 most promising links as JSON array:
["https://example.com/careers", "https://example.com/jobs"]

If no promising links found, return: []

JSON:`,s=await e.prompt(a);await e.destroy();const r=C(s);return console.log(`✅ AI found ${r.length} navigation links`),r}catch(n){return console.error("❌ findJobNavigationLinks failed:",n),await e.destroy(),[]}}function z(o,t){try{let e=o.trim();e=e.replace(/```json\s*/g,"").replace(/```\s*/g,"");const n=e.match(/\[.*\]/s);if(n)e=n[0];else return[];const a=JSON.parse(e);return Array.isArray(a)?a.filter(s=>s.title&&s.company).map(s=>({title:s.title,company:s.company,location:s.location||"Location TBD",link:s.link||t,description:s.description||"Job description not available",...s.salary&&{salary:s.salary}})):[]}catch(e){return console.error("parseExtractedJobs failed:",e),[]}}function C(o){try{let t=o.trim();t=t.replace(/```json\s*/g,"").replace(/```\s*/g,"");const e=t.match(/\[.*\]/s);if(e){const n=JSON.parse(e[0]);if(Array.isArray(n))return n.filter(a=>typeof a=="string"&&a.startsWith("http"))}return[]}catch(t){return console.error("parseJobLinks failed:",t),[]}}async function S(o){console.log(`🔄 Simulating navigation to: ${o}`);try{const t={url:o,pageTitle:`Job Details: ${o.split("/").pop()||"Job Page"}`,text:`Job Title: Sample Position
Company: Sample Company
Location: Remote
Description: This is a simulated job detail page.
Requirements: Sample requirements
Apply now for this position.`,links:[{href:o,text:"Apply Now"},{href:o+"/apply",text:"Submit Application"}]};return console.log("✅ Simulated navigation complete (minimal simulation)"),t}catch(t){return console.error(`❌ Navigation simulation failed for ${o}:`,t),null}}async function B(){var o;try{if(typeof chrome>"u"||!((o=chrome==null?void 0:chrome.storage)!=null&&o.local)){console.warn("⚠️ Chrome storage API not available");return}await chrome.storage.local.set({jobs:l,lastJobAnalysis:{timestamp:Date.now(),url:window.location.href,jobCount:l.length}}),console.log(`✅ Saved ${l.length} jobs to Chrome storage`)}catch(t){console.error("❌ Failed to save jobs to Chrome storage:",t),t.message&&t.message.includes("Extension context invalidated")&&console.log("🔄 Extension context invalidated, jobs stored in memory only")}}function v(o){var t;try{if(typeof chrome>"u"||!((t=chrome==null?void 0:chrome.runtime)!=null&&t.sendMessage)){console.warn("⚠️ Chrome runtime API not available, message not sent:",o.type);return}chrome.runtime.sendMessage(o,e=>{chrome.runtime.lastError&&console.log("🔇 Runtime message error (likely popup closed):",chrome.runtime.lastError.message)})}catch(e){console.error("❌ Failed to send Chrome message:",e)}}function H(o,t=3){const e=o+t,n=l.slice(o,e);return console.log(`📋 Returning jobs ${o}-${e}: ${n.length} jobs`),n}function j(){return l.length}async function f(){var o;try{const t=window;if(console.log("🔍 Checking for Chrome AI APIs..."),t.LanguageModel){console.log("✅ Found window.LanguageModel");try{const e=await t.LanguageModel.availability();if(console.log("LanguageModel availability:",e),e==="readily"||e==="available")return t.LanguageModel}catch(e){console.log("LanguageModel availability check failed:",e)}}if((o=t.ai)!=null&&o.languageModel){console.log("✅ Found window.ai.languageModel");try{const e=await t.ai.languageModel.capabilities();if(console.log("AI capabilities:",e),e.available==="readily"||e.available==="available")return t.ai}catch(e){console.log("AI capabilities check failed:",e)}}console.warn("❌ No AI API found or available")}catch(t){console.warn("AI API check failed:",t)}return null}async function b(o){var t;try{if(console.log("🔄 Creating AI session..."),console.log("AI API object keys:",Object.keys(o||{})),o.create){console.log("🆕 Using LanguageModel.create()");const e=await o.create();return console.log("✅ LanguageModel session created successfully:",!!e),console.log("Session object keys:",Object.keys(e||{})),e}if((t=o.languageModel)!=null&&t.create){console.log("🆗 Using ai.languageModel.create()");const e=await o.languageModel.create();return console.log("✅ Legacy AI session created successfully:",!!e),console.log("Session object keys:",Object.keys(e||{})),e}return console.error("❌ No create method found on AI API"),null}catch(e){return console.error("❌ Failed to create AI session:",e),null}}var I;typeof chrome<"u"&&((I=chrome==null?void 0:chrome.runtime)!=null&&I.onMessage)?chrome.runtime.onMessage.addListener((o,t,e)=>{console.log("Content script received message:",o);const n=o.type||o.action;switch(n){case"ANALYZE_PAGE":const a=analyzeCurrentPage();e({success:!0,data:a});break;case"extract_snapshot":try{const i=P();console.log("Sending DOM snapshot to background:",{url:i.url,textLength:i.text.length,linksCount:i.links.length}),i&&i.url&&i.text&&i.links?(console.log("Snapshot validation passed, sending response..."),e(i)):(console.error("Invalid snapshot data:",i),e({error:"Invalid snapshot data collected"}))}catch(i){console.error("Error collecting snapshot:",i),e({error:"Failed to collect snapshot: "+(i instanceof Error?i.message:String(i))})}break;case"TOGGLE_OVERLAY":y?J():M(),e({success:!0,overlayVisible:y});break;case"SHOW_NOTIFICATION":x(o.message||"GemScout notification"),e({success:!0});break;case"analyze_with_ai":console.log("🤖 Content script received streaming AI analysis request");const s=o.maxJobs||5;return O(o.snapshot,s).then(()=>{e({success:!0,message:"Streaming analysis started"})}).catch(i=>{console.error("❌ Streaming analysis failed to start:",i),e({success:!1,error:i.message})}),!0;case"get_more_jobs":const r=o.startIndex||0,u=o.count||3,g=H(r,u),c=j();e({success:!0,jobs:g,totalCount:c,hasMore:r+u<c});break;case"get_job_status":e({success:!0,totalJobs:j(),processing:m});break;default:e({success:!1,error:"Unknown message type: "+n})}return!0}):console.warn("⚠️ Chrome runtime API not available - content script cannot receive messages");window.testGemScoutAI=async()=>{console.log("🧪 Testing GemScout AI availability...");const o=await f();if(o){console.log("✅ AI API is available!");const t=await b(o);if(t){console.log("✅ AI session created successfully!");try{const e=await t.prompt('Say "Hello from GemScout AI test"');console.log("✅ AI test response:",e),await t.destroy(),console.log("✅ All AI systems working!")}catch(e){console.error("❌ AI prompt test failed:",e)}}else console.error("❌ Failed to create AI session")}else console.error("❌ AI API not available"),console.log("Please check Chrome flags: chrome://flags"),console.log('Enable: "Prompt API for Gemini Nano" and "Optimization Guide On Device Model"')};window.addEventListener("beforeunload",()=>{console.log("🧹 Cleaning up GemScout..."),w(),m=!1,l=[]});console.log("Content script ready - AI will analyze page when requested");
