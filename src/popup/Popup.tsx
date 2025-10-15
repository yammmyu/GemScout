import React from 'react'

const Popup: React.FC = () => {
  return (
    <div className="w-80 h-96 p-4 bg-gray-50">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">
            Hello from GemScout!
          </h1>
          <p className="text-gray-600 mb-4">
            AI-powered job discovery assistant
          </p>
          <button 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT })
            }}
          >
            Open Side Panel
          </button>
        </div>
      </div>
    </div>
  )
}

export default Popup