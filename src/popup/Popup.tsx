import React, { useState, useEffect } from 'react'

interface JobPosting {
  title: string
  company: string
  location: string
  link: string
  description: string
  salary?: string
}

const Popup: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [lastAnalyzed, setLastAnalyzed] = useState<string>('')
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [navigationPath, setNavigationPath] = useState<string[]>([])
  const [discoveredAt, setDiscoveredAt] = useState<string>('')
  const [streamingActive, setStreamingActive] = useState(false)
  const [jobsDisplayed, setJobsDisplayed] = useState(0)

  // Load jobs from storage on component mount and set up streaming
  useEffect(() => {
    loadJobsFromStorage()
    
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url)
      }
    })
    
    // Set up streaming port connection
    const port = chrome.runtime.connect({ name: 'popup-stream' })
    
    port.onMessage.addListener((message) => {
      console.log('📢 DEBUG: Popup received message:', message)
      
      if (message.type === 'jobs_update') {
        console.log(`📢 DEBUG: Received streaming update: ${message.count} jobs available, isComplete: ${message.isComplete}`)
        console.log('📘 DEBUG: Message details:', { 
          batchNumber: message.batchNumber, 
          jobsInBatch: message.jobs?.length, 
          totalCount: message.count 
        })
        
        // Reload jobs from storage when we get updates
        loadJobsFromStorage()
        
        if (message.count > 0) {
          setIsAnalyzing(false)
          setAnalysisProgress(100)
          setStreamingActive(false)
          setErrorMessage('')
          setJobsDisplayed(message.count)
        }
        
        // Handle completion
        if (message.isComplete) {
          setIsAnalyzing(false)
          setStreamingActive(false)
          setAnalysisProgress(100)
          
          if (message.count === 0) {
            setErrorMessage('No jobs found on this page')
          }
        }
      } else if (message.type === 'analysis_error') {
        console.log(`❌ Received analysis error: ${message.error}`)
        setIsAnalyzing(false)
        setStreamingActive(false)
        setAnalysisProgress(0)
        setErrorMessage(message.error || 'Analysis failed')
      } else if (message.type === 'analysis_cancelled') {
        console.log(`⚠️ DEBUG: Analysis was cancelled: ${message.reason}`)
        setIsAnalyzing(false)
        setStreamingActive(false)
        setAnalysisProgress(0)
        if (message.reason === 'New analysis requested') {
          // Don't show error for intentional restart
          console.log('🔄 DEBUG: Analysis restarted by user')
        } else {
          setErrorMessage(`Analysis stopped: ${message.reason}`)
        }
      }
    })
    
    return () => {
      port.disconnect()
    }
  }, [])
  
  // Function to load jobs from Chrome storage
  const loadJobsFromStorage = async () => {
    try {
      console.log('📖 DEBUG: Loading jobs from storage...')
      const result = await chrome.storage.local.get(['gemscout_jobs', 'lastJobAnalysis'])
      const storedJobs = result.gemscout_jobs || []
      console.log('📖 DEBUG: Loaded jobs from storage:', { count: storedJobs.length, jobs: storedJobs.slice(0, 2) })
      setJobs(storedJobs)
      
      // Set last analyzed info
      if (result.lastJobAnalysis?.timestamp) {
        const lastTime = new Date(result.lastJobAnalysis.timestamp).toLocaleString()
        setLastAnalyzed(`Last scan: ${lastTime}`)
      }
    } catch (error) {
      console.error('Failed to load jobs from storage:', error)
    }
  }

  const analyzeCurrentPage = async (maxJobs: number = 5) => {
    // Clear any previous error messages immediately
    setErrorMessage('')
    
    // If already analyzing, this will trigger a restart in the background
    if (isAnalyzing) {
      console.log('🔄 DEBUG: Restarting analysis (cancelling current)')
    }
    
    setIsAnalyzing(true)
    setStreamingActive(true)
    setAnalysisProgress(0)
    setJobs([]) // Clear existing jobs
    setJobsDisplayed(0)
    
    // Faster progress updates for streaming
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 95) return prev
        return prev + Math.random() * 15
      })
    }, 300)
    
    try {
      // Send streaming discovery request to background script
      chrome.runtime.sendMessage({ 
        type: 'start_discovery',
        maxJobs: maxJobs
      }, (response) => {
        clearInterval(progressInterval)
        
        if (chrome.runtime.lastError) {
          console.error('Error communicating with background script:', chrome.runtime.lastError)
          setErrorMessage('Failed to communicate with background script')
          setIsAnalyzing(false)
          setStreamingActive(false)
          setAnalysisProgress(0)
          return
        }
        
        if (response?.success) {
          console.log('✅ Streaming analysis started:', response.message)
          setErrorMessage('')
          
          // Analysis will continue via streaming updates
          // Keep progress at 90% until first jobs arrive
          setAnalysisProgress(90)
          
          // Set up timeout to stop loading state if no jobs arrive
          setTimeout(() => {
            if (jobsDisplayed === 0) {
              setIsAnalyzing(false)
              setStreamingActive(false)
              setAnalysisProgress(0)
              setErrorMessage('No jobs found on this page')
            }
          }, 15000) // 15 second timeout
          
        } else {
          console.error('Discovery failed to start:', response?.error)
          setErrorMessage(response?.error || 'Failed to start discovery')
          setIsAnalyzing(false)
          setStreamingActive(false)
          setAnalysisProgress(0)
        }
      })
    } catch (error) {
      clearInterval(progressInterval)
      console.error('Error starting discovery:', error)
      setErrorMessage('Unexpected error occurred')
      setIsAnalyzing(false)
      setStreamingActive(false)
      setAnalysisProgress(0)
    }
  }

  const clearJobs = async () => {
    try {
      console.log('🗑️ DEBUG: Clearing jobs from storage...')
      await chrome.storage.local.remove(['gemscout_jobs', 'lastJobAnalysis'])
      setJobs([])
      setJobsDisplayed(0)
      setLastAnalyzed('')
      console.log('✅ DEBUG: Jobs cleared successfully')
    } catch (error) {
      console.error('❌ DEBUG: Failed to clear jobs:', error)
    }
  }

  return (
    <div className="w-96 max-h-96 overflow-y-auto bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold mb-1">GemScout</h1>
      </div>
      
      {/* Quick Stats */}
      {jobs.length > 0 && (
        <div className="pt-4 border-t border-gray-200 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{jobs.length}</div>
            <div className="text-xs text-gray-600">Jobs Found</div>
          </div>
        </div>
      )}  

      {/* Main Content */}
      <div className="p-4">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 mb-4">
          <div className="space-y-2">
            <button
              onClick={() => analyzeCurrentPage(5)}
              className={`w-full font-medium py-2 px-4 rounded transition-colors flex items-center justify-center ${
                isAnalyzing 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finding Jobs... (Click to Restart)
                </>
              ) : (
                'Find Jobs'
              )}
            </button>
            
            {/* Progress Bar */}
            {isAnalyzing && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
            )}
            
            {/* Streaming indicator */}
            {streamingActive && (
              <div className="text-sm text-blue-600 text-center p-2 bg-blue-50 rounded">
                🌊 Finding jobs in background... {jobs.length} found so far
              </div>
            )}
          </div>
          
        </div>

        {/* Job Listings */}
        <div className="mb-4">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Discovered Jobs</h3>
              <div className="flex items-center space-x-2">
                {jobs.length > 0 && (
                  <button
                    onClick={clearJobs}
                    className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    title="Clear all jobs"
                  >
                    Clear
                  </button>
                )}
                {lastAnalyzed && (
                  <span className="text-xs text-gray-500">{lastAnalyzed}</span>
                )}
              </div>
            </div>
            
            {/* Navigation Path Display */}
            {navigationPath.length > 1 && (
              <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-1">
                  🧦 AI Navigation Path:
                </p>
                <div className="text-xs text-blue-600">
                  {navigationPath.map((url, index) => {
                    const domain = new URL(url).hostname
                    return (
                      <span key={index}>
                        {domain}
                        {index < navigationPath.length - 1 && (
                          <span className="mx-1 text-blue-400">→</span>
                        )}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-blue-500 mt-1">
                  Found jobs at: {discoveredAt ? new URL(discoveredAt).pathname : 'current page'}
                </p>
              </div>
            )}
          </div>
          
          {jobs.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {jobs.map((job, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200">
                  <div className="mb-2">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                      {job.title}
                    </h4>
                  </div>
                  
                  <div className="mb-2">
                    <p className="text-sm text-gray-700 font-medium">{job.company}</p>
                    <div className="flex items-center justify-between">
                      {job.location && (
                        <p className="text-xs text-gray-500">{job.location}</p>
                      )}
                      {job.salary && (
                        <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                          {job.salary}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {job.description && (
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                  
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Job
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.294a18.916 18.916 0 01-16 2.742 6.064 6.064 0 01-2-4.242V8a2 2 0 012-2h.294A18.916 18.916 0 0116 6z" />
              </svg>
              <p className="font-medium mb-1">No jobs found yet</p>
              <p className="text-sm">Click "Scan Current Page" to discover job opportunities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Popup