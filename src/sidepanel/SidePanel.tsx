import React from 'react'

const SidePanel: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold text-blue-600">GemScout</h1>
        <p className="text-gray-600">Job Discovery Assistant</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">
            Welcome to GemScout!
          </h2>
          <p className="text-blue-700">
            Your AI-powered job discovery assistant is ready to help you find the perfect opportunities.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• AI-powered job matching</li>
            <li>• Smart resume analysis</li>
            <li>• Application tracking</li>
            <li>• Interview preparation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SidePanel