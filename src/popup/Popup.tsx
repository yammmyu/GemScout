import React, { useState, useEffect } from 'react'

interface JobMatch {
  title: string
  company: string
  match: number
  url: string
}

const Popup: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])
  const [currentUrl, setCurrentUrl] = useState<string>('')

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url)
      }
    })
  }, [])

  const analyzeCurrentPage = async () => {
    setIsAnalyzing(true)
    
    // Send message to content script to analyze the page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_PAGE' }, (response) => {
        if (response?.success) {
          // Mock job matches for demonstration
          setJobMatches([
            { title: "Software Engineer", company: "Tech Corp", match: 95, url: "#" },
            { title: "Frontend Developer", company: "StartupXYZ", match: 88, url: "#" },
            { title: "React Developer", company: "BigTech Inc", match: 82, url: "#" }
          ])
        }
        setIsAnalyzing(false)
      })
    }
  }

  const toggleOverlay = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_OVERLAY' })
    }
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
  }

  return (
    <div className="w-96 max-h-96 overflow-y-auto bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold mb-1">GemScout</h1>
        <p className="text-blue-100 text-sm">AI Job Discovery Assistant</p>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Current Page Info */}
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Current Page</h3>
          <p className="text-sm text-gray-600 truncate">
            {currentUrl || 'Loading...'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mb-4">
          <button
            onClick={analyzeCurrentPage}
            disabled={isAnalyzing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Page for Jobs'}
          </button>
          
          <button
            onClick={toggleOverlay}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Toggle Job Overlay
          </button>
          
          <button
            onClick={openOptions}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Open Settings
          </button>
        </div>

        {/* Job Matches */}
        {jobMatches.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Job Matches</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {jobMatches.map((job, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {job.title}
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {job.match}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{job.company}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{jobMatches.length}</div>
              <div className="text-xs text-gray-600">Matches Found</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">Active</div>
              <div className="text-xs text-gray-600">Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Popup