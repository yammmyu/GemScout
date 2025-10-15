# GemScout

AI-powered job discovery assistant using Chrome built-in Gemini Nano

## Features

- Chrome Extension (Manifest V3)
- React + TypeScript + Vite
- TailwindCSS for styling
- Popup UI and Side Panel UI
- Background service worker
- Content script for page analysis

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

## Project Structure

```
src/
  popup/           # Extension popup UI
  sidepanel/       # Side panel UI
  background/      # Background service worker
  content/         # Content script
  assets/          # Static assets
  styles/          # CSS styles
```
