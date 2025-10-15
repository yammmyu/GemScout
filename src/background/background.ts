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
                  sendSnapshotMessage(activeTab.id!, sendResponse)
                }, 100)
              })
            } else {
              console.log('Content script already loaded, sending message directly')
              sendSnapshotMessage(activeTab.id!, sendResponse)
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

// Helper function to send snapshot message to content script
function sendSnapshotMessage(tabId: number, sendResponse: (response: any) => void) {
  chrome.tabs.sendMessage(tabId, { action: 'extract_snapshot' }, (snapshot) => {
    if (chrome.runtime.lastError) {
      console.error('Error communicating with content script:', chrome.runtime.lastError.message || chrome.runtime.lastError)
      sendResponse({ success: false, error: chrome.runtime.lastError.message || 'Failed to communicate with content script' })
      return
    }
    
    if (snapshot && !snapshot.error) {
      console.log('=== DOM SNAPSHOT RECEIVED ===');
      console.log('URL:', snapshot.url);
      console.log('Text Length:', snapshot.text.length);
      console.log('Links Count:', snapshot.links.length);
      console.log('Text Sample (first 200 chars):', snapshot.text.substring(0, 200) + '...');
      console.log('Links Sample (first 5):', snapshot.links.slice(0, 5));
      console.log('=== END SNAPSHOT ===');
      
      // Store the snapshot for potential AI processing
      chrome.storage.local.set({
        lastSnapshot: {
          ...snapshot,
          timestamp: Date.now(),
          tabId: tabId
        }
      })
      
      sendResponse({ 
        success: true, 
        snapshot: snapshot,
        message: 'DOM snapshot extracted successfully'
      })
    } else {
      console.error('Failed to extract snapshot:', snapshot?.error)
      sendResponse({ success: false, error: snapshot?.error || 'No snapshot received' })
    }
  })
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
