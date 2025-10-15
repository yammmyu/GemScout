/**
 * Test script to check AI availability from content script (page context)
 * This helps diagnose if AI API is only available in page context vs service worker
 */

// Function to test AI availability in content script context
export async function testAIInContentScript(): Promise<void> {
  console.log('🧪 Testing AI availability in content script context...')
  
  // Check different AI API access points
  const windowScope = window as any
  const globalScope = globalThis as any
  
  const aiChecks = {
    'window.ai': typeof windowScope.ai,
    'window.chrome?.ai': typeof windowScope.chrome?.ai,
    'globalThis.ai': typeof globalScope.ai,
    'self.ai': typeof (self as any)?.ai,
    // New Chrome built-in AI APIs
    'window.LanguageModel': typeof windowScope.LanguageModel,
    'globalThis.LanguageModel': typeof globalScope.LanguageModel,
    'window.Summarizer': typeof windowScope.Summarizer,
    'window.Writer': typeof windowScope.Writer,
    'window.Rewriter': typeof windowScope.Rewriter,
    'window.Proofreader': typeof windowScope.Proofreader
  }
  
  console.log('🔍 AI API availability checks in content script:', aiChecks)
  
  // Try to find the AI API - check both old and new formats
  let aiApi = null
  let apiLocation = ''
  let apiType = ''
  
  // Test newer Chrome built-in AI APIs first
  if (windowScope.LanguageModel) {
    console.log('✅ Found LanguageModel API at window.LanguageModel')
    await testLanguageModelAPI(windowScope.LanguageModel, 'window.LanguageModel')
  }
  
  if (globalScope.LanguageModel) {
    console.log('✅ Found LanguageModel API at globalThis.LanguageModel')
    await testLanguageModelAPI(globalScope.LanguageModel, 'globalThis.LanguageModel')
  }
  
  // Test other built-in AI APIs
  if (windowScope.Summarizer) {
    console.log('✅ Found Summarizer API')
    await testSummarizerAPI(windowScope.Summarizer)
  }
  
  if (windowScope.Writer) {
    console.log('✅ Found Writer API')
    await testWriterAPI(windowScope.Writer)
  }
  
  // Test legacy AI API format
  if (windowScope.ai?.languageModel) {
    aiApi = windowScope.ai
    apiLocation = 'window.ai'
    apiType = 'legacy'
    console.log('✅ Found legacy AI API at window.ai')
  } else if (windowScope.chrome?.ai?.languageModel) {
    aiApi = windowScope.chrome.ai
    apiLocation = 'window.chrome.ai'
    apiType = 'legacy'
    console.log('✅ Found legacy AI API at window.chrome.ai')
  } else if (globalScope.ai?.languageModel) {
    aiApi = globalScope.ai
    apiLocation = 'globalThis.ai'
    apiType = 'legacy'
    console.log('✅ Found legacy AI API at globalThis.ai')
  }
  
  if (!aiApi) {
    console.warn('🚫 Chrome built-in AI not found in content script context')
    return
  }
  
  try {
    console.log('📊 Checking AI capabilities from content script...')
    const capabilities = await aiApi.languageModel.capabilities()
    console.log(`Full AI capabilities from ${apiLocation}:`, JSON.stringify(capabilities, null, 2))
    
    if (capabilities.available === 'readily') {
      console.log('✅ AI is readily available in content script context!')
      
      // Try to create a session
      try {
        console.log('🔄 Attempting to create AI session from content script...')
        const session = await aiApi.languageModel.create()
        console.log('✅ AI session created successfully from content script!')
        
        // Test a simple prompt
        const testResponse = await session.prompt('Say "Hello from AI in content script!"')
        console.log('🤖 AI test response from content script:', testResponse)
        
        await session.destroy()
        console.log('✅ AI session destroyed successfully')
        
      } catch (sessionError) {
        console.error('❌ Failed to create AI session from content script:', sessionError)
      }
      
    } else {
      console.warn(`⚠️  AI not readily available in content script: "${capabilities.available}"`)
      
      if (capabilities.available === 'after-download') {
        console.log('📥 Model download required. Trying to trigger download...')
        
        // In content script, we have user context, so download might work
        try {
          const session = await aiApi.languageModel.create()
          console.log('✅ Model download triggered successfully!')
          await session.destroy()
        } catch (downloadError) {
          console.error('❌ Model download failed:', downloadError)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ AI capabilities check failed in content script:', error)
  }
}

// Test functions for newer Chrome built-in AI APIs
async function testLanguageModelAPI(LanguageModel: any, location: string) {
  try {
    console.log(`🧪 Testing LanguageModel API at ${location}...`)
    
    // Check availability using new API format
    const availability = await LanguageModel.availability()
    console.log(`LanguageModel availability at ${location}:`, availability)
    
    // Check user activation requirement
    const userActivation = (navigator as any).userActivation
    if (userActivation) {
      console.log('User activation status:', {
        isActive: userActivation.isActive,
        hasBeenActive: userActivation.hasBeenActive
      })
    }
    
    if (availability === 'available') {
      console.log('✅ LanguageModel is immediately available!')
      const session = await LanguageModel.create()
      const response = await session.prompt('Say "Hello from new LanguageModel API!"')
      console.log('🤖 New LanguageModel response:', response)
      await session.destroy()
    } else if (availability === 'downloadable') {
      console.log('📥 LanguageModel needs download, checking user activation...')
      if (userActivation?.isActive) {
        console.log('🎆 User activation detected, trying to create session...')
        const session = await LanguageModel.create()
        console.log('✅ LanguageModel session created after download!')
        await session.destroy()
      } else {
        console.log('⚠️  User activation required for model download')
      }
    } else {
      console.log(`❌ LanguageModel not available: ${availability}`)
    }
  } catch (error) {
    console.error(`❌ Error testing LanguageModel at ${location}:`, error)
  }
}

async function testSummarizerAPI(Summarizer: any) {
  try {
    console.log('📄 Testing Summarizer API...')
    const availability = await Summarizer.availability()
    console.log('Summarizer availability:', availability)
    
    if (availability === 'available') {
      const session = await Summarizer.create()
      const response = await session.summarize('This is a long text that needs to be summarized for testing purposes. Chrome has built-in AI APIs now.')
      console.log('⚙️ Summarizer response:', response)
      await session.destroy()
    }
  } catch (error) {
    console.error('❌ Error testing Summarizer:', error)
  }
}

async function testWriterAPI(Writer: any) {
  try {
    console.log('✍️ Testing Writer API...')
    const availability = await Writer.availability()
    console.log('Writer availability:', availability)
    
    if (availability === 'available') {
      const session = await Writer.create()
      const response = await session.write('Write a short job description')
      console.log('📝 Writer response:', response)
      await session.destroy()
    }
  } catch (error) {
    console.error('❌ Error testing Writer:', error)
  }
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
  testAIInContentScript()
}
