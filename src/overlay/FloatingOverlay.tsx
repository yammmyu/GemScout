import React, { useState, useEffect } from 'react'

interface Job {
  title: string
  company: string
  match: number
  salary?: string
  location?: string
}

const FloatingOverlay: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Load mock job data
    setJobs([
      { title: 'Senior React Developer', company: 'TechCorp', match: 95, salary: '$120k-150k', location: 'Remote' },
      { title: 'Frontend Engineer', company: 'StartupXYZ', match: 88, salary: '$100k-130k', location: 'San Francisco' },
      { title: 'Full Stack Developer', company: 'BigTech Inc', match: 82, salary: '$110k-140k', location: 'New York' }
    ])
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const analyzeCurrentPage = () => {
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      // Update job matches based on current page
    }, 2000)
  }

  if (!isExpanded) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 10000,
        }}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-move hover:bg-blue-700 transition-colors"
        onMouseDown={handleMouseDown}
        onClick={() => setIsExpanded(true)}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
        width: '320px',
        maxHeight: '500px'
      }}
      className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div
        className="bg-blue-600 text-white p-3 cursor-move flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          <h3 className="font-semibold">GemScout</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-blue-100 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13H5v-2h14v2z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {/* Controls */}
        <div className="mb-4">
          <button
            onClick={analyzeCurrentPage}
            disabled={isAnalyzing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded text-sm transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze This Page'}
          </button>
        </div>

        {/* Job Matches */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Job Matches ({jobs.length})</h4>
          
          {jobs.map((job, index) => (
            <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-sm text-gray-900 leading-tight">
                  {job.title}
                </h5>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                  {job.match}%
                </span>
              </div>
              
              <p className="text-xs text-gray-600 mb-1">{job.company}</p>
              
              {job.salary && (
                <p className="text-xs text-green-600 mb-1">{job.salary}</p>
              )}
              
              {job.location && (
                <p className="text-xs text-gray-500">{job.location}</p>
              )}
              
              <div className="flex space-x-2 mt-2">
                <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                  View
                </button>
                <button className="text-xs border border-gray-300 px-2 py-1 rounded hover:bg-gray-50">
                  Save
                </button>
              </div>
            </div>
          ))}
          
          {jobs.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              <p className="text-sm">No job matches found</p>
              <p className="text-xs">Try analyzing the current page</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">{jobs.length}</div>
              <div className="text-xs text-gray-600">Matches</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {jobs.length > 0 ? Math.max(...jobs.map(j => j.match)) : 0}%
              </div>
              <div className="text-xs text-gray-600">Best Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-center">
        <button className="text-xs text-blue-600 hover:text-blue-800">
          Open Settings
        </button>
      </div>
    </div>
  )
}

export default FloatingOverlay