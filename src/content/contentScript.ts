// Content script for GemScout Chrome Extension

console.log('GemScout content script loaded')

// Set global flag to indicate content script is loaded
;(window as any).gemscoutLoaded = true

let overlayMounted = false
let overlayContainer: HTMLElement | null = null

// Function to inject the overlay
function injectOverlay() {
  if (overlayMounted) return

  // Create container for React overlay
  overlayContainer = document.createElement('div')
  overlayContainer.id = 'gemscout-overlay-root'
  overlayContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2147483647;
    pointer-events: none;
  `
  
  // Create shadow root for style isolation
  const shadowRoot = overlayContainer.attachShadow({ mode: 'open' })
  
  // Create the actual overlay container
  const overlayElement = document.createElement('div')
  overlayElement.style.cssText = 'pointer-events: auto;'
  overlayElement.innerHTML = `
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
  `
  
  shadowRoot.appendChild(overlayElement)
  document.body.appendChild(overlayContainer)
  
  // Add click handler
  const toggleButton = shadowRoot.querySelector('.gemscout-toggle')
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      // For now, just show a simple notification
      showNotification('GemScout: Analyzing page for job opportunities...')
    })
  }
  
  overlayMounted = true
  console.log('GemScout overlay injected')
}

// Function to remove the overlay
function removeOverlay() {
  if (overlayContainer && overlayContainer.parentNode) {
    overlayContainer.parentNode.removeChild(overlayContainer)
    overlayContainer = null
    overlayMounted = false
    console.log('GemScout overlay removed')
  }
}

// Function to show notifications
function showNotification(message: string) {
  // Create a temporary notification
  const notification = document.createElement('div')
  notification.style.cssText = `
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
  `
  notification.textContent = message
  
  document.body.appendChild(notification)
  
  // Fade in
  setTimeout(() => {
    notification.style.opacity = '1'
  }, 10)
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Function to collect DOM snapshot
function collectSnapshot() {
  const snapshot = {
    url: window.location.href,
    text: extractReadableText(),
    links: extractLinks()
  }
  
  console.log('DOM snapshot collected:', { 
    url: snapshot.url, 
    textLength: snapshot.text.length, 
    linksCount: snapshot.links.length 
  })
  
  return snapshot
}

// Extract readable text from the main body of the page
function extractReadableText(): string {
  // Remove script and style elements
  const elementsToRemove = document.querySelectorAll('script, style, noscript, iframe')
  const clonedBody = document.body.cloneNode(true) as HTMLElement
  
  // Remove unwanted elements from the clone
  clonedBody.querySelectorAll('script, style, noscript, iframe').forEach(el => el.remove())
  
  // Get text content and clean it up
  let text = clonedBody.innerText || clonedBody.textContent || ''
  
  // Clean up the text: normalize whitespace, remove extra line breaks
  text = text
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .trim()
  
  return text
}

// Extract all links with both text and valid href
function extractLinks(): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = []
  const linkElements = document.querySelectorAll('a[href]')
  
  linkElements.forEach((link) => {
    const href = link.getAttribute('href')
    const text = link.textContent?.trim()
    
    // Only include links with valid href and non-empty text
    if (href && text && href !== '#' && !href.startsWith('javascript:')) {
      // Convert relative URLs to absolute URLs
      let absoluteHref: string
      try {
        absoluteHref = new URL(href, window.location.href).href
      } catch (e) {
        // If URL construction fails, skip this link
        return
      }
      
      // Avoid duplicate links (same href)
      if (!links.find(l => l.href === absoluteHref)) {
        links.push({
          href: absoluteHref,
          text: text
        })
      }
    }
  })
  
  return links
}

// Function to analyze current page (legacy)
function analyzeCurrentPage() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    description: getPageDescription(),
    keywords: extractKeywords(),
    jobIndicators: detectJobIndicators()
  }
  
  console.log('Page analysis:', pageData)
  return pageData
}

// Get page description from meta tags
function getPageDescription(): string {
  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
  return descriptionMeta?.content || ''
}

// Extract keywords from page content
function extractKeywords(): string[] {
  const text = document.body.innerText.toLowerCase()
  const jobKeywords = [
    'software engineer', 'developer', 'programmer', 'frontend', 'backend',
    'full stack', 'react', 'javascript', 'typescript', 'node.js', 'python',
    'java', 'remote', 'salary', 'benefits', 'apply', 'job', 'career',
    'position', 'role', 'hiring', 'employment'
  ]
  
  return jobKeywords.filter(keyword => text.includes(keyword))
}

// Detect if current page might be a job posting
function detectJobIndicators(): boolean {
  const url = window.location.href.toLowerCase()
  const title = document.title.toLowerCase()
  const content = document.body.innerText.toLowerCase()
  
  const jobSites = ['linkedin.com/jobs', 'indeed.com', 'glassdoor.com', 'stackoverflow.com/jobs']
  const jobKeywords = ['apply', 'salary', 'requirements', 'responsibilities', 'qualifications']
  
  // Check if we're on a known job site
  const isJobSite = jobSites.some(site => url.includes(site))
  
  // Check for job-related keywords in title and content
  const hasJobKeywords = jobKeywords.some(keyword => 
    title.includes(keyword) || content.includes(keyword)
  )
  
  return isJobSite || hasJobKeywords
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request)
  
  // Handle both old 'type' format and new 'action' format
  const messageType = request.type || request.action
  
  switch (messageType) {
    case 'ANALYZE_PAGE':
      const pageData = analyzeCurrentPage()
      sendResponse({ success: true, data: pageData })
      break
      
    case 'extract_snapshot':
      try {
        const snapshot = collectSnapshot()
        console.log('Sending DOM snapshot to background:', {
          url: snapshot.url,
          textLength: snapshot.text.length,
          linksCount: snapshot.links.length
        })
        
        // Ensure we send a proper response
        if (snapshot && snapshot.url && snapshot.text && snapshot.links) {
          console.log('Snapshot validation passed, sending response...')
          sendResponse(snapshot)
        } else {
          console.error('Invalid snapshot data:', snapshot)
          sendResponse({ error: 'Invalid snapshot data collected' })
        }
      } catch (error) {
        console.error('Error collecting snapshot:', error)
        sendResponse({ error: 'Failed to collect snapshot: ' + (error instanceof Error ? error.message : String(error)) })
      }
      break
      
    case 'TOGGLE_OVERLAY':
      if (overlayMounted) {
        removeOverlay()
      } else {
        injectOverlay()
      }
      sendResponse({ success: true, overlayVisible: overlayMounted })
      break
      
    case 'SHOW_NOTIFICATION':
      showNotification(request.message || 'GemScout notification')
      sendResponse({ success: true })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type: ' + messageType })
  }
  
  // Return true to indicate we will send a response asynchronously
  return true
})

// Auto-analyze page if it looks like a job site
if (detectJobIndicators()) {
  console.log('Job indicators detected, auto-analyzing page')
  // Could auto-inject overlay or send analysis to background script
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'PAGE_ANALYZED',
      data: analyzeCurrentPage()
    })
  }, 1000)
}

export {}
