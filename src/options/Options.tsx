import React, { useState, useEffect } from 'react'

interface Settings {
  autoAnalyze: boolean
  showOverlay: boolean
  jobSites: string[]
  matchThreshold: number
  notifications: boolean
}

const Options: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    autoAnalyze: true,
    showOverlay: true,
    jobSites: ['linkedin.com', 'indeed.com', 'glassdoor.com'],
    matchThreshold: 70,
    notifications: true
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from Chrome storage
    chrome.storage.sync.get(['gemscout_settings'], (result) => {
      if (result.gemscout_settings) {
        setSettings(result.gemscout_settings)
      }
    })
  }, [])

  const saveSettings = () => {
    chrome.storage.sync.set({ gemscout_settings: settings }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const addJobSite = () => {
    const site = prompt('Enter job site domain (e.g., example.com):')
    if (site && !settings.jobSites.includes(site)) {
      updateSetting('jobSites', [...settings.jobSites, site])
    }
  }

  const removeJobSite = (site: string) => {
    updateSetting('jobSites', settings.jobSites.filter(s => s !== site))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GemScout Settings</h1>
          <p className="text-gray-600">Configure your AI-powered job discovery assistant</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-analyze pages</label>
                  <p className="text-xs text-gray-500">Automatically scan pages for job opportunities</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAnalyze}
                  onChange={(e) => updateSetting('autoAnalyze', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Show overlay</label>
                  <p className="text-xs text-gray-500">Display floating overlay on job sites</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showOverlay}
                  onChange={(e) => updateSetting('showOverlay', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Monitored Job Sites</h2>
            
            <div className="space-y-3">
              {settings.jobSites.map((site, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span className="text-sm text-gray-700">{site}</span>
                  <button
                    onClick={() => removeJobSite(site)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                onClick={addJobSite}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
              >
                + Add Job Site
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={saveSettings}
            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
              saved 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saved ? 'Settings Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Options