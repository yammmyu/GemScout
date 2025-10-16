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

// Storage for streaming job updates
let currentPopupPort: chrome.runtime.Port | null = null

// Listen for popup connections for streaming updates
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name)
  
  if (port.name === 'popup-stream') {
    currentPopupPort = port
    
    port.onDisconnect.addListener(() => {
      console.log('Popup port disconnected')
      currentPopupPort = null
    })
  }
})

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type || request.action)
  
  switch (request.type || request.action) {
    case 'jobs_update':
      // Forward streaming job updates to popup (legacy support)
      if (currentPopupPort && sender.tab) {
        console.log(`📢 Forwarding job update: ${request.count} jobs available`)
        currentPopupPort.postMessage({
          type: 'jobs_update',
          count: request.count,
          jobs: request.jobs
        })
      }
      break
      
    case 'jobs_found':
      // Forward recursive scanning job updates to popup
      if (currentPopupPort && sender.tab) {
        console.log(`📢 Forwarding jobs found: ${request.jobs.length} new jobs (total: ${request.totalJobs})`)
        currentPopupPort.postMessage({
          type: 'jobs_update',
          count: request.totalJobs,
          jobs: request.jobs,
          batchNumber: request.batchNumber,
          isComplete: request.isComplete
        })
      }
      break
      
    case 'analysis_complete':
      // Forward analysis completion to popup
      if (currentPopupPort && sender.tab) {
        console.log(`🏁 Analysis complete: ${request.totalJobs} total jobs found`)
        currentPopupPort.postMessage({
          type: 'jobs_update',
          count: request.totalJobs,
          jobs: [],
          isComplete: true
        })
      }
      break
      
    case 'analysis_error':
      // Forward analysis errors to popup
      if (currentPopupPort && sender.tab) {
        console.log(`❌ Analysis error: ${request.error}`)
        currentPopupPort.postMessage({
          type: 'analysis_error',
          error: request.error,
          isComplete: true
        })
      }
      break
    case 'TOGGLE_OVERLAY':
      // Forward to content script
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, { type: 'TOGGLE_OVERLAY' }, (response) => {
          sendResponse(response || { success: false, error: 'No response from content script' })
        })
        return true
      }
      break
    
    case 'start_discovery':
      // Handle streaming discovery request from popup
      console.log('Starting streaming discovery process...')
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
                
                // Wait a moment for the script to initialize, then start streaming
                setTimeout(() => {
                  startStreamingAnalysis(activeTab.id!, sendResponse, request.maxJobs)
                }, 100)
              })
            } else {
              console.log('Content script already loaded, starting streaming analysis')
              startStreamingAnalysis(activeTab.id!, sendResponse, request.maxJobs)
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

// Start streaming analysis
function startStreamingAnalysis(tabId: number, sendResponse: (response: any) => void, maxJobs: number) {
  console.log('🌊 Starting streaming analysis for tab:', tabId)
  
  // First get snapshot from content script
  chrome.tabs.sendMessage(tabId, { action: 'extract_snapshot' }, (snapshotResponse) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting snapshot:', chrome.runtime.lastError.message)
      sendResponse({ success: false, error: 'Failed to get page snapshot' })
      return
    }
    
    if (!snapshotResponse || snapshotResponse.error) {
      console.error('Snapshot error:', snapshotResponse?.error)
      sendResponse({ success: false, error: snapshotResponse?.error || 'Failed to collect snapshot' })
      return
    }
    
    console.log('✅ Snapshot received, starting streaming analysis...')
    
    // Send streaming analysis request to content script
    chrome.tabs.sendMessage(tabId, { 
      action: 'analyze_with_ai', 
      snapshot: snapshotResponse,
      maxJobs: maxJobs
    }, (analysisResponse) => {
      if (chrome.runtime.lastError) {
        console.error('Analysis error:', chrome.runtime.lastError.message)
        sendResponse({ success: false, error: 'Failed to start analysis' })
        return
      }
      
      console.log('✅ Streaming analysis started successfully')
      sendResponse({ 
        success: true, 
        message: 'Streaming analysis started - jobs will appear as they are found',
        streaming: true
      })
    })
  })
}

// Interface for job data structure
interface JobPosting {
  title: string
  company: string
  location: string
  link: string
  description: string
}






export {}
