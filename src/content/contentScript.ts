// Content script for GemScout Chrome Extension

console.log('🚀 GemScout content script loaded - VERSION 2.0 WITH ENHANCED AI')
console.log('📅 Build timestamp:', new Date().toISOString())

// Set global flag to indicate content script is loaded
;(window as any).gemscoutLoaded = true
;(window as any).gemscoutVersion = '2.0-enhanced'

// Import AI test for debugging
import { testAIInContentScript } from './aiTest'

// Interface for job data structure
interface JobPosting {
  title: string
  company: string
  location: string
  link: string
  description: string
  salary?: string
}

// Run AI test after a short delay
setTimeout(() => {
  testAIInContentScript().catch(error => {
    console.error('AI test in content script failed:', error)
  })
}, 2000) // Wait for page to fully initialize

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

// Function to collect DOM snapshot with enhanced job data extraction
function collectSnapshot() {
  const snapshot = {
    url: window.location.href,
    text: extractReadableText(),
    links: extractAllLinks(),
    htmlStructure: extractHTMLStructure(),
    pageTitle: document.title,
    metaDescription: getPageDescription()
  }
  
  console.log('DOM snapshot collected:', { 
    url: snapshot.url, 
    textLength: snapshot.text.length, 
    linksCount: snapshot.links.length,
    htmlBlocks: snapshot.htmlStructure.length
  })
  
  console.log('📄 Pure content snapshot ready for AI analysis')
  
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

// Extract ALL links with text for AI analysis (no filtering)
function extractAllLinks(): Array<{ href: string; text: string; context?: string }> {
  const links: Array<{ href: string; text: string; context?: string }> = []
  const linkElements = document.querySelectorAll('a[href]')
  
  linkElements.forEach((link) => {
    const href = link.getAttribute('href')
    const text = link.textContent?.trim()
    
    // Include all valid links, let AI decide what's relevant
    if (href && text && href !== '#' && !href.startsWith('javascript:')) {
      // Convert relative URLs to absolute URLs
      let absoluteHref: string
      try {
        absoluteHref = new URL(href, window.location.href).href
      } catch (e) {
        return // Skip invalid URLs
      }
      
      // Get surrounding context for AI
      const parentElement = link.parentElement
      const context = parentElement ? parentElement.textContent?.trim().substring(0, 200) : ''
      
      // Avoid exact duplicates only
      if (!links.find(l => l.href === absoluteHref && l.text === text)) {
        links.push({
          href: absoluteHref,
          text: text,
          context: context
        })
      }
    }
  })
  
  return links.slice(0, 50) // Limit to prevent overwhelming AI
}

// Extract HTML structure for AI analysis (no keyword assumptions)
function extractHTMLStructure(): Array<{ tag: string; text: string; attributes: Record<string, string>; children: number }> {
  const structure: Array<{ tag: string; text: string; attributes: Record<string, string>; children: number }> = []
  
  // Get all potentially meaningful elements
  const elements = document.querySelectorAll('div, article, section, li, h1, h2, h3, h4, h5, h6, p, span, a')
  
  elements.forEach((element, index) => {
    // Skip if too deep in nesting or if it's a tiny element
    if (index > 200) return // Limit to prevent overwhelming AI
    
    const text = element.textContent?.trim()
    if (!text || text.length < 10) return // Skip empty or very short elements
    
    // Get meaningful attributes
    const attributes: Record<string, string> = {}
    if (element.id) attributes.id = element.id
    if (element.className) attributes.class = element.className
    
    // Count direct children
    const childrenCount = element.children.length
    
    structure.push({
      tag: element.tagName.toLowerCase(),
      text: text.substring(0, 300), // Limit text length
      attributes: attributes,
      children: childrenCount
    })
  })
  
  return structure
}

// Pure content analysis - no keyword assumptions
function analyzeCurrentPage() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    description: getPageDescription(),
    contentLength: document.body.innerText.length,
    linkCount: document.querySelectorAll('a[href]').length
  }
  
  console.log('Basic page data (AI will determine relevance):', pageData)
  return pageData
}

// Get page description from meta tags
function getPageDescription(): string {
  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
  return descriptionMeta?.content || ''
}

// Let AI determine page relevance - no keyword assumptions

// Function to analyze job postings using AI in content script context
async function analyzeJobPostingsInContentScript(snapshot: { url: string; text: string; links: Array<{ href: string; text: string }> }, maxJobs: number = 5): Promise<JobPosting[]> {
  try {
    console.log('🤖 Starting AI analysis in content script context...')
    
    // Check if Chrome's built-in AI is available in content script (window context)
    const windowScope = window as any
    
    console.log('🔍 Checking AI availability in content script...')
    const aiChecks = {
      'window.ai': typeof windowScope.ai,
      'window.chrome?.ai': typeof windowScope.chrome?.ai,
      'globalThis.ai': typeof (globalThis as any).ai,
      // New Chrome built-in AI APIs
      'window.LanguageModel': typeof windowScope.LanguageModel,
      'globalThis.LanguageModel': typeof (globalThis as any).LanguageModel
    }
    
    console.log('AI API availability in content script:', aiChecks)
    
    // Try to find the AI API - prioritize newer Chrome built-in APIs
    let aiApi = null
    let apiLocation = ''
    let isNewAPI = false
    
    // Check newer LanguageModel API first
    if (windowScope.LanguageModel) {
      aiApi = windowScope.LanguageModel
      apiLocation = 'window.LanguageModel'
      isNewAPI = true
      console.log('✅ Found NEW LanguageModel API at window.LanguageModel')
    } else if ((globalThis as any).LanguageModel) {
      aiApi = (globalThis as any).LanguageModel
      apiLocation = 'globalThis.LanguageModel'
      isNewAPI = true
      console.log('✅ Found NEW LanguageModel API at globalThis.LanguageModel')
    }
    // Fallback to legacy AI API
    else if (windowScope.ai?.languageModel) {
      aiApi = windowScope.ai
      apiLocation = 'window.ai'
      isNewAPI = false
      console.log('✅ Found legacy AI API at window.ai')
    } else if (windowScope.chrome?.ai?.languageModel) {
      aiApi = windowScope.chrome.ai
      apiLocation = 'window.chrome.ai'
      isNewAPI = false
      console.log('✅ Found legacy AI API at window.chrome.ai')
    } else if ((globalThis as any).ai?.languageModel) {
      aiApi = (globalThis as any).ai
      apiLocation = 'globalThis.ai'
      isNewAPI = false
      console.log('✅ Found legacy AI API at globalThis.ai')
    }
    
    if (!aiApi) {
      console.warn('🚫 Chrome built-in AI not found in content script context either')
      console.log('Falling back to mock data generation')
      return generateMockJobDataInContentScript(snapshot)
    }
    
    // Check AI capabilities - different methods for new vs legacy API
    console.log('📊 Checking AI capabilities in content script...')
    let capabilities: any
    
    if (isNewAPI) {
      // Use new API format: LanguageModel.availability()
      capabilities = { available: await aiApi.availability() }
      console.log(`NEW API availability at ${apiLocation}:`, capabilities.available)
      
      // Check user activation status
      const userActivation = (navigator as any).userActivation
      if (userActivation) {
        console.log('User activation status:', {
          isActive: userActivation.isActive,
          hasBeenActive: userActivation.hasBeenActive
        })
      }
    } else {
      // Use legacy API format: ai.languageModel.capabilities()
      capabilities = await aiApi.languageModel.capabilities()
      console.log(`Legacy AI capabilities at ${apiLocation}:`, JSON.stringify(capabilities, null, 2))
    }
    
    if (capabilities.available === 'no') {
      console.warn('🚫 AI explicitly not available in content script')
      return generateMockJobDataInContentScript(snapshot)
    }
    
    // Handle different availability states for both API formats
    const availabilityState = capabilities.available
    
    if (availabilityState === 'after-download' || availabilityState === 'downloadable') {
      console.log('📥 AI available after download, attempting to trigger download...')
      // Content script has user context, so model download might work here
      try {
        console.log('🔄 Creating session to trigger model download...')
        const downloadSession = isNewAPI ? await aiApi.create() : await aiApi.languageModel.create()
        console.log('✅ Model download triggered successfully!')
        await downloadSession.destroy()
        
        // Check capabilities again
        const newAvailability = isNewAPI ? await aiApi.availability() : (await aiApi.languageModel.capabilities()).available
        console.log('Updated availability after download:', newAvailability)
        
        if (newAvailability !== 'readily' && newAvailability !== 'available') {
          console.warn('🚫 AI still not ready after download attempt')
          return generateMockJobDataInContentScript(snapshot)
        }
      } catch (downloadError) {
        console.error('❌ Model download failed:', downloadError)
        return generateMockJobDataInContentScript(snapshot)
      }
    }
    
    if (availabilityState !== 'readily' && availabilityState !== 'available') {
      console.warn(`🚫 AI not ready in content script: "${availabilityState}"`)
      return generateMockJobDataInContentScript(snapshot)
    }
    
    console.log('✅ AI is readily available in content script, creating session...')
    
    // Create AI session using appropriate API format
    const session = isNewAPI ? await aiApi.create() : await aiApi.languageModel.create()
    
    // Create AI-driven analysis prompt (no keyword assumptions)
    let prompt = `You are an intelligent webpage analyzer. Your task is to examine this page and determine if it contains employment opportunities, career postings, or hiring information of any kind.

**WEBPAGE CONTENT:**
URL: ${snapshot.url}
Page Title: ${snapshot.pageTitle}
Meta Description: ${snapshot.metaDescription}

**PAGE TEXT CONTENT:**
${snapshot.text.substring(0, 4000)}

**HTML STRUCTURE ELEMENTS:**
${JSON.stringify(snapshot.htmlStructure.slice(0, 20), null, 2)}

**ALL AVAILABLE LINKS:**
${snapshot.links.slice(0, 30).map(link => `- "${link.text}" -> ${link.href} (Context: ${link.context?.substring(0, 100) || 'N/A'})`).join('\n')}

**ANALYSIS INSTRUCTIONS:**
1. First, analyze if this page contains any employment opportunities, career postings, or hiring information
2. Look for patterns in the content that suggest job listings, career opportunities, or recruitment information
3. If you find employment-related content, extract up to ${maxJobs} of the most relevant opportunities
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
If opportunities found, return up to ${maxJobs} items with this structure:
[{
  "title": "What you determine is the opportunity title",
  "company": "Organization or company offering this",
  "location": "Geographic location if determinable",
  "link": "Most specific URL for this opportunity",
  "description": "Your analysis of what this opportunity entails",
  "salary": "Compensation info if visible (optional)"
}]

JSON:`
    
    console.log('📝 Sending prompt to AI from content script...')
    
    const response = await session.prompt(prompt)
    console.log('🤖 AI Response received in content script:', response.substring(0, 200) + '...')
    
    // Parse and validate response with detailed debugging
    let parsedJobs: JobPosting[] = []
    try {
      console.log('🔍 Starting JSON parsing...')
      console.log('Raw AI response (full):', response)
      
      // Clean response to extract JSON
      let jsonStr = response.trim()
      console.log('After trim:', jsonStr.substring(0, 200) + '...')
      
      // Remove any markdown formatting
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      console.log('After markdown removal:', jsonStr.substring(0, 200) + '...')
      
      // More aggressive JSON extraction
      let firstBracket = jsonStr.indexOf('[')
      let lastBracket = jsonStr.lastIndexOf(']')
      
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        jsonStr = jsonStr.substring(firstBracket, lastBracket + 1)
        console.log('Extracted JSON substring:', jsonStr.substring(0, 300) + '...')
      } else {
        console.warn('⚠️ No JSON array brackets found in response')
        // Try to find JSON object and wrap it
        const objectMatch = jsonStr.match(/\{.*\}/s)
        if (objectMatch) {
          jsonStr = '[' + objectMatch[0] + ']'
          console.log('Wrapped single object in array:', jsonStr.substring(0, 200) + '...')
        }
      }
      
      console.log('🧪 Attempting JSON.parse on:', jsonStr.substring(0, 500) + '...')
      parsedJobs = JSON.parse(jsonStr)
      console.log('✅ JSON parsing successful, got:', typeof parsedJobs, 'with length:', parsedJobs?.length)
      
      if (!Array.isArray(parsedJobs)) {
        console.warn('⚠️ Response is not an array, attempting to wrap:', parsedJobs)
        if (typeof parsedJobs === 'object' && parsedJobs !== null) {
          parsedJobs = [parsedJobs]
        } else {
          throw new Error('Response is not an array or object')
        }
      }
      
      console.log('🔍 Pre-filter jobs count:', parsedJobs.length)
      console.log('Sample jobs before filtering:', parsedJobs.slice(0, 2))
      
      // Filter valid jobs
      const validJobs = parsedJobs.filter((job: any) => {
        const isValid = job && 
               typeof job.title === 'string' && job.title.length > 0 &&
               typeof job.company === 'string' && job.company.length > 0
        if (!isValid) {
          console.log('❌ Invalid job filtered out:', job)
        }
        return isValid
      })
      
      console.log('🔍 Valid jobs after filtering:', validJobs.length)
      
      parsedJobs = validJobs.map((job: any) => ({
        title: job.title,
        company: job.company,
        location: job.location || 'Location TBD',
        link: job.link || snapshot.url,
        description: job.description || 'Job description not available',
        ...(job.salary && { salary: job.salary })
      }))
      
      console.log('✅ AI successfully extracted', parsedJobs.length, 'job postings in content script')
      console.log('Final extracted jobs:', parsedJobs)
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed in content script:', parseError)
      console.log('Failed on this text:', jsonStr)
      console.log('Full raw response was:', response)
      parsedJobs = []
    }
    
    // Cleanup
    await session.destroy()
    
    // If AI found jobs, return them; otherwise fallback to mock data
    if (parsedJobs.length > 0) {
      console.log(`✨ SUCCESS: AI extracted ${parsedJobs.length} real jobs, returning them`)
      return parsedJobs
    } else {
      console.warn('🎭 FALLBACK: AI parsing resulted in 0 jobs, falling back to mock data')
      console.log('This could be due to:')
      console.log('1. JSON parsing failed (check logs above)')
      console.log('2. AI returned empty array []')
      console.log('3. All jobs were filtered out as invalid')
      console.log('4. AI response was not in expected format')
      return generateMockJobDataInContentScript(snapshot)
    }
    
  } catch (error) {
    console.error('❌ AI analysis completely failed in content script:', error)
    return generateMockJobDataInContentScript(snapshot)
  }
}

// Generate mock job data in content script
// Breadth-first job discovery system
async function performBreadthFirstJobDiscovery(initialSnapshot: any, maxJobs: number): Promise<{ jobs: JobPosting[], navigationPath: string[], finalUrl: string }> {
  console.log('🔍 Starting breadth-first job discovery...')
  
  const visitedUrls = new Set<string>()
  const navigationPath: string[] = []
  let currentSnapshot = initialSnapshot
  let maxDepth = 3 // Limit navigation depth
  
  for (let depth = 0; depth < maxDepth; depth++) {
    console.log(`🌍 Analyzing page at depth ${depth}: ${currentSnapshot.url}`)
    navigationPath.push(currentSnapshot.url)
    visitedUrls.add(currentSnapshot.url)
    
    // Step 1: Ask AI if current page has job opportunities
    const analysisResult = await analyzePageForJobs(currentSnapshot, maxJobs)
    
    if (analysisResult.hasJobs && analysisResult.jobs.length > 0) {
      console.log(`✅ Found ${analysisResult.jobs.length} jobs at: ${currentSnapshot.url}`)
      return {
        jobs: analysisResult.jobs,
        navigationPath: navigationPath,
        finalUrl: currentSnapshot.url
      }
    }
    
    // Step 2: If no jobs found, ask AI for next navigation targets
    const navigationTargets = await findNavigationTargets(currentSnapshot)
    
    if (navigationTargets.length === 0) {
      console.log('⚠️ No navigation targets found, ending search')
      break
    }
    
    // Step 3: Navigate to the most promising target
    const nextUrl = navigationTargets[0] // AI ranked by relevance
    if (visitedUrls.has(nextUrl)) {
      console.log('🔄 Already visited', nextUrl, 'trying next target...')
      continue
    }
    
    console.log(`🧦 Navigating to: ${nextUrl}`)
    
    try {
      // Fetch and analyze next page
      const nextSnapshot = await fetchPageSnapshot(nextUrl)
      currentSnapshot = nextSnapshot
    } catch (error) {
      console.error('Failed to navigate to:', nextUrl, error)
      break
    }
  }
  
  console.log('🎭 No jobs found after breadth-first search')
  return {
    jobs: [],
    navigationPath: navigationPath,
    finalUrl: currentSnapshot.url
  }
}

// Analyze current page for job opportunities
async function analyzePageForJobs(snapshot: any, maxJobs: number): Promise<{ hasJobs: boolean, jobs: JobPosting[] }> {
  return analyzeJobPostingsInContentScript(snapshot, maxJobs)
    .then(jobs => ({ hasJobs: jobs.length > 0, jobs }))
    .catch(() => ({ hasJobs: false, jobs: [] }))
}

// Find navigation targets using AI
async function findNavigationTargets(snapshot: any): Promise<string[]> {
  try {
    const aiApi = await getAIAPI()
    if (!aiApi) return []
    
    const session = await createAISession(aiApi)
    if (!session) return []
    
    const prompt = `You are a web navigation AI. Analyze this page and find the most likely links that would lead to career/employment/job opportunities.

**CURRENT PAGE:**
URL: ${snapshot.url}
Title: ${snapshot.pageTitle}

**AVAILABLE LINKS (first 20):**
${snapshot.links.slice(0, 20).map((link, i) => `${i + 1}. "${link.text}" -> ${link.href}`).join('\n')}

**PAGE CONTENT (first 2000 chars):**
${snapshot.text.substring(0, 2000)}

**NAVIGATION INSTRUCTIONS:**
1. Identify links that might lead to career pages, job listings, or hiring information
2. Consider text like "Careers", "Jobs", "Work with us", "Join us", "Opportunities", "Hiring", "Team", etc.
3. Also consider company-specific patterns like "About" -> "Careers" or "Company" -> "Jobs"
4. Return URLs in order of likelihood (most promising first)
5. Limit to top 3 most promising URLs

**REQUIRED OUTPUT:**
Return ONLY a JSON array of URLs (no explanations):
["https://company.com/careers", "https://company.com/jobs", "https://company.com/about/team"]

JSON:`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    // Parse AI response
    try {
      let jsonStr = response.trim()
      jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      const urlMatch = jsonStr.match(/\[.*\]/s)
      if (urlMatch) {
        jsonStr = urlMatch[0]
      }
      
      const urls = JSON.parse(jsonStr)
      return Array.isArray(urls) ? urls.slice(0, 3) : []
      
    } catch (parseError) {
      console.error('Failed to parse navigation targets:', parseError)
      return []
    }
    
  } catch (error) {
    console.error('Failed to find navigation targets:', error)
    return []
  }
}

// Fetch snapshot of a new page
async function fetchPageSnapshot(url: string): Promise<any> {
  // For now, we'll simulate navigation by opening the URL
  // In a real implementation, this would fetch the page content
  console.log('🛫 Simulating navigation to:', url)
  
  // Open URL in current tab (user will see the navigation)
  window.location.href = url
  
  // Return a promise that resolves after page loads
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Collect new page snapshot
      const newSnapshot = collectSnapshot()
      resolve(newSnapshot)
    }, 2000) // Wait for page to load
  })
}

// Helper to get AI API
async function getAIAPI(): Promise<any> {
  const windowScope = window as any
  
  if (windowScope.LanguageModel) {
    const availability = await windowScope.LanguageModel.availability()
    if (availability === 'available') {
      return windowScope.LanguageModel
    }
  }
  
  return null
}

// Helper to create AI session
async function createAISession(aiApi: any): Promise<any> {
  try {
    return await aiApi.create()
  } catch (error) {
    console.error('Failed to create AI session:', error)
    return null
  }
}

function generateMockJobDataInContentScript(snapshot: { url: string; text: string; links: Array<{ href: string; text: string }> }): JobPosting[] {
  console.log('🎭 AI analysis unavailable - no fallback assumptions made')
  return []
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
      
    case 'analyze_with_ai':
      // Handle AI analysis with breadth-first navigation
      console.log('🤖 Content script received AI analysis request')
      const maxJobs = request.maxJobs || 5
      performBreadthFirstJobDiscovery(request.snapshot, maxJobs)
        .then(result => {
          console.log('✅ Breadth-first discovery completed:', result)
          sendResponse({ success: true, ...result })
        })
        .catch(error => {
          console.error('❌ Breadth-first discovery failed:', error)
          sendResponse({ success: false, error: error.message })
        })
      return true // Keep response channel open for async response
      
    default:
      sendResponse({ success: false, error: 'Unknown message type: ' + messageType })
  }
  
  // Return true to indicate we will send a response asynchronously
  return true
})

// No auto-analysis based on keywords - let user initiate analysis
console.log('Content script ready - AI will analyze page when requested')

export {}
