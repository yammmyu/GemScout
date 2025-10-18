console.log("🚀 GemScout content script loaded - VERSION 3.0 WITH FULL DEBUGGING");console.log("📅 Build timestamp:",new Date().toISOString());console.log("🔧 DEBUGGING VERSION ACTIVE - Detailed AI logs enabled");window.gemscoutLoaded=!0;window.gemscoutVersion="2.0-enhanced";let k=!1,m=null;function D(){if(k)return;m=document.createElement("div"),m.id="gemscout-overlay-root",m.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `;const o=m.attachShadow({mode:"open"}),t=document.createElement("div");t.style.cssText="pointer-events: auto;",t.innerHTML=`
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
  `,o.appendChild(t),document.body.appendChild(m);const e=o.querySelector(".gemscout-toggle");e&&e.addEventListener("click",()=>{C("GemScout: Analyzing page for job opportunities...")}),k=!0,console.log("GemScout overlay injected")}function M(){m&&m.parentNode&&(m.parentNode.removeChild(m),m=null,k=!1,console.log("GemScout overlay removed"))}function C(o){const t=document.createElement("div");t.style.cssText=`
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
  `,t.textContent=o,document.body.appendChild(t),setTimeout(()=>{t.style.opacity="1"},10),setTimeout(()=>{t.style.opacity="0",setTimeout(()=>{t.parentNode&&t.parentNode.removeChild(t)},300)},3e3)}function G(){const o={url:window.location.href,text:R(),links:J(),pageTitle:document.title,metaDescription:P()};return console.log("DOM snapshot collected:",{url:o.url,textLength:o.text.length,linksCount:o.links.length}),console.log("📄 Pure content snapshot ready for AI analysis"),o}function R(){document.querySelectorAll("script, style, noscript, iframe");const o=document.body.cloneNode(!0);o.querySelectorAll("script, style, noscript, iframe").forEach(e=>e.remove());let t=o.innerText||o.textContent||"";return t=t.replace(/\s+/g," ").replace(/\n\s*\n/g,`
`).trim(),t}function J(){const o=[];return document.querySelectorAll("a[href]").forEach(n=>{var a,u;const l=n.getAttribute("href"),i=(a=n.textContent)==null?void 0:a.trim();if(l&&i&&l!=="#"&&!l.startsWith("javascript:")){let c;try{c=new URL(l,window.location.href).href}catch{return}const d=n.parentElement,s=d?(u=d.textContent)==null?void 0:u.trim().substring(0,200):"";o.find(g=>g.href===c&&g.text===i)||o.push({href:c,text:i,context:s})}}),o.sort((n,l)=>{const i=j(n);return j(l)-i}).slice(0,50)}function j(o){let t=0;const e=(o.text+" "+o.href+" "+(o.context||"")).toLowerCase();return(e.includes("job")||e.includes("position")||e.includes("opening"))&&(t+=10),(e.includes("career")||e.includes("hiring"))&&(t+=8),(e.includes("apply")||e.includes("application"))&&(t+=7),(e.includes("engineer")||e.includes("developer")||e.includes("manager"))&&(t+=6),(e.includes("analyst")||e.includes("specialist")||e.includes("coordinator"))&&(t+=5),(e.includes("director")||e.includes("lead")||e.includes("senior")||e.includes("junior"))&&(t+=4),(o.href.includes("/job/")||o.href.includes("/jobs/")||o.href.includes("/career/"))&&(t+=8),(o.href.includes("greenhouse.io")||o.href.includes("lever.co")||o.href.includes("workday"))&&(t+=9),(e.includes("about")||e.includes("contact")||e.includes("home"))&&(t-=3),(e.includes("privacy")||e.includes("terms")||e.includes("cookie"))&&(t-=5),t}function P(){const o=document.querySelector('meta[name="description"]');return(o==null?void 0:o.content)||""}let r=[],f=!1,w=null,T=0;function F(){w||(console.log("🔍 Starting storage monitor..."),w=setInterval(()=>{try{const o=r.length;I({action:"jobs_update",count:o,jobs:r.slice(0,3)}),(o>=9||Date.now()-T>2e4)&&(E(),console.log(`🏁 Monitoring complete: ${o} jobs found`))}catch(o){console.error("Monitor error:",o),E()}},2e3))}function E(){w&&(console.log("⏹️ Stopping storage monitor..."),clearInterval(w),w=null)}async function O(o,t=5){console.log("🔄 Starting RECURSIVE job scanning system..."),console.log("🔍 DEBUG: Input parameters:"),console.log("  - snapshot.url:",o.url),console.log("  - snapshot.text length:",o.text.length),console.log("  - snapshot.links count:",o.links.length),console.log("  - maxJobs requested:",t),r=[],T=Date.now(),console.log("🔍 DEBUG: Reset jobStorage, length now:",r.length),f=!0,console.log("🔍 DEBUG: Set processingActive to true"),F(),console.log("🔍 DEBUG: Started storage monitor");const e=new Set;return console.log("🔍 DEBUG: Created empty visitedUrls set"),S(o,t,e,0).catch(n=>{console.error("❌ Recursive scanning failed:",n),console.log("🔍 DEBUG: Error details:",{name:n.name,message:n.message,stack:n.stack}),f=!1}),console.log("🔍 DEBUG: Recursive scan started, returning empty array"),[]}async function S(o,t,e,n){var u;if(console.log(`
🔍 === RECURSIVE SCAN START ===`),console.log(`🔍 URL: ${o.url}`),console.log(`🔍 Depth: ${n}/2`),console.log(`🔍 Visited URLs: ${e.size}/10`),console.log(`🔍 Current job count: ${r.length}/${t}`),console.log(`🔍 Snapshot text length: ${o.text.length}`),console.log(`🔍 Snapshot links: ${o.links.length}`),n>=2){console.log("⚠️ EXIT: Max depth reached, stopping recursion");return}if(e.size>=10){console.log("⚠️ EXIT: Max URLs visited, stopping recursion");return}if(r.length>=t){console.log("✅ EXIT: Max jobs reached, stopping scan"),f=!1;return}if(e.has(o.url)){console.log("⚠️ EXIT: URL already visited, skipping:",o.url),console.log("🔍 DEBUG: Visited URLs list:",Array.from(e));return}e.add(o.url),console.log("🔍 DEBUG: Added URL to visited set. New size:",e.size);try{console.log("🔍 DEBUG: Starting AI analysis steps..."),console.log("🤖 STEP 1: Checking if page contains job listings...");const c=await U(o);if(console.log(`🔍 DEBUG: Step 1 result - hasJobListings: ${c}`),c){console.log("✅ Page contains job listings - proceeding to step 2"),console.log("🤖 STEP 2: Checking job detail level...");const d=await B(o);if(console.log(`🔍 DEBUG: Step 2 result - hasFullDetails: ${d}`),d){console.log("📝 FULL DETAILS PATH: Extracting data from full job details...");const s=await _(o);if(console.log(`🔍 DEBUG: extractJobsFromPage returned ${s.length} jobs:`,s),s.length>0)console.log(`✅ SUCCESS: Found ${s.length} jobs, adding to storage`),r.push(...s),await z(),console.log(`✅ Extracted ${s.length} jobs (total: ${r.length})`),I({type:"jobs_found",jobs:s,batchNumber:n+1,totalJobs:r.length,isComplete:!1});else{console.log("⚠️ FALLBACK: AI said FULL but extracted 0 jobs - treating as PREVIEW instead"),console.log("🔍 DEBUG: Switching from FULL to PREVIEW mode due to 0 jobs"),console.log("🤖 STEP 3: Finding job detail links...");const g=await v(o);console.log(`🔍 DEBUG: findJobDetailLinks returned ${g.length} links:`,g),console.log(`🔗 PROCESSING: Following ${Math.min(g.length,3)} job detail links...`);for(const p of g.slice(0,3)){if(r.length>=t){console.log("✅ Breaking loop: Max jobs reached");break}if(e.has(p)){console.log("⚠️ Skipping already visited link:",p);continue}console.log(`🔗 Following job detail link: ${p}`),console.log(`🔄 Simulating navigation to: ${p}`);const y=await A(p);console.log("🔍 DEBUG: Simulation result:",!!y),y?(console.log(`🔄 RECURSING to depth ${n+1} for: ${p}`),await S(y,t,e,n+1),console.log(`🔄 RETURNED from depth ${n+1}, waiting 1s...`),await new Promise(N=>setTimeout(N,1e3))):console.log(`❌ Simulation failed for: ${p}`)}}}else{console.log("📎 PREVIEW PATH: Only job cards/previews visible, finding detail links...");const s=await v(o);console.log(`🔍 DEBUG: PREVIEW PATH findJobDetailLinks returned ${s.length} links:`,s),console.log(`🔗 PREVIEW PROCESSING: Following ${Math.min(s.length,3)} job detail links...`);for(const g of s.slice(0,3)){if(r.length>=t){console.log("✅ PREVIEW Breaking loop: Max jobs reached");break}if(e.has(g)){console.log("⚠️ PREVIEW Skipping already visited link:",g);continue}console.log(`🔗 PREVIEW Following job detail link: ${g}`);const p=await A(g);p&&(await S(p,t,e,n+1),await new Promise(y=>setTimeout(y,1e3)))}}}else{console.log("❌ NO JOBS PATH: No job listings found, looking for navigation links..."),console.log("🔍 DEBUG: Page did not contain job listings, trying navigation approach"),console.log("🤖 STEP 3: Finding navigation links to job listings...");const d=await V(o);console.log(`🔍 DEBUG: findJobNavigationLinks returned ${d.length} links:`,d),console.log(`🔗 NAV PROCESSING: Following ${Math.min(d.length,2)} navigation links...`);for(const s of d.slice(0,2)){if(r.length>=t){console.log("✅ NAV Breaking loop: Max jobs reached");break}if(e.has(s)){console.log("⚠️ NAV Skipping already visited link:",s);continue}console.log(`🔗 NAV Following navigation link: ${s}`);const g=await A(s);g&&(await S(g,t,e,n+1),await new Promise(p=>setTimeout(p,1500)))}}}catch(c){console.error(`❌ RECURSIVE SCAN ERROR at ${o.url}:`,c),console.log("🔍 DEBUG: Error details:",{name:c.name,message:c.message,stack:(u=c.stack)==null?void 0:u.substring(0,500)})}finally{console.log(`🔍 DEBUG: Finally block - depth: ${n}, jobStorage: ${r.length}`),n===0?(f=!1,console.log(`🏁 FINAL COMPLETION: Recursive scanning complete: ${r.length} total jobs`),console.log("🔍 DEBUG: Final job storage contents:",r),console.log("📤 Sending final completion message to popup..."),I({type:"analysis_complete",totalJobs:r.length,isComplete:!0})):console.log(`🔍 DEBUG: Not root depth (${n}), not sending completion message`)}}async function U(o){console.log("🤖 AI: Checking if page contains job listings...");const t=await h();if(!t)return!1;const e=await b(t);if(!e)return!1;try{const n=o.text.substring(0,2e3),l=`Does this page contain job listings?

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

Respond with only: YES or NO`,i=await e.prompt(l);await e.destroy();const a=i.trim().toUpperCase().includes("YES");return console.log(`✅ AI says page has job listings: ${a}`),a}catch(n){return console.error("❌ checkForJobListings failed:",n),await e.destroy(),!1}}async function B(o){console.log("🤖 AI: Checking job detail level...");const t=await h();if(!t)return!1;const e=await b(t);if(!e)return!1;try{const n=o.text.substring(0,3e3),l=`Analyze this careers page to determine the level of job detail shown.

Page: ${o.url}
Content:
${n}

This is PREVIEW level if:
- You see job titles like "Software Engineer", "Product Manager" but no detailed descriptions
- You see "Apply Now" buttons or links to external job boards (like greenhouse.io)
- You see location info but no detailed job requirements
- This looks like a job listing page with cards/tiles that link to full job descriptions
- Content mentions "See All Open Roles" or similar

This is FULL level if:
- You see complete job descriptions with detailed requirements (5+ requirements listed)
- You see full responsibility lists and qualification details
- You see salary ranges and comprehensive benefits information
- The page shows the complete job posting, not just a preview

Based on the content above, respond with: FULL or PREVIEW`,i=await e.prompt(l);await e.destroy();const a=i.trim().toUpperCase().includes("FULL");return console.log(`✅ AI says detail level: ${a?"FULL":"PREVIEW"}`),a}catch(n){return console.error("❌ checkJobDetailLevel failed:",n),await e.destroy(),!1}}async function _(o){console.log("🤖 AI: Extracting jobs from page with full details...");const t=await h();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.text.substring(0,4e3),l=`Extract all job postings from this page.

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

JSON:`,i=await e.prompt(l);await e.destroy();const a=W(i,o.url);return console.log(`✅ AI extracted ${a.length} jobs from page`),a}catch(n){return console.error("❌ extractJobsFromPage failed:",n),await e.destroy(),[]}}async function v(o){console.log("🤖 AI: Finding job detail links...");const t=await h();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.links.slice(0,30).map((u,c)=>`${c+1}. "${u.text}" -> ${u.href}`).join(`
`),l=`Find links that lead to individual job detail pages.

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

JSON:`,i=await e.prompt(l);await e.destroy();const a=$(i);return console.log(`✅ AI found ${a.length} job detail links`),a}catch(n){return console.error("❌ findJobDetailLinks failed:",n),await e.destroy(),[]}}async function V(o){console.log("🤖 AI: Finding navigation links to job listings...");const t=await h();if(!t)return[];const e=await b(t);if(!e)return[];try{const n=o.links.slice(0,20).map((u,c)=>`${c+1}. "${u.text}" -> ${u.href}`).join(`
`),l=`Find links most likely to lead to job listings.

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

JSON:`,i=await e.prompt(l);await e.destroy();const a=$(i);return console.log(`✅ AI found ${a.length} navigation links`),a}catch(n){return console.error("❌ findJobNavigationLinks failed:",n),await e.destroy(),[]}}function W(o,t){try{let e=o.trim();e=e.replace(/```json\s*/g,"").replace(/```\s*/g,"");const n=e.match(/\[.*\]/s);if(n)e=n[0];else return[];const l=JSON.parse(e);return Array.isArray(l)?l.filter(i=>i.title&&i.company).map(i=>({title:i.title,company:i.company,location:i.location||"Location TBD",link:i.link||t,description:i.description||"Job description not available",...i.salary&&{salary:i.salary}})):[]}catch(e){return console.error("parseExtractedJobs failed:",e),[]}}function $(o){try{let t=o.trim();t=t.replace(/```json\s*/g,"").replace(/```\s*/g,"");const e=t.match(/\[.*\]/s);if(e){const n=JSON.parse(e[0]);if(Array.isArray(n))return n.filter(l=>typeof l=="string"&&l.startsWith("http"))}return[]}catch(t){return console.error("parseJobLinks failed:",t),[]}}async function A(o){console.log(`🔄 Simulating navigation to: ${o}`);try{const t={url:o,pageTitle:`Job Details: ${o.split("/").pop()||"Job Page"}`,text:`Job Title: Sample Position
Company: Sample Company
Location: Remote
Description: This is a simulated job detail page.
Requirements: Sample requirements
Apply now for this position.`,links:[{href:o,text:"Apply Now"},{href:o+"/apply",text:"Submit Application"}]};return console.log("✅ Simulated navigation complete (minimal simulation)"),t}catch(t){return console.error(`❌ Navigation simulation failed for ${o}:`,t),null}}async function z(){var o;try{if(typeof chrome>"u"||!((o=chrome==null?void 0:chrome.storage)!=null&&o.local)){console.warn("⚠️ Chrome storage API not available");return}await chrome.storage.local.set({jobs:r,lastJobAnalysis:{timestamp:Date.now(),url:window.location.href,jobCount:r.length}}),console.log(`✅ Saved ${r.length} jobs to Chrome storage`)}catch(t){console.error("❌ Failed to save jobs to Chrome storage:",t),t.message&&t.message.includes("Extension context invalidated")&&console.log("🔄 Extension context invalidated, jobs stored in memory only")}}function I(o){var t;try{if(typeof chrome>"u"||!((t=chrome==null?void 0:chrome.runtime)!=null&&t.sendMessage)){console.warn("⚠️ Chrome runtime API not available, message not sent:",o.type);return}chrome.runtime.sendMessage(o,e=>{chrome.runtime.lastError&&(o.type==="analysis_complete"||o.type==="analysis_error")&&console.log("🔇 Runtime message error (likely popup closed):",chrome.runtime.lastError.message)})}catch(e){console.error("❌ Failed to send Chrome message:",e)}}function H(o,t=3){const e=o+t,n=r.slice(o,e);return console.log(`📋 Returning jobs ${o}-${e}: ${n.length} jobs`),n}function L(){return r.length}async function h(){var o;try{const t=window;if(console.log("🔍 Checking for Chrome AI APIs..."),t.LanguageModel){console.log("✅ Found window.LanguageModel");try{const e=await t.LanguageModel.availability();if(console.log("LanguageModel availability:",e),e==="readily"||e==="available")return t.LanguageModel}catch(e){console.log("LanguageModel availability check failed:",e)}}if((o=t.ai)!=null&&o.languageModel){console.log("✅ Found window.ai.languageModel");try{const e=await t.ai.languageModel.capabilities();if(console.log("AI capabilities:",e),e.available==="readily"||e.available==="available")return t.ai}catch(e){console.log("AI capabilities check failed:",e)}}console.warn("❌ No AI API found or available")}catch(t){console.warn("AI API check failed:",t)}return null}async function b(o){var t;try{if(console.log("🔄 Creating AI session..."),console.log("AI API object keys:",Object.keys(o||{})),o.create){console.log("🆕 Using LanguageModel.create()");const e=await o.create();return console.log("✅ LanguageModel session created successfully:",!!e),console.log("Session object keys:",Object.keys(e||{})),e}if((t=o.languageModel)!=null&&t.create){console.log("🆗 Using ai.languageModel.create()");const e=await o.languageModel.create();return console.log("✅ Legacy AI session created successfully:",!!e),console.log("Session object keys:",Object.keys(e||{})),e}return console.error("❌ No create method found on AI API"),null}catch(e){return console.error("❌ Failed to create AI session:",e),null}}var x;typeof chrome<"u"&&((x=chrome==null?void 0:chrome.runtime)!=null&&x.onMessage)?chrome.runtime.onMessage.addListener((o,t,e)=>{console.log("Content script received message:",o);const n=o.type||o.action;switch(n){case"ping":console.log("🏓 Content script ping received"),e({success:!0,message:"pong",version:"2.0-enhanced"});break;case"ANALYZE_PAGE":const l={url:window.location.href,title:document.title,description:P(),contentLength:document.body.innerText.length,linkCount:document.querySelectorAll("a[href]").length};console.log("Basic page data (AI will determine relevance):",l),e({success:!0,data:l});break;case"extract_snapshot":try{const s=G();console.log("Sending DOM snapshot to background:",{url:s.url,textLength:s.text.length,linksCount:s.links.length}),s&&s.url&&s.text&&s.links?(console.log("Snapshot validation passed, sending response..."),e(s)):(console.error("Invalid snapshot data:",s),e({error:"Invalid snapshot data collected"}))}catch(s){console.error("Error collecting snapshot:",s),e({error:"Failed to collect snapshot: "+(s instanceof Error?s.message:String(s))})}break;case"TOGGLE_OVERLAY":k?M():D(),e({success:!0,overlayVisible:k});break;case"SHOW_NOTIFICATION":C(o.message||"GemScout notification"),e({success:!0});break;case"analyze_with_ai":console.log("🤖 Content script received streaming AI analysis request");const i=o.maxJobs||5;return O(o.snapshot,i).then(()=>{e({success:!0,message:"Streaming analysis started"})}).catch(s=>{console.error("❌ Streaming analysis failed to start:",s),e({success:!1,error:s.message})}),!0;case"get_more_jobs":const a=o.startIndex||0,u=o.count||3,c=H(a,u),d=L();e({success:!0,jobs:c,totalCount:d,hasMore:a+u<d});break;case"get_job_status":e({success:!0,totalJobs:L(),processing:f});break;default:e({success:!1,error:"Unknown message type: "+n})}return!0}):console.warn("⚠️ Chrome runtime API not available - content script cannot receive messages");window.testGemScoutAI=async()=>{console.log("🧪 Testing GemScout AI availability...");const o=await h();if(o){console.log("✅ AI API is available!");const t=await b(o);if(t){console.log("✅ AI session created successfully!");try{const e=await t.prompt('Say "Hello from GemScout AI test"');console.log("✅ AI test response:",e),await t.destroy(),console.log("✅ All AI systems working!")}catch(e){console.error("❌ AI prompt test failed:",e)}}else console.error("❌ Failed to create AI session")}else console.error("❌ AI API not available"),console.log("Please check Chrome flags: chrome://flags"),console.log('Enable: "Prompt API for Gemini Nano" and "Optimization Guide On Device Model"')};window.addEventListener("beforeunload",()=>{console.log("🧹 Cleaning up GemScout..."),E(),f=!1,r=[]});console.log("Content script ready - AI will analyze page when requested");
