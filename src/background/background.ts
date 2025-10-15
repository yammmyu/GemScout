// Background service worker for GemScout Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('GemScout extension installed')
  
  // Initialize default settings
  chrome.storage.sync.get(['gemscout_settings'], (result) => {
    if (!result.gemscout_settings) {
      const defaultSettings = {
        autoAnalyze: true,
        showOverlay: true,
        jobSites: ['linkedin.com', 'indeed.com', 'glassdoor.com'],
        matchThreshold: 70,
        notifications: true
      }
      chrome.storage.sync.set({ gemscout_settings: defaultSettings })
      console.log('Default settings initialized')
    }
  })
})

// Handle extension icon click - no longer opens side panel, just opens popup
chrome.action.onClicked.addListener((tab) => {
  // The popup will open automatically when the icon is clicked
  console.log('Extension icon clicked for tab:', tab.url)
})

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request)
  
  switch (request.type) {
    case 'PAGE_ANALYZED':
      // Handle page analysis results from content script
      console.log('Page analyzed:', request.data)
      
      // Store analysis results
      chrome.storage.local.get(['page_analyses'], (result) => {
        const analyses = result.page_analyses || []
        analyses.unshift({
          ...request.data,
          timestamp: Date.now(),
          tabId: sender.tab?.id
        })
        
        // Keep only last 50 analyses
        if (analyses.length > 50) {
          analyses.splice(50)
        }
        
        chrome.storage.local.set({ page_analyses: analyses })
      })
      
      // Show notification if enabled
      chrome.storage.sync.get(['gemscout_settings'], (result) => {
        const settings = result.gemscout_settings
        if (settings?.notifications && request.data.jobIndicators) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon-48.png',
            title: 'GemScout',
            message: 'Job opportunities detected on this page!'
          })
        }
      })
      
      sendResponse({ success: true })
      break
    
    case 'GET_ANALYSES':
      // Return stored page analyses
      chrome.storage.local.get(['page_analyses'], (result) => {
        sendResponse({ success: true, analyses: result.page_analyses || [] })
      })
      return true // Keep the response channel open for async response
    
    case 'CLEAR_ANALYSES':
      // Clear stored analyses
      chrome.storage.local.remove(['page_analyses'], () => {
        sendResponse({ success: true })
      })
      return true
    
    case 'TOGGLE_OVERLAY':
      // Forward to content script
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_OVERLAY' }, (response) => {
          sendResponse(response || { success: false, error: 'No response from content script' })
        })
        return true
      }
      break
    
    case 'ANALYZE_CURRENT_TAB':
      // Request analysis of the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'ANALYZE_PAGE' }, (response) => {
            sendResponse(response || { success: false, error: 'No response from content script' })
          })
        } else {
          sendResponse({ success: false, error: 'No active tab found' })
        }
      })
      return true
    
    case 'start_discovery':
      // Handle discovery request from popup
      console.log('Starting discovery process...')
      console.log('Max jobs requested:', request.maxJobs || 5)
      
      // Identify the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id && tabs[0]?.url) {
          const activeTab = tabs[0]
          console.log('Active tab identified:', activeTab.url)
          
          // Check if the current tab is a Chrome internal page
          if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || activeTab.url.startsWith('moz-extension://')) {
            console.error('Cannot run content script on Chrome internal pages:', activeTab.url)
            sendResponse({ 
              success: false, 
              error: 'Content scripts cannot run on Chrome internal pages. Please navigate to a regular webpage (http:// or https://) and try again.' 
            })
            return
          }
          
          // First, try to inject the content script if it's not already running
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              // Check if our content script is already loaded
              return typeof (window as any).gemscoutLoaded !== 'undefined'
            }
          }, (injectionResults) => {
            const isContentScriptLoaded = injectionResults?.[0]?.result === true
            
            if (!isContentScriptLoaded) {
              console.log('Content script not detected, injecting...')
              // Inject the content script
              chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content/contentScript.js']
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Failed to inject content script:', chrome.runtime.lastError.message)
                  sendResponse({ success: false, error: 'Failed to inject content script: ' + chrome.runtime.lastError.message })
                  return
                }
                
                // Wait a moment for the script to initialize, then send message
                setTimeout(() => {
                  sendSnapshotMessage(activeTab.id!, sendResponse, request.maxJobs)
                }, 100)
              })
            } else {
              console.log('Content script already loaded, sending message directly')
              sendSnapshotMessage(activeTab.id!, sendResponse, request.maxJobs)
            }
          })
        } else {
          console.error('No active tab found')
          sendResponse({ success: false, error: 'No active tab found' })
        }
      })
      return true // Keep the response channel open for async response
    
    default:
      console.log('Unknown message type:', request.type)
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

// Interface for job data structure
interface JobPosting {
  title: string
  company: string
  location: string
  link: string
  description: string
}

// Function to analyze DOM snapshot with AI and extract job postings
async function analyzeJobPostingsWithAI(snapshot: { url: string; text: string; links: Array<{ href: string; text: string }> }): Promise<JobPosting[]> {
  try {
    console.log('🤖 Starting AI analysis for job postings...')
    
    // Check if Chrome's built-in AI is available in service worker context
    console.log('🔍 Debugging AI availability in service worker...')
    
    const globalScope = self as any
    
    // Extensive debugging
    console.log('Global scope type:', typeof globalScope)
    console.log('Available properties on self:', Object.getOwnPropertyNames(globalScope).slice(0, 20))
    
    // Check different possible AI API locations
    const aiChecks = {
      'globalScope.ai': typeof globalScope.ai,
      'globalScope.chrome?.ai': typeof globalScope.chrome?.ai,
      'chrome.ai': typeof (globalThis as any).chrome?.ai,
      'ai': typeof (globalThis as any).ai,
      'self.ai': typeof (self as any).ai
    }
    
    console.log('AI API availability checks:', aiChecks)
    
    // Try different access patterns
    let aiApi = null
    if (globalScope.ai?.languageModel) {
      aiApi = globalScope.ai
      console.log('✅ Found AI API at globalScope.ai')
    } else if (globalScope.chrome?.ai?.languageModel) {
      aiApi = globalScope.chrome.ai
      console.log('✅ Found AI API at globalScope.chrome.ai')
    } else if ((globalThis as any).ai?.languageModel) {
      aiApi = (globalThis as any).ai
      console.log('✅ Found AI API at globalThis.ai')
    }
    
    if (!aiApi) {
      console.warn('🚫 Chrome built-in AI not found in service worker context')
      console.log('This might be because:')
      console.log('1. AI API is not available in service workers yet')
      console.log('2. Model needs to be downloaded first')
      console.log('3. API is only available in main thread context')
      return generateMockJobData(snapshot)
    }
    
    console.log('🔍 AI API found, checking capabilities...')
    
    try {
      // Check AI capabilities with detailed logging
      console.log('📊 Checking AI capabilities...')
      console.log('AI API object:', aiApi)
      console.log('Language model available:', typeof aiApi.languageModel)
      
      const capabilities = await aiApi.languageModel.capabilities()
      console.log('Full AI capabilities object:', JSON.stringify(capabilities, null, 2))
      
      // Log all possible states
      const availableStates = ['readily', 'after-download', 'no']
      console.log(`Available state: "${capabilities.available}" (expected: one of ${availableStates.join(', ')})`)
      
      if (capabilities.available === 'no') {
        console.warn('🚫 AI explicitly not available')
        return generateMockJobData(snapshot)
      }
      
      if (capabilities.available === 'after-download') {
        console.warn('⬇️  AI available after download - model needs to be downloaded first')
        console.log('This typically requires user interaction in the main thread context')
        console.log('The model download must be triggered from a user-facing context (like popup or content script)')
        return generateMockJobData(snapshot)
      }
      
      if (capabilities.available !== 'readily') {
        console.warn(`🚫 AI not ready: "${capabilities.available}" (unknown state)`)
        return generateMockJobData(snapshot)
      }
      
      console.log('✅ AI is readily available, creating session...')
      
      // Create AI session
      const session = await aiApi.languageModel.create()
      
      // Create a simple prompt for job extraction
      const prompt = `You are a job posting extraction assistant. Analyze this webpage content and extract job listings.

URL: ${snapshot.url}

Content (first 2000 chars):
${snapshot.text.substring(0, 2000)}

Return a JSON array of job objects with fields: title, company, location, link, description. If no jobs found, return empty array [].

JSON:`
      
      console.log('📝 Sending prompt to AI...')
      
      const response = await session.prompt(prompt)
      console.log('🤖 AI Response received:', response.substring(0, 200) + '...')
      
      // Parse and validate response
      let parsedJobs: JobPosting[] = []
      try {
        // Clean response to extract JSON
        let jsonStr = response.trim()
        
        // Remove any markdown formatting
        jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
        jsonStr = jsonStr.replace(/^[^\[]*/, '').replace(/[^\]]*$/, '')
        
        // Try to find JSON array
        const jsonMatch = jsonStr.match(/\[.*\]/s)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        }
        
        parsedJobs = JSON.parse(jsonStr)
        
        if (!Array.isArray(parsedJobs)) {
          throw new Error('Response is not an array')
        }
        
        // Filter valid jobs
        parsedJobs = parsedJobs.filter((job: any) => {
          return job && 
                 typeof job.title === 'string' && job.title.length > 0 &&
                 typeof job.company === 'string' && job.company.length > 0
        }).map((job: any) => ({
          title: job.title,
          company: job.company,
          location: job.location || 'Location TBD',
          link: job.link || snapshot.url,
          description: job.description || 'Job description not available'
        }))
        
        console.log('✅ AI successfully extracted', parsedJobs.length, 'job postings')
        
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError)
        console.log('Raw response:', response)
        parsedJobs = []
      }
      
      // Cleanup
      await session.destroy()
      
      // If AI found jobs, return them; otherwise fallback to mock data
      if (parsedJobs.length > 0) {
        return parsedJobs
      } else {
        console.log('🎭 AI found no jobs, using mock data fallback')
        return generateMockJobData(snapshot)
      }
      
    } catch (aiError) {
      console.error('❌ AI API error:', aiError)
      return generateMockJobData(snapshot)
    }
    
  } catch (error) {
    console.error('❌ AI analysis completely failed:', error)
    return generateMockJobData(snapshot)
  }
}

// Generate mock job data as fallback
function generateMockJobData(snapshot: { url: string; text: string; links: Array<{ href: string; text: string }> }): JobPosting[] {
  console.log('🎭 Generating mock job data as fallback')
  
  // Check if the page likely contains job-related content
  const jobKeywords = ['job', 'career', 'position', 'hiring', 'apply', 'engineer', 'developer', 'manager', 'analyst']
  const hasJobContent = jobKeywords.some(keyword => 
    snapshot.text.toLowerCase().includes(keyword) || 
    snapshot.url.toLowerCase().includes(keyword)
  )
  
  if (!hasJobContent) {
    return []
  }
  
  // Extract company name from URL or content
  let companyName = 'Unknown Company'
  try {
    const urlParts = new URL(snapshot.url).hostname.split('.')
    companyName = urlParts[urlParts.length - 2] || 'Unknown Company'
    companyName = companyName.charAt(0).toUpperCase() + companyName.slice(1)
  } catch (e) {
    // Use fallback
  }
  
  return [{
    title: 'Job Opening Detected',
    company: companyName,
    location: 'Location TBD',
    link: snapshot.url,
    description: 'Job posting detected on this page. Full AI analysis not available.'
  }]
}

// Helper function to send snapshot message to content script
function sendSnapshotMessage(tabId: number, sendResponse: (response: any) => void, maxJobs?: number) {
  chrome.tabs.sendMessage(tabId, { action: 'extract_snapshot' }, async (snapshot) => {
    if (chrome.runtime.lastError) {
      console.error('Error communicating with content script:', chrome.runtime.lastError.message || chrome.runtime.lastError)
      sendResponse({ success: false, error: chrome.runtime.lastError.message || 'Failed to communicate with content script' })
      return
    }
    
    if (snapshot && !snapshot.error) {
      console.log('=== DOM SNAPSHOT RECEIVED ===')
      console.log('URL:', snapshot.url)
      console.log('Text Length:', snapshot.text.length)
      console.log('Links Count:', snapshot.links.length)
      console.log('Text Sample (first 200 chars):', snapshot.text.substring(0, 200) + '...')
      console.log('Links Sample (first 5):', snapshot.links.slice(0, 5))
      console.log('=== END SNAPSHOT ===')
      
      try {
        // Delegate AI analysis to content script where AI API is available
        console.log('🚀 Delegating AI job analysis to content script...')
        
        // Send snapshot to content script for AI analysis
        chrome.tabs.sendMessage(tabId, {
          type: 'analyze_with_ai',
          snapshot: snapshot,
          maxJobs: maxJobs || 5 // Default to 5 jobs
        }, async (aiResponse) => {
          let extractedJobs = []
          
          if (chrome.runtime.lastError) {
            console.error('❌ Failed to communicate with content script for AI analysis:', chrome.runtime.lastError.message)
            extractedJobs = generateMockJobData(snapshot)
          } else if (aiResponse?.success && aiResponse.jobs) {
            extractedJobs = aiResponse.jobs
            console.log('✅ AI analysis completed via content script:', extractedJobs.length, 'jobs')
          } else {
            console.error('❌ AI analysis failed in content script:', aiResponse?.error)
            extractedJobs = generateMockJobData(snapshot)
          }
          
          await completeAnalysisAndRespond(snapshot, extractedJobs, tabId, sendResponse)
        })
        
        return // Exit early since we're handling response in callback
        
      } catch (error) {
        console.error('❌ Error setting up AI analysis:', error)
        const extractedJobs = generateMockJobData(snapshot)
        await completeAnalysisAndRespond(snapshot, extractedJobs, tabId, sendResponse)
      }
    } else {
      console.error('Failed to extract snapshot:', snapshot?.error)
      sendResponse({ success: false, error: snapshot?.error || 'No snapshot received' })
    }
  })
}

// Helper function to complete analysis and send response
async function completeAnalysisAndRespond(snapshot: any, extractedJobs: JobPosting[], tabId: number, sendResponse: (response: any) => void) {
  try {
    console.log('📊 AI Analysis Results:')
    console.log('Jobs found:', extractedJobs.length)
    if (extractedJobs.length > 0) {
      console.log('Job details:', extractedJobs)
    }
    
    // Store both the snapshot and extracted jobs
    await chrome.storage.local.set({
      lastSnapshot: {
        ...snapshot,
        timestamp: Date.now(),
        tabId: tabId
      },
      jobs: extractedJobs,
      lastJobAnalysis: {
        timestamp: Date.now(),
        url: snapshot.url,
        jobCount: extractedJobs.length,
        jobs: extractedJobs
      }
    })
    
    console.log('💾 Results stored successfully')
    
    sendResponse({ 
      success: true, 
      snapshot: snapshot,
      jobs: extractedJobs,
      message: `DOM snapshot extracted and analyzed. Found ${extractedJobs.length} job posting(s).`
    })
    
  } catch (error) {
    console.error('❌ Storage or response failed:', error)
    
    // Still try to send a response
    sendResponse({ 
      success: false, 
      error: 'Failed to store results or send response: ' + (error as Error).message
    })
  }
}

// Handle tab updates to potentially auto-analyze new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if auto-analyze is enabled
    chrome.storage.sync.get(['gemscout_settings'], (result) => {
      const settings = result.gemscout_settings
      if (settings?.autoAnalyze) {
        // Check if it's a job site
        const jobSites = settings.jobSites || ['linkedin.com', 'indeed.com', 'glassdoor.com']
        const isJobSite = jobSites.some((site: string) => tab.url?.includes(site))
        
        if (isJobSite) {
          // Wait a bit for the page to load, then trigger analysis
          setTimeout(() => {
            chrome.tabs.sendMessage(tabId, { type: 'ANALYZE_PAGE' })
          }, 2000)
        }
      }
    })
  }
})

// Handle notifications permission
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.sync.get(['gemscout_settings'], (result) => {
    const settings = result.gemscout_settings
    if (settings?.notifications) {
      // Ensure we have notification permission
      chrome.notifications.getPermissionLevel((level) => {
        if (level !== 'granted') {
          console.log('Notification permission not granted')
        }
      })
    }
  })
})

export {}
