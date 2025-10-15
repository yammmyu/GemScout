# GemScout

AI-powered job discovery assistant using Chrome built-in Gemini Nano

## Features

- Chrome Extension (Manifest V3)
- React + TypeScript + Vite
- TailwindCSS for styling
- Enhanced Popup UI with job analysis
- Floating overlay widget for web pages
- Options page for settings and configuration
- Background service worker with auto-analysis
- Smart content script for page analysis
- Notification system for job alerts

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build extension:
   ```bash
   npm run build
   ```

## Chrome Extension Installation

1. Run `npm run build` to create the `dist` folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder
5. The GemScout extension should now be loaded and ready to use!

## New Features (Without Side Panel)

### 🎯 **Enhanced Popup UI**
- **Rich job analysis dashboard** - View job matches directly in the popup
- **Current page analysis** - Analyze any page for job opportunities
- **Quick action buttons** - Toggle overlay, open settings, analyze page
- **Real-time job matching** - See compatibility scores and company info

### 🔄 **Floating Overlay Widget**
- **Draggable overlay** - Floating widget that can be moved around the page
- **Toggle visibility** - Click the popup button to show/hide the overlay
- **Page-specific analysis** - Contextual job recommendations
- **Compact and expandable** - Starts as a small icon, expands to show full info

### ⚙️ **Comprehensive Settings Page**
- **Auto-analysis controls** - Enable/disable automatic page scanning
- **Job site management** - Add/remove monitored job websites
- **Notification preferences** - Control when to receive job alerts
- **Match threshold settings** - Adjust minimum job compatibility scores

### 🤖 **Smart Background Processing**
- **Auto-detection** - Automatically identifies job posting pages
- **Storage management** - Saves analysis history and user preferences
- **Notification system** - Alerts when relevant jobs are found
- **Tab monitoring** - Tracks navigation to job sites

## Project Structure

```
src/
  popup/           # Extension popup UI (enhanced)
  options/         # Settings and configuration page
  overlay/         # Floating overlay components
  background/      # Background service worker
  content/         # Content script with injection
  assets/          # Static assets
  styles/          # CSS styles
```
