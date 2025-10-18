// background.ts — GemScout background service worker (fixed)
//
// Responsibilities:
//  - Receive discovery requests from popup (start_discovery).
//  - Ask the active tab's content script for a page snapshot.
//  - Create a LanguageModel session and call promptStreaming() with a JSON-only instruction.
//  - Parse streaming chunks, detect completed job JSON objects/arrays, store them to chrome.storage.local,
//    and forward updates to the popup (connected via runtime.connect / popup-stream).
//
// Notes:
//  - This file expects a compiled environment where `LanguageModel` is available (Prompt API).
//  - Keep the user-button click in popup to trigger the initial discovery (user gesture).

declare const LanguageModel: any; // Prompt API global, per Chrome docs

interface JobPosting {
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  salary?: string;
  skills?: string[]; // future scalable fields
  software?: string[]; // future scalable fields
  workingHours?: string;
}

let currentPopupPort: chrome.runtime.Port | null = null;
let activeSession: any | null = null;
let currentTabId: number | null = null;
let isAnalyzing = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log('GemScout extension installed (background)');
});

// Listen for tab changes to cancel ongoing analysis
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Cancel analysis if URL changed on the active tab
  if (currentTabId === tabId && changeInfo.url && isAnalyzing) {
    console.log('🔄 DEBUG: Tab URL changed, cancelling active analysis');
    cancelActiveAnalysis('Tab navigation detected');
  }
});

// Listen for tab activation changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Cancel analysis if user switched to a different tab
  if (currentTabId && currentTabId !== activeInfo.tabId && isAnalyzing) {
    console.log('🔄 DEBUG: Active tab changed, cancelling analysis');
    cancelActiveAnalysis('Switched to different tab');
  }
});

// Function to cancel active analysis
function cancelActiveAnalysis(reason: string) {
  console.log('❌ DEBUG: Cancelling active analysis:', reason);
  
  isAnalyzing = false;
  
  if (activeSession) {
    console.log('🗑️ DEBUG: Destroying active session...');
    activeSession.destroy().catch((e: any) => {
      console.log('⚠️ DEBUG: Error destroying session:', e);
    });
    activeSession = null;
  }
  
  if (currentPopupPort) {
    currentPopupPort.postMessage({
      type: 'analysis_cancelled',
      reason: reason,
      isComplete: true
    });
    console.log('📨 DEBUG: Sent cancellation message to popup');
  }
  
  currentTabId = null;
}

// Keep the most recent connected popup (simple single-popup design)
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  if (port.name === 'popup-stream') {
    currentPopupPort = port;
    port.onDisconnect.addListener(() => {
      console.log('Popup port disconnected');
      currentPopupPort = null;
    });
  }
});

// Utility: safely read storage (promisified)
function storageGet<T = any>(keys: string[] | string) {
  return new Promise<T>((res) => chrome.storage.local.get(keys, res));
}
function storageSet(obj: Record<string, any>) {
  return new Promise<void>((res) => chrome.storage.local.set(obj, () => res()));
}

// Append jobs safely to storage
async function appendJobsToStorage(newJobs: JobPosting[]) {
  try {
    const { gemscout_jobs = [] } = await storageGet<{ gemscout_jobs?: JobPosting[] }>(['gemscout_jobs']);
    const combined = [...gemscout_jobs, ...newJobs];
    await storageSet({ gemscout_jobs: combined });
    // also write last analysis timestamp
    await storageSet({ lastJobAnalysis: { timestamp: Date.now() } });
    return combined.length;
  } catch (e) {
    console.error('appendJobsToStorage error', e);
    return -1;
  }
}

// Stream parsing helper: accumulate chunks and attempt to extract JSON arrays/objects
function tryExtractJsonObjects(buffer: string): { extracted: any[]; remaining: string } {
  const extracted: any[] = [];
  let remaining = buffer.trim();

  // Only debug on significant buffer changes or when we find something
  const shouldDebug = remaining.length > 1000 || remaining.includes('}');
  
  if (shouldDebug) {
    console.log('🔍 DEBUG: tryExtractJsonObjects buffer preview:', {
      length: remaining.length,
      startsWithArray: remaining.startsWith('['),
      endsWithArray: remaining.endsWith(']'),
      preview: remaining.substring(0, 200) + (remaining.length > 200 ? '...' : ''),
      lastChars: remaining.slice(-50)
    });
  }

  // Strategy 1: Try to parse the entire buffer as a complete JSON array
  if (remaining.startsWith('[') && remaining.endsWith(']')) {
    try {
      const parsed = JSON.parse(remaining);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✅ DEBUG: Successfully parsed complete JSON array with', parsed.length, 'items');
        extracted.push(...parsed);
        return { extracted, remaining: '' };
      }
    } catch (e) {
      console.log('⚠️ DEBUG: Failed to parse complete array:', e.message);
    }
  }

  // Strategy 2: Look for complete JSON objects within the buffer
  // Use a more robust regex that handles nested objects and arrays
  let objStart = 0;
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < remaining.length; i++) {
    const char = remaining[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === '{') {
      if (braceCount === 0) {
        objStart = i;
      }
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount === 0) {
        // Found a complete object
        const jsonText = remaining.substring(objStart, i + 1);
        try {
          const parsed = JSON.parse(jsonText);
          if (parsed && typeof parsed === 'object' && parsed.title && parsed.company) {
            console.log('✅ DEBUG: Extracted valid job object:', { title: parsed.title, company: parsed.company });
            extracted.push(parsed);
          }
        } catch (e) {
          console.log('⚠️ DEBUG: Failed to parse object:', jsonText.substring(0, 100), e.message);
        }
      }
    }
  }

  // Strategy 3: If we found objects, remove them from the buffer
  if (extracted.length > 0) {
    // For simplicity, if we extracted objects, clear most of the buffer
    // but keep the last part that might be an incomplete object
    const lastBraceIndex = remaining.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
      remaining = remaining.substring(lastBraceIndex + 1);
    }
  }

  console.log('📊 DEBUG: Extraction result:', {
    extractedCount: extracted.length,
    remainingLength: remaining.length,
    jobTitles: extracted.map(job => job?.title).filter(Boolean)
  });

  return { extracted, remaining };
}

// Normalize job object to ensure all required fields are present
function normalizeJobObject(rawJob: any): JobPosting {
  console.log('🔧 DEBUG: Normalizing job object:', { 
    title: rawJob?.title, 
    company: rawJob?.company, 
    location: rawJob?.location,
    hasDescription: !!rawJob?.description,
    hasLink: !!rawJob?.link
  });
  
  const normalized: JobPosting = {
    title: rawJob.title || 'Unknown Title',
    company: rawJob.company || 'Unknown Company',
    location: rawJob.location || 'Unknown Location',
    link: rawJob.link || rawJob.applyUrl || '#',
    description: rawJob.description || 'No description available',
    salary: rawJob.salary,
    skills: Array.isArray(rawJob.skills) ? rawJob.skills : undefined,
    software: Array.isArray(rawJob.software) ? rawJob.software : undefined,
    workingHours: rawJob.workingHours
  };
  
  console.log('✅ DEBUG: Job normalized:', {
    title: normalized.title,
    company: normalized.company,
    location: normalized.location
  });
  
  return normalized;
}

// Build a strong, guidance prompt instructing the model to only output JSON array of job objects
function buildPrompt(snapshot: { url: string; pageTitle: string; metaDescription: string; text: string; links: any[] }) {
  // We instruct the model: JSON array only. Each job object should have fields:
  // title, company, location, link, description, salary (optional), skills (optional array), software (optional array), workingHours
  // If the model decides a link should be clicked to get more details, it should include `needsClick: true` and `clickLink: "https://..."`.
  // But for now we prioritize detecting jobs on the provided snapshot and extracting the final details.
  const prompt = `
You are an expert job posting extractor. Given the page contents and links below, extract up to 50 job listings found on the page.
OUTPUT RULES (must follow strictly):
- Return ONLY a single JSON array (no explanation, no markdown).
- Each array item must be an object with at least: "title", "company", "location", "link", "description".
- Optional fields that may appear: "salary", "skills" (array of strings), "software" (array of strings), "workingHours".
- If a job is only visible behind a link that needs clicking for more detail, include {"needsClick": true, "clickLink": "<URL>"} for that item. Otherwise omit those keys.
- The "link" field should be an absolute URL to the job or the listing anchor.
- Keep descriptions concise (1-3 short paragraphs). Do not include HTML tags.
- If you cannot find any jobs, return an empty array: [].

PAGE DATA:
URL: ${snapshot.url}
TITLE: ${snapshot.pageTitle}
META: ${snapshot.metaDescription}
TEXT: ${snapshot.text.slice(0, 100000)}   // long text truncated to safe size
LINKS:
${snapshot.links.slice(0, 200).map((l: any) => `${l.text} -> ${l.href}`).join('\n')}

Return only the JSON array now.
`;
  return prompt;
}

// Main discovery flow: receives snapshot and streams model responses
// --- REPLACE the entire discoveryWithPromptAPI() with this ---
async function discoveryWithPromptAPI(snapshot: any, maxJobs = 5, tabId?: number) {
  console.log('🚀 DEBUG: discoveryWithPromptAPI started');
  console.log('🔍 DEBUG: Input snapshot:', {
    url: snapshot?.url,
    textLength: snapshot?.text?.length,
    linksCount: snapshot?.links?.length
  });
  console.log('🔍 DEBUG: maxJobs:', maxJobs);
  console.log('🔍 DEBUG: tabId:', tabId);
  
  // Cancel any existing analysis first
  if (isAnalyzing) {
    console.log('⚠️ DEBUG: Cancelling existing analysis before starting new one');
    cancelActiveAnalysis('New analysis requested');
    // Wait a bit for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Set analysis state
  isAnalyzing = true;
  currentTabId = tabId || null;
  
  if (typeof LanguageModel === 'undefined') {
    const err = 'LanguageModel (Prompt API) is not available in this context.';
    console.error('❌ DEBUG:', err);
    if (currentPopupPort) currentPopupPort.postMessage({ type: 'analysis_error', error: err, isComplete: true });
    isAnalyzing = false;
    currentTabId = null;
    return Promise.reject(new Error(err));
  }
  console.log('✅ DEBUG: LanguageModel is available');

  try {
    console.log('🔍 DEBUG: Checking LanguageModel availability...');
    const available = await LanguageModel.availability();
    console.log('🔍 DEBUG: LanguageModel availability result:', available);
    if (available === 'unavailable') {
      const msg = 'Prompt model unavailable on this device';
      console.error('❌ DEBUG:', msg);
      if (currentPopupPort) currentPopupPort.postMessage({ type: 'analysis_error', error: msg, isComplete: true });
      isAnalyzing = false;
      currentTabId = null;
      return Promise.reject(new Error(msg));
    }
    console.log('✅ DEBUG: Model availability confirmed, creating session...');

    const session = await LanguageModel.create();
    activeSession = session; // Store reference for cancellation
    console.log('✅ DEBUG: LanguageModel session created successfully');

    const prompt = buildPrompt(snapshot);
    console.log('📝 DEBUG: Prompt built, length:', prompt.length);
    console.log('🔍 DEBUG: Prompt preview:', prompt.substring(0, 500) + '...');
    
    const stream = session.promptStreaming(prompt);
    console.log('🌊 DEBUG: Streaming started...');

    let buffer = '';
    let batchNumber = 0;
    let chunkCount = 0;
    let totalJobsStored = (await storageGet(['gemscout_jobs'])).gemscout_jobs?.length || 0;
    console.log('📊 DEBUG: Initial stored jobs count:', totalJobsStored);

    if (currentPopupPort) {
      currentPopupPort.postMessage({ type: 'analysis_status', message: 'Analyzing page...', isComplete: false });
      console.log('📨 DEBUG: Sent analysis_status to popup');
    }

    // ⚡ Incremental streaming: receive partial text as soon as it's generated
    console.log('🔄 DEBUG: Starting stream processing loop...');
    for await (const chunk of stream) {
      // Check if analysis was cancelled
      if (!isAnalyzing || activeSession !== session) {
        console.log('⚠️ DEBUG: Analysis cancelled, breaking stream loop');
        break;
      }
      
      chunkCount++;
      if (!chunk) {
        console.log(`⚠️ DEBUG: Chunk ${chunkCount} is empty, skipping`);
        continue;
      }

      // Each chunk may contain partial text output
      const delta =
        typeof chunk === 'string'
          ? chunk
          : chunk?.text ?? chunk?.content ?? JSON.stringify(chunk);
      
      // Only log every 100th chunk to reduce noise
      if (chunkCount % 100 === 0) {
        console.log(`📦 DEBUG: Chunk ${chunkCount} received:`, {
          type: typeof chunk,
          deltaLength: delta?.length,
          deltaPreview: delta?.substring(0, 100)
        });
      }

      buffer += delta;
      // Only log buffer size changes when significant or contains complete objects
      if (chunkCount % 500 === 0 || buffer.includes('}')) {
        console.log(`📋 DEBUG: Buffer updated, total length:`, buffer.length);
      }

      // Try extracting valid JSON fragments (arrays or objects)
      const { extracted, remaining } = tryExtractJsonObjects(buffer);
      console.log(`⚙️ DEBUG: JSON extraction attempt:`, {
        extractedCount: extracted.length,
        remainingLength: remaining.length
      });
      buffer = remaining;

      if (extracted.length) {
        console.log(`✨ DEBUG: Found ${extracted.length} JSON objects to process`);
        console.log(`🔍 DEBUG: Extracted objects preview:`, extracted.map(e => ({ 
          type: Array.isArray(e) ? 'array' : typeof e, 
          title: e?.title, 
          length: Array.isArray(e) ? e.length : undefined 
        })));
        const jobsToPublish: JobPosting[] = [];

        for (const item of extracted) {
          if (!item) continue;

          if (Array.isArray(item)) {
            for (const j of item) if (j.title && j.company) jobsToPublish.push(normalizeJobObject(j));
          } else if (item.title && item.company) {
            jobsToPublish.push(normalizeJobObject(item));
          } else if (item.jobs && Array.isArray(item.jobs)) {
            for (const j of item.jobs) if (j.title && j.company) jobsToPublish.push(normalizeJobObject(j));
          }
        }

        if (jobsToPublish.length) {
          batchNumber += 1;
          console.log(`💾 DEBUG: Publishing ${jobsToPublish.length} jobs (batch ${batchNumber})`);

          const newTotal = await appendJobsToStorage(jobsToPublish);
          totalJobsStored = newTotal > 0 ? newTotal : totalJobsStored;
          console.log(`📊 DEBUG: Jobs stored successfully, new total:`, totalJobsStored);

          // Push live updates to popup
          if (currentPopupPort) {
            currentPopupPort.postMessage({
              type: 'jobs_update',
              count: totalJobsStored,
              jobs: jobsToPublish,
              batchNumber,
              isComplete: false,
            });
            console.log(`📨 DEBUG: Sent jobs_update to popup (batch ${batchNumber}, ${jobsToPublish.length} jobs)`);
          }
        } else {
          console.log(`🚫 DEBUG: No valid jobs to publish from this extraction`);
        }
      }
    }
    console.log(`🏁 DEBUG: Stream processing completed, total chunks: ${chunkCount}`);

    // 🧹 Final flush after stream ends
    console.log(`🧹 DEBUG: Final flush - buffer length: ${buffer.length}`);
    const { extracted: finalExtracted } = tryExtractJsonObjects(buffer);
    console.log(`🔍 DEBUG: Final extraction yielded ${finalExtracted.length} objects`);
    
    if (finalExtracted.length) {
      const finalJobs = finalExtracted
        .flat()
        .filter((j) => j.title && j.company)
        .map(normalizeJobObject);
      
      console.log(`✨ DEBUG: Final jobs after filtering: ${finalJobs.length}`);

      if (finalJobs.length) {
        await appendJobsToStorage(finalJobs);
        console.log(`💾 DEBUG: Final jobs stored successfully`);
        if (currentPopupPort) {
          currentPopupPort.postMessage({
            type: 'jobs_update',
            count: totalJobsStored + finalJobs.length,
            jobs: finalJobs,
            batchNumber: batchNumber + 1,
            isComplete: false,
          });
          console.log(`📨 DEBUG: Sent final jobs_update to popup`);
        }
      }
    }

    // ✅ Done — notify popup
    console.log(`✅ DEBUG: Analysis complete, sending final completion message`);
    if (currentPopupPort) {
      currentPopupPort.postMessage({
        type: 'jobs_update',
        count: totalJobsStored,
        jobs: [],
        batchNumber,
        isComplete: true,
      });
      console.log(`🏁 DEBUG: Sent completion message to popup`);
    }

    console.log(`🗑️ DEBUG: Destroying LanguageModel session...`);
    
    // Only destroy if this is still the active session
    if (activeSession === session) {
      await session.destroy();
      activeSession = null;
      isAnalyzing = false;
      currentTabId = null;
      console.log(`✅ DEBUG: Session destroyed, discoveryWithPromptAPI completed successfully`);
    } else {
      console.log(`🔄 DEBUG: Session was already replaced, skipping cleanup`);
    }
  } catch (err: any) {
    // Reset state on error
    console.error(`❌ DEBUG: Error in discoveryWithPromptAPI:`, err);
    
    // Clean up state regardless of session status
    if (activeSession) {
      try {
        await activeSession.destroy();
        console.log('🗑️ DEBUG: Cleaned up session after error');
      } catch (destroyError) {
        console.log('⚠️ DEBUG: Error destroying session:', destroyError);
      }
    }
    
    activeSession = null;
    isAnalyzing = false;
    currentTabId = null;
    
    console.error('discoveryWithPromptAPI error:', err);
    if (currentPopupPort) {
      currentPopupPort.postMessage({
        type: 'analysis_error',
        error: err?.message || String(err),
        isComplete: true,
      });
    }
    
    // Re-throw the error so the promise is rejected
    throw err;
  }
}



// Message listener: handle start_discovery and forwards
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const action = request?.type || request?.action;
  console.log('🔍 DEBUG: Background received message:', action);
  console.log('🔍 DEBUG: Request details:', request);
  console.log('🔍 DEBUG: Sender details:', sender);

  if (action === 'start_discovery') {
    console.log('🚀 DEBUG: Processing start_discovery request...');
    // identify active tab (the popup made this call on user click)
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs?.[0];
      console.log('🔍 DEBUG: Active tab found:', {
        id: activeTab?.id,
        url: activeTab?.url,
        title: activeTab?.title
      });
      
      if (!activeTab || !activeTab.id || !activeTab.url) {
        console.error('❌ DEBUG: No active tab found');
        sendResponse({ success: false, error: 'No active tab found' });
        return;
      }

      // guard against chrome internals
      if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
        console.error('❌ DEBUG: Cannot run on internal pages:', activeTab.url);
        sendResponse({ success: false, error: 'Cannot run on internal pages' });
        return;
      }

      console.log('📤 DEBUG: Requesting snapshot from content script...');
      
      // Check if we can inject scripts on this page
      try {
        // Test if content script is already responsive
        const testResponse = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 500); // 500ms timeout
          chrome.tabs.sendMessage(activeTab.id, { action: 'ping' }, (response) => {
            clearTimeout(timeout);
            resolve(response);
          });
        });
        
        if (testResponse) {
          console.log('✅ DEBUG: Content script already responsive');
        } else {
          console.log('🔄 DEBUG: Content script not responsive, injecting...');
          await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ['content/contentScript.js']
          });
          console.log('✅ DEBUG: Content script injection completed');
          
          // Wait for script to initialize
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (injectionError) {
        console.error('❌ DEBUG: Content script injection failed:', injectionError);
        sendResponse({ 
          success: false, 
          error: 'Cannot access this page. Please try on a different website or refresh the page.' 
        });
        return;
      }
      
      // Ask content script for snapshot
      chrome.tabs.sendMessage(activeTab.id, { action: 'extract_snapshot' }, async (snapshotResponse) => {
        if (chrome.runtime.lastError) {
          console.error('❌ DEBUG: Error getting snapshot:', chrome.runtime.lastError.message);
          
          // Try alternative approach - inject script and try again
          try {
            console.log('🔄 DEBUG: Retrying with script re-injection...');
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['content/contentScript.js']
            });
            
            // Wait and try again
            await new Promise(resolve => setTimeout(resolve, 200));
            
            chrome.tabs.sendMessage(activeTab.id, { action: 'extract_snapshot' }, (retryResponse) => {
              if (chrome.runtime.lastError || !retryResponse) {
                console.error('❌ DEBUG: Retry also failed:', chrome.runtime.lastError?.message);
                sendResponse({ 
                  success: false, 
                  error: 'Content script not responding. Please refresh the page and try again.' 
                });
                return;
              }
              
              console.log('✅ DEBUG: Retry successful, got snapshot');
              proceedWithSnapshot(retryResponse);
            });
            return;
            
          } catch (retryError) {
            console.error('❌ DEBUG: Script injection retry failed:', retryError);
            sendResponse({ 
              success: false, 
              error: 'Cannot inject content script. Page may not support extensions.' 
            });
            return;
          }
        }
        
        proceedWithSnapshot(snapshotResponse);
      });
      
      // Helper function to process snapshot
      function proceedWithSnapshot(snapshotResponse: any) {
        if (!snapshotResponse) {
          console.error('❌ DEBUG: Snapshot response empty');
          sendResponse({ success: false, error: 'Snapshot response empty' });
          return;
        }

        console.log('✅ DEBUG: Snapshot received:', {
          url: snapshotResponse.url,
          textLength: snapshotResponse.text?.length,
          linksCount: snapshotResponse.links?.length
        });

        console.log('📤 DEBUG: Sending success response to popup...');
        sendResponse({ success: true, message: 'Streaming analysis started - jobs will appear as they are found', streaming: true });

        // start background discovery without blocking the response channel
        const maxJobs = request.maxJobs || 5;
        console.log('🤖 DEBUG: Starting discoveryWithPromptAPI with maxJobs:', maxJobs);
        
        try {
          const discoveryPromise = discoveryWithPromptAPI(snapshotResponse, maxJobs, activeTab.id);
          if (discoveryPromise && typeof discoveryPromise.catch === 'function') {
            discoveryPromise.catch((e) => {
              console.error('❌ DEBUG: discovery failed:', e);
            });
          } else {
            console.warn('⚠️ DEBUG: discoveryWithPromptAPI did not return a promise');
          }
        } catch (e) {
          console.error('❌ DEBUG: Error starting discovery:', e);
        }
      }
    });

    // indicate async response
    return true;
  }

  // For other messages, let content script handle
  if (action === 'TOGGLE_OVERLAY') {
    // forward to tab where the message originated (sender.tab)
    if (sender.tab?.id) {
      chrome.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_OVERLAY' }, (res) => {
        sendResponse(res || { success: false });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'No sender tab available' });
    }
    return false;
  }

  // Unknown message
  sendResponse({ success: false, error: 'Unknown action' });
  return false;
});
