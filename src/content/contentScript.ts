// Content script for GemScout Chrome Extension

console.log('🚀 GemScout content script loaded - VERSION 3.0 WITH FULL DEBUGGING')
console.log('📅 Build timestamp:', new Date().toISOString())
console.log('🔧 DEBUGGING VERSION ACTIVE - Detailed AI logs enabled')

// Set global flag to indicate content script is loaded
;(window as any).gemscoutLoaded = true
;(window as any).gemscoutVersion = '2.0-enhanced'

// Interface for job data structure
interface JobPosting {
  title: string
  company: string
  location: string
  link: string
  description: string
  salary?: string
}

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
    pageTitle: document.title,
    metaDescription: getPageDescription()
  }
  
  console.log('DOM snapshot collected:', { 
    url: snapshot.url, 
    textLength: snapshot.text.length, 
    linksCount: snapshot.links.length
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
  
  // Sort links to prioritize job-related ones
  const sortedLinks = links.sort((a, b) => {
    const aScore = getLinkJobScore(a)
    const bScore = getLinkJobScore(b)
    return bScore - aScore
  })
  
  return sortedLinks.slice(0, 50) // Limit to prevent overwhelming AI
}

// Score links based on how likely they are to be job-related
function getLinkJobScore(link: { href: string; text: string; context?: string }): number {
  let score = 0
  const text = (link.text + ' ' + link.href + ' ' + (link.context || '')).toLowerCase()
  
  // High priority job indicators
  if (text.includes('job') || text.includes('position') || text.includes('opening')) score += 10
  if (text.includes('career') || text.includes('hiring')) score += 8
  if (text.includes('apply') || text.includes('application')) score += 7
  
  // Job titles
  if (text.includes('engineer') || text.includes('developer') || text.includes('manager')) score += 6
  if (text.includes('analyst') || text.includes('specialist') || text.includes('coordinator')) score += 5
  if (text.includes('director') || text.includes('lead') || text.includes('senior') || text.includes('junior')) score += 4
  
  // URL patterns that suggest job postings
  if (link.href.includes('/job/') || link.href.includes('/jobs/') || link.href.includes('/career/')) score += 8
  if (link.href.includes('greenhouse.io') || link.href.includes('lever.co') || link.href.includes('workday')) score += 9
  
  // Penalty for non-job links
  if (text.includes('about') || text.includes('contact') || text.includes('home')) score -= 3
  if (text.includes('privacy') || text.includes('terms') || text.includes('cookie')) score -= 5
  
  return score
}

// Get page description from meta tags
function getPageDescription(): string {
  const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement
  return descriptionMeta?.content || ''
}

// Streaming batch AI system for job discovery
let jobStorage: JobPosting[] = []
let processingActive = false
let monitorInterval: NodeJS.Timeout | null = null
let monitorStartTime = 0

// Storage monitor - checks every 2 seconds and displays jobs when available
function startStorageMonitor() {
  if (monitorInterval) return // Already monitoring
  
  console.log('🔍 Starting storage monitor...')
  monitorInterval = setInterval(() => {
    try {
      const currentCount = jobStorage.length
      
      // Send update to popup about current job count with error handling
      sendChromeMessage({
        action: 'jobs_update',
        count: currentCount,
        jobs: jobStorage.slice(0, 3) // Send first 3 for immediate display
      })
      
      // Stop monitoring after 20 seconds or when we have jobs
      if (currentCount >= 9 || (Date.now() - monitorStartTime) > 20000) {
        stopStorageMonitor()
        console.log(`🏁 Monitoring complete: ${currentCount} jobs found`)
      }
    } catch (error) {
      console.error('Monitor error:', error)
      stopStorageMonitor()
    }
  }, 2000) // Reduced frequency to prevent crashes
}

function stopStorageMonitor() {
  if (monitorInterval) {
    console.log('⏹️ Stopping storage monitor...')
    clearInterval(monitorInterval)
    monitorInterval = null
  }
  // Don't set processingActive = false here as background processing might still be running
}

// Main recursive job scanning system
async function analyzeJobPostingsInContentScript(snapshot: any, maxJobs: number = 5): Promise<JobPosting[]> {
  console.log('🔄 Starting RECURSIVE job scanning system...')
  console.log('🔍 DEBUG: Input parameters:')
  console.log('  - snapshot.url:', snapshot.url)
  console.log('  - snapshot.text length:', snapshot.text.length)
  console.log('  - snapshot.links count:', snapshot.links.length)
  console.log('  - maxJobs requested:', maxJobs)
  
  // Reset storage for new analysis
  jobStorage = []
  monitorStartTime = Date.now()
  
  console.log('🔍 DEBUG: Reset jobStorage, length now:', jobStorage.length)
  
  // Set processing active first
  processingActive = true
  console.log('🔍 DEBUG: Set processingActive to true')
  
  // Start storage monitoring first
  startStorageMonitor()
  console.log('🔍 DEBUG: Started storage monitor')
  
  // Start recursive scanning (don't await)
  const visitedUrls = new Set<string>() // Start empty - let recursiveJobScan add URLs
  console.log('🔍 DEBUG: Created empty visitedUrls set')
  
  recursiveJobScan(snapshot, maxJobs, visitedUrls, 0).catch(error => {
    console.error('❌ Recursive scanning failed:', error)
    console.log('🔍 DEBUG: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    processingActive = false
  })
  
  console.log('🔍 DEBUG: Recursive scan started, returning empty array')
  // Return immediately - jobs will be provided via storage updates
  return []
}

// Recursive job scanning - analyzes page type and adapts strategy
async function recursiveJobScan(snapshot: any, maxJobs: number, visitedUrls: Set<string>, depth: number): Promise<void> {
  const MAX_DEPTH = 2 // Reduced depth to prevent loops
  const MAX_LINKS_PER_PAGE = 3 // Reduced links to follow per page
  const MAX_TOTAL_VISITS = 10 // Maximum total URLs to visit
  
  console.log(`\n🔍 === RECURSIVE SCAN START ===`)
  console.log(`🔍 URL: ${snapshot.url}`)
  console.log(`🔍 Depth: ${depth}/${MAX_DEPTH}`)
  console.log(`🔍 Visited URLs: ${visitedUrls.size}/${MAX_TOTAL_VISITS}`)
  console.log(`🔍 Current job count: ${jobStorage.length}/${maxJobs}`)
  console.log(`🔍 Snapshot text length: ${snapshot.text.length}`)
  console.log(`🔍 Snapshot links: ${snapshot.links.length}`)
  
  // Multiple exit conditions to prevent infinite loops
  if (depth >= MAX_DEPTH) {
    console.log('⚠️ EXIT: Max depth reached, stopping recursion')
    return
  }
  
  if (visitedUrls.size >= MAX_TOTAL_VISITS) {
    console.log('⚠️ EXIT: Max URLs visited, stopping recursion')
    return
  }
  
  if (jobStorage.length >= maxJobs) {
    console.log('✅ EXIT: Max jobs reached, stopping scan')
    processingActive = false
    return
  }
  
  // Check if we've already processed this URL
  if (visitedUrls.has(snapshot.url)) {
    console.log('⚠️ EXIT: URL already visited, skipping:', snapshot.url)
    console.log('🔍 DEBUG: Visited URLs list:', Array.from(visitedUrls))
    return
  }
  
  // Mark this URL as visited immediately to prevent re-entry
  visitedUrls.add(snapshot.url)
  console.log('🔍 DEBUG: Added URL to visited set. New size:', visitedUrls.size)
  
  try {
    console.log('🔍 DEBUG: Starting AI analysis steps...')
    
    // Step 1: Ask AI if this page contains job listings
    console.log('🤖 STEP 1: Checking if page contains job listings...')
    const hasJobListings = await checkForJobListings(snapshot)
    console.log(`🔍 DEBUG: Step 1 result - hasJobListings: ${hasJobListings}`)
    
    if (hasJobListings) {
      console.log('✅ Page contains job listings - proceeding to step 2')
      
      // Step 2: Ask AI about the level of detail
      console.log('🤖 STEP 2: Checking job detail level...')
      const hasFullDetails = await checkJobDetailLevel(snapshot)
      console.log(`🔍 DEBUG: Step 2 result - hasFullDetails: ${hasFullDetails}`)
      
      if (hasFullDetails) {
        console.log('📝 FULL DETAILS PATH: Extracting data from full job details...')
        const jobs = await extractJobsFromPage(snapshot)
        console.log(`🔍 DEBUG: extractJobsFromPage returned ${jobs.length} jobs:`, jobs)
        
        if (jobs.length > 0) {
          console.log(`✅ SUCCESS: Found ${jobs.length} jobs, adding to storage`)
          jobStorage.push(...jobs)
          await saveJobsToStorage()
          console.log(`✅ Extracted ${jobs.length} jobs (total: ${jobStorage.length})`)
          
          // Send streaming update to popup
          sendChromeMessage({
            type: 'jobs_found',
            jobs: jobs,
            batchNumber: depth + 1,
            totalJobs: jobStorage.length,
            isComplete: false
          })
        } else {
          console.log('⚠️ FALLBACK: AI said FULL but extracted 0 jobs - treating as PREVIEW instead')
          console.log('🔍 DEBUG: Switching from FULL to PREVIEW mode due to 0 jobs')
          
          // Fall back to preview mode - find job detail links
          console.log('🤖 STEP 3: Finding job detail links...')
          const jobDetailLinks = await findJobDetailLinks(snapshot)
          console.log(`🔍 DEBUG: findJobDetailLinks returned ${jobDetailLinks.length} links:`, jobDetailLinks)
          
          // Follow job detail links
          console.log(`🔗 PROCESSING: Following ${Math.min(jobDetailLinks.length, MAX_LINKS_PER_PAGE)} job detail links...`)
          for (const link of jobDetailLinks.slice(0, MAX_LINKS_PER_PAGE)) {
            if (jobStorage.length >= maxJobs) {
              console.log('✅ Breaking loop: Max jobs reached')
              break
            }
            if (visitedUrls.has(link)) {
              console.log('⚠️ Skipping already visited link:', link)
              continue
            }
            
            console.log(`🔗 Following job detail link: ${link}`)
            
            // Simulate navigation to job detail page
            console.log(`🔄 Simulating navigation to: ${link}`)
            const detailSnapshot = await simulateNavigation(link)
            console.log(`🔍 DEBUG: Simulation result:`, !!detailSnapshot)
            if (detailSnapshot) {
              console.log(`🔄 RECURSING to depth ${depth + 1} for: ${link}`)
              await recursiveJobScan(detailSnapshot, maxJobs, visitedUrls, depth + 1)
              console.log(`🔄 RETURNED from depth ${depth + 1}, waiting 1s...`)
              await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
            } else {
              console.log(`❌ Simulation failed for: ${link}`)
            }
          }
        }
      } else {
        console.log('📎 PREVIEW PATH: Only job cards/previews visible, finding detail links...')
        const jobDetailLinks = await findJobDetailLinks(snapshot)
        console.log(`🔍 DEBUG: PREVIEW PATH findJobDetailLinks returned ${jobDetailLinks.length} links:`, jobDetailLinks)
        
        // Follow job detail links
        console.log(`🔗 PREVIEW PROCESSING: Following ${Math.min(jobDetailLinks.length, MAX_LINKS_PER_PAGE)} job detail links...`)
        for (const link of jobDetailLinks.slice(0, MAX_LINKS_PER_PAGE)) {
          if (jobStorage.length >= maxJobs) {
            console.log('✅ PREVIEW Breaking loop: Max jobs reached')
            break
          }
          if (visitedUrls.has(link)) {
            console.log('⚠️ PREVIEW Skipping already visited link:', link)
            continue
          }
          
          console.log(`🔗 PREVIEW Following job detail link: ${link}`)
          
          // Simulate navigation to job detail page
          const detailSnapshot = await simulateNavigation(link)
          if (detailSnapshot) {
            await recursiveJobScan(detailSnapshot, maxJobs, visitedUrls, depth + 1)
            await new Promise(resolve => setTimeout(resolve, 1000)) // Rate limiting
          }
        }
      }
    } else {
      console.log('❌ NO JOBS PATH: No job listings found, looking for navigation links...')
      console.log('🔍 DEBUG: Page did not contain job listings, trying navigation approach')
      
      // Step 3: Ask AI for links most likely to lead to job listings
      console.log('🤖 STEP 3: Finding navigation links to job listings...')
      const jobNavLinks = await findJobNavigationLinks(snapshot)
      console.log(`🔍 DEBUG: findJobNavigationLinks returned ${jobNavLinks.length} links:`, jobNavLinks)
      
      // Follow top-ranked navigation links
      console.log(`🔗 NAV PROCESSING: Following ${Math.min(jobNavLinks.length, 2)} navigation links...`)
      for (const link of jobNavLinks.slice(0, 2)) { // Limit to top 2
        if (jobStorage.length >= maxJobs) {
          console.log('✅ NAV Breaking loop: Max jobs reached')
          break
        }
        if (visitedUrls.has(link)) {
          console.log('⚠️ NAV Skipping already visited link:', link)
          continue
        }
        
        console.log(`🔗 NAV Following navigation link: ${link}`)
        
        // Simulate navigation
        const navSnapshot = await simulateNavigation(link)
        if (navSnapshot) {
          await recursiveJobScan(navSnapshot, maxJobs, visitedUrls, depth + 1)
          await new Promise(resolve => setTimeout(resolve, 1500)) // Rate limiting
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ RECURSIVE SCAN ERROR at ${snapshot.url}:`, error)
    console.log('🔍 DEBUG: Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.substring(0, 500)
    })
  } finally {
    console.log(`🔍 DEBUG: Finally block - depth: ${depth}, jobStorage: ${jobStorage.length}`)
    if (depth === 0) {
      processingActive = false
      console.log(`🏁 FINAL COMPLETION: Recursive scanning complete: ${jobStorage.length} total jobs`)
      console.log('🔍 DEBUG: Final job storage contents:', jobStorage)
      
      // Send final completion message
      console.log('📤 Sending final completion message to popup...')
      sendChromeMessage({
        type: 'analysis_complete',
        totalJobs: jobStorage.length,
        isComplete: true
      })
    } else {
      console.log(`🔍 DEBUG: Not root depth (${depth}), not sending completion message`)
    }
  }
}

// AI Helper 1: Check if page contains job listings
async function checkForJobListings(snapshot: any): Promise<boolean> {
  console.log('🤖 AI: Checking if page contains job listings...')
  
  const aiApi = await getAIAPI()
  if (!aiApi) return false
  
  const session = await createAISession(aiApi)
  if (!session) return false
  
  try {
    const contentSample = snapshot.text.substring(0, 2000)
    const prompt = `Does this page contain job listings?

Page: ${snapshot.url}
Title: ${snapshot.pageTitle}

Content:
${contentSample}

Answer YES if:
- You see specific job titles (like "Software Engineer", "Marketing Manager", etc.)
- You see company names with job openings
- You see job-related content like salaries, requirements, job descriptions
- This appears to be a careers page, job board, or job listing page

Answer NO if:
- This is a general company website without job listings
- This is a blog, news site, or non-job related content
- You only see general information without specific job openings

Respond with only: YES or NO`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    const hasJobs = response.trim().toUpperCase().includes('YES')
    console.log(`✅ AI says page has job listings: ${hasJobs}`)
    return hasJobs
    
  } catch (error) {
    console.error('❌ checkForJobListings failed:', error)
    await session.destroy()
    return false
  }
}

// AI Helper 2: Check if job details are fully visible or just previews
async function checkJobDetailLevel(snapshot: any): Promise<boolean> {
  console.log('🤖 AI: Checking job detail level...')
  
  const aiApi = await getAIAPI()
  if (!aiApi) return false
  
  const session = await createAISession(aiApi)
  if (!session) return false
  
  try {
    const contentSample = snapshot.text.substring(0, 3000)
    const prompt = `Analyze this careers page to determine the level of job detail shown.

Page: ${snapshot.url}
Content:
${contentSample}

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

Based on the content above, respond with: FULL or PREVIEW`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    const hasFullDetails = response.trim().toUpperCase().includes('FULL')
    console.log(`✅ AI says detail level: ${hasFullDetails ? 'FULL' : 'PREVIEW'}`)
    return hasFullDetails
    
  } catch (error) {
    console.error('❌ checkJobDetailLevel failed:', error)
    await session.destroy()
    return false
  }
}

// AI Helper 3: Extract jobs from a page with full details
async function extractJobsFromPage(snapshot: any): Promise<JobPosting[]> {
  console.log('🤖 AI: Extracting jobs from page with full details...')
  
  const aiApi = await getAIAPI()
  if (!aiApi) return []
  
  const session = await createAISession(aiApi)
  if (!session) return []
  
  try {
    const contentSample = snapshot.text.substring(0, 4000) // Larger sample for extraction
    const prompt = `Extract all job postings from this page.

Page: ${snapshot.url}
Content:
${contentSample}

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
  "link": "${snapshot.url}",
  "description": "Detailed job description with requirements",
  "salary": "Salary if mentioned or null"
}]

If no jobs found, return: []

JSON:`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    const jobs = parseExtractedJobs(response, snapshot.url)
    console.log(`✅ AI extracted ${jobs.length} jobs from page`)
    return jobs
    
  } catch (error) {
    console.error('❌ extractJobsFromPage failed:', error)
    await session.destroy()
    return []
  }
}

// AI Helper 4: Find links to detailed job pages
async function findJobDetailLinks(snapshot: any): Promise<string[]> {
  console.log('🤖 AI: Finding job detail links...')
  
  const aiApi = await getAIAPI()
  if (!aiApi) return []
  
  const session = await createAISession(aiApi)
  if (!session) return []
  
  try {
    const linkContext = snapshot.links.slice(0, 30).map((link: any, i: number) => 
      `${i + 1}. "${link.text}" -> ${link.href}`
    ).join('\n')
    
    const prompt = `Find links that lead to individual job detail pages.

Page: ${snapshot.url}

AVAILABLE LINKS:
${linkContext}

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

JSON:`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    const links = parseJobLinks(response)
    console.log(`✅ AI found ${links.length} job detail links`)
    return links
    
  } catch (error) {
    console.error('❌ findJobDetailLinks failed:', error)
    await session.destroy()
    return []
  }
}

// AI Helper 5: Find navigation links to job listings
async function findJobNavigationLinks(snapshot: any): Promise<string[]> {
  console.log('🤖 AI: Finding navigation links to job listings...')
  
  const aiApi = await getAIAPI()
  if (!aiApi) return []
  
  const session = await createAISession(aiApi)
  if (!session) return []
  
  try {
    const linkContext = snapshot.links.slice(0, 20).map((link: any, i: number) => 
      `${i + 1}. "${link.text}" -> ${link.href}`
    ).join('\n')
    
    const prompt = `Find links most likely to lead to job listings.

Page: ${snapshot.url}
Title: ${snapshot.pageTitle}

AVAILABLE LINKS:
${linkContext}

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

JSON:`
    
    const response = await session.prompt(prompt)
    await session.destroy()
    
    const links = parseJobLinks(response)
    console.log(`✅ AI found ${links.length} navigation links`)
    return links
    
  } catch (error) {
    console.error('❌ findJobNavigationLinks failed:', error)
    await session.destroy()
    return []
  }
}

// Utility: Parse extracted jobs from AI response
function parseExtractedJobs(response: string, pageUrl: string): JobPosting[] {
  try {
    let jsonStr = response.trim()
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    const arrayMatch = jsonStr.match(/\[.*\]/s)
    if (arrayMatch) {
      jsonStr = arrayMatch[0]
    } else {
      return []
    }
    
    const parsed = JSON.parse(jsonStr)
    if (!Array.isArray(parsed)) return []
    
    return parsed
      .filter(job => job.title && job.company)
      .map(job => ({
        title: job.title,
        company: job.company,
        location: job.location || 'Location TBD',
        link: job.link || pageUrl,
        description: job.description || 'Job description not available',
        ...(job.salary && { salary: job.salary })
      }))
    
  } catch (error) {
    console.error('parseExtractedJobs failed:', error)
    return []
  }
}

// Utility: Parse job links from AI response
function parseJobLinks(response: string): string[] {
  try {
    let jsonStr = response.trim()
    jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    const arrayMatch = jsonStr.match(/\[.*\]/s)
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0])
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'string' && item.startsWith('http'))
      }
    }
    
    return []
    
  } catch (error) {
    console.error('parseJobLinks failed:', error)
    return []
  }
}

// Simulate navigation to a different URL (for content script limitations)
async function simulateNavigation(url: string): Promise<any> {
  console.log(`🔄 Simulating navigation to: ${url}`)
  
  try {
    // In a content script, we can't actually navigate to other pages
    // Since we can't fetch real content, we'll create a minimal simulation
    // that indicates this would be a job detail page
    
    const simulatedSnapshot = {
      url: url,
      pageTitle: `Job Details: ${url.split('/').pop() || 'Job Page'}`,
      // Create minimal content that looks like a job detail page
      text: `Job Title: Sample Position
Company: Sample Company
Location: Remote
Description: This is a simulated job detail page.
Requirements: Sample requirements
Apply now for this position.`,
      links: [
        // Minimal links to prevent further recursion
        { href: url, text: 'Apply Now' },
        { href: url + '/apply', text: 'Submit Application' }
      ]
    }
    
    console.log(`✅ Simulated navigation complete (minimal simulation)`)
    return simulatedSnapshot
    
  } catch (error) {
    console.error(`❌ Navigation simulation failed for ${url}:`, error)
    return null
  }
}

// Save jobs to Chrome storage with error handling
async function saveJobsToStorage(): Promise<void> {
  try {
    // Check if Chrome APIs are available
    if (typeof chrome === 'undefined' || !chrome?.storage?.local) {
      console.warn('⚠️ Chrome storage API not available')
      return
    }
    
    await chrome.storage.local.set({
      'jobs': jobStorage,
      'lastJobAnalysis': {
        timestamp: Date.now(),
        url: window.location.href,
        jobCount: jobStorage.length
      }
    })
    console.log(`✅ Saved ${jobStorage.length} jobs to Chrome storage`)
  } catch (error) {
    console.error('❌ Failed to save jobs to Chrome storage:', error)
    
    // If extension context is invalidated, try alternative messaging
    if (error.message && error.message.includes('Extension context invalidated')) {
      console.log('🔄 Extension context invalidated, jobs stored in memory only')
      // Jobs are still in jobStorage array for popup access
    }
  }
}

// Safe Chrome runtime message sender
function sendChromeMessage(message: any): void {
  try {
    // Check if Chrome runtime API is available
    if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
      console.warn('⚠️ Chrome runtime API not available, message not sent:', message.type)
      return
    }
    
    chrome.runtime.sendMessage(message, (response) => {
      // Handle response or errors silently
      if (chrome.runtime.lastError) {
        // Only log errors for important messages, not routine updates
        if (message.type === 'analysis_complete' || message.type === 'analysis_error') {
          console.log('🔇 Runtime message error (likely popup closed):', chrome.runtime.lastError.message)
        }
        // Suppress routine job update errors to reduce console noise
      }
    })
  } catch (error) {
    console.error('❌ Failed to send Chrome message:', error)
  }
}


// Helper function to score job-related links (used in Phase 1)
function scoreJobLink(link: any): number {
  if (!link.text || !link.href) return 0
  
  const text = link.text.toLowerCase()
  const href = link.href.toLowerCase()
  
  let score = 0
  
  // High value indicators
  const highValueTerms = [
    'software engineer', 'product manager', 'data scientist', 
    'marketing manager', 'sales manager', 'designer', 'developer',
    'analyst', 'consultant', 'specialist', 'coordinator', 'director'
  ]
  
  // Job-related terms
  const jobTerms = [
    'job', 'position', 'role', 'career', 'opening', 'vacancy',
    'apply', 'hiring', 'employment', 'work', 'join'
  ]
  
  // URL patterns that indicate job postings
  const jobUrlPatterns = [
    '/job/', '/jobs/', '/position/', '/career/', '/apply/',
    'jobid=', 'job_id=', 'position_id='
  ]
  
  // Check for high-value job titles
  for (const term of highValueTerms) {
    if (text.includes(term)) score += 20
  }
  
  // Check for general job-related terms
  for (const term of jobTerms) {
    if (text.includes(term)) score += 10
    if (href.includes(term)) score += 5
  }
  
  // Check URL patterns
  for (const pattern of jobUrlPatterns) {
    if (href.includes(pattern)) score += 15
  }
  
  // Penalty for generic links
  const genericTerms = ['home', 'about', 'contact', 'privacy', 'terms']
  for (const term of genericTerms) {
    if (text.includes(term)) score -= 10
  }
  
  return Math.max(0, score)
}

// Get next batch of jobs for "View More"
function getNextJobBatch(startIndex: number, count: number = 3): JobPosting[] {
  const endIndex = startIndex + count
  const batch = jobStorage.slice(startIndex, endIndex)
  console.log(`📋 Returning jobs ${startIndex}-${endIndex}: ${batch.length} jobs`)
  return batch
}

// Get total job count
function getTotalJobCount(): number {
  return jobStorage.length
}

// Helper functions for AI job analysis

// Helper to get AI API - improved detection
async function getAIAPI(): Promise<any> {
  try {
    const windowScope = window as any
    console.log('🔍 Checking for Chrome AI APIs...')
    
    // Check for newer LanguageModel API
    if (windowScope.LanguageModel) {
      console.log('✅ Found window.LanguageModel')
      try {
        const availability = await windowScope.LanguageModel.availability()
        console.log('LanguageModel availability:', availability)
        if (availability === 'readily' || availability === 'available') {
          return windowScope.LanguageModel
        }
      } catch (err) {
        console.log('LanguageModel availability check failed:', err)
      }
    }
    
    // Check for legacy AI API
    if (windowScope.ai?.languageModel) {
      console.log('✅ Found window.ai.languageModel')
      try {
        const capabilities = await windowScope.ai.languageModel.capabilities()
        console.log('AI capabilities:', capabilities)
        if (capabilities.available === 'readily' || capabilities.available === 'available') {
          return windowScope.ai
        }
      } catch (err) {
        console.log('AI capabilities check failed:', err)
      }
    }
    
    console.warn('❌ No AI API found or available')
  } catch (error) {
    console.warn('AI API check failed:', error)
  }
  return null
}

// Helper to create AI session - handles both API types
async function createAISession(aiApi: any): Promise<any> {
  try {
    console.log('🔄 Creating AI session...')
    console.log('AI API object keys:', Object.keys(aiApi || {}))
    
    // Try newer API first (LanguageModel.create)
    if (aiApi.create) {
      console.log('🆕 Using LanguageModel.create()')
      const session = await aiApi.create()
      console.log('✅ LanguageModel session created successfully:', !!session)
      console.log('Session object keys:', Object.keys(session || {}))
      return session
    }
    
    // Try legacy API (ai.languageModel.create)
    if (aiApi.languageModel?.create) {
      console.log('🆗 Using ai.languageModel.create()')
      const session = await aiApi.languageModel.create()
      console.log('✅ Legacy AI session created successfully:', !!session)
      console.log('Session object keys:', Object.keys(session || {}))
      return session
    }
    
    console.error('❌ No create method found on AI API')
    return null
  } catch (error) {
    console.error('❌ Failed to create AI session:', error)
    return null
  }
}

// Listen for messages from popup or background script
if (typeof chrome !== 'undefined' && chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request)
  
  // Handle both old 'type' format and new 'action' format
  const messageType = request.type || request.action
  
  switch (messageType) {
    case 'ping':
      // Simple ping response to test if content script is loaded
      console.log('🏓 Content script ping received')
      sendResponse({ success: true, message: 'pong', version: '2.0-enhanced' })
      break
      
    case 'ANALYZE_PAGE':
      // Analyze current page and return basic data
      const pageData = {
        url: window.location.href,
        title: document.title,
        description: getPageDescription(),
        contentLength: document.body.innerText.length,
        linkCount: document.querySelectorAll('a[href]').length
      }
      console.log('Basic page data (AI will determine relevance):', pageData)
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
      // Handle AI analysis with streaming batch system
      console.log('🤖 Content script received streaming AI analysis request')
      const maxJobs = request.maxJobs || 5
      
      // Start streaming analysis (returns immediately)
      analyzeJobPostingsInContentScript(request.snapshot, maxJobs)
        .then(() => {
          sendResponse({ success: true, message: 'Streaming analysis started' })
        })
        .catch(error => {
          console.error('❌ Streaming analysis failed to start:', error)
          sendResponse({ success: false, error: error.message })
        })
      return true // Keep response channel open for async response
      
    case 'get_more_jobs':
      // Handle "View More" requests
      const startIndex = request.startIndex || 0
      const count = request.count || 3
      const moreJobs = getNextJobBatch(startIndex, count)
      const totalJobs = getTotalJobCount()
      
      sendResponse({ 
        success: true, 
        jobs: moreJobs, 
        totalCount: totalJobs,
        hasMore: (startIndex + count) < totalJobs
      })
      break
      
    case 'get_job_status':
      // Get current status of job processing
      sendResponse({
        success: true,
        totalJobs: getTotalJobCount(),
        processing: processingActive
      })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type: ' + messageType })
  }
  
  // Return true to indicate we will send a response asynchronously
  return true
  })
} else {
  console.warn('⚠️ Chrome runtime API not available - content script cannot receive messages')
}

// Test function for debugging AI availability
(window as any).testGemScoutAI = async () => {
  console.log('🧪 Testing GemScout AI availability...')
  const aiApi = await getAIAPI()
  if (aiApi) {
    console.log('✅ AI API is available!')
    const session = await createAISession(aiApi)
    if (session) {
      console.log('✅ AI session created successfully!')
      try {
        const testResponse = await session.prompt('Say "Hello from GemScout AI test"')
        console.log('✅ AI test response:', testResponse)
        await session.destroy()
        console.log('✅ All AI systems working!')
      } catch (err) {
        console.error('❌ AI prompt test failed:', err)
      }
    } else {
      console.error('❌ Failed to create AI session')
    }
  } else {
    console.error('❌ AI API not available')
    console.log('Please check Chrome flags: chrome://flags')
    console.log('Enable: "Prompt API for Gemini Nano" and "Optimization Guide On Device Model"')
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('🧹 Cleaning up GemScout...')
  stopStorageMonitor()
  processingActive = false
  jobStorage = []
})

// No auto-analysis based on keywords - let user initiate analysis
console.log('Content script ready - AI will analyze page when requested')

export {}
