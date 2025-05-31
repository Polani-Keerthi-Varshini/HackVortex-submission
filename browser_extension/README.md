# TruthLens Browser Extension

A Chrome extension that provides real-time fact-checking directly from your browser using the TruthLens AI-powered platform.

## Features

- **Real-time Fact Checking**: Analyze any text on web pages instantly
- **Context Menu Integration**: Right-click on selected text to fact-check
- **Credibility Scoring**: Get detailed credibility scores and analysis
- **Source Verification**: View sources and reasoning behind fact-check results
- **Visual Feedback**: Highlight analyzed content with color-coded results

## Installation Instructions

### Manual Installation (Developer Mode)

1. **Download the Extension**
   - Download or clone the `browser_extension` folder
   - Save it to your computer

2. **Enable Developer Mode in Chrome**
   - Open Google Chrome
   - Type `chrome://extensions/` in the address bar
   - Toggle "Developer mode" ON (top right corner)

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the `browser_extension` folder
   - The TruthLens icon should appear in your browser toolbar

## How to Use

### Method 1: Extension Popup
1. Click the TruthLens icon in your browser toolbar
2. Paste or type text into the text area
3. Click "Check Facts" to analyze the content
4. Review the credibility score and detailed analysis

### Method 2: Right-Click Context Menu
1. Select any text on a webpage
2. Right-click and choose "Fact Check with TruthLens"
3. The extension popup will open with the selected text
4. Results will be displayed automatically

### Method 3: Text Selection
1. Select text on any webpage
2. Click the TruthLens extension icon
3. The selected text will be pre-filled for analysis

## Understanding Results

- **Credibility Score**: 0-100% rating of content reliability
- **Status**: verified, mixed, false, or pending
- **Analysis**: Detailed reasoning behind the assessment
- **Sources**: List of authoritative sources used in verification
- **Risk Level**: Color-coded visual indicator (green, yellow, red)

## API Configuration

The extension connects to: `https://edb45802-7c53-4151-8ab6-8345c51197d9-00-252w1l9x7npln.kirk.replit.dev/api/fact-check`

To update the API endpoint:
1. Open Chrome DevTools (F12)
2. Go to Application > Storage > Local Storage
3. Find the TruthLens extension entry
4. Update the `apiEndpoint` value

## Troubleshooting

**Extension not working?**
- Check that you're connected to the internet
- Verify the extension is enabled in `chrome://extensions/`
- Try refreshing the webpage

**API errors?**
- The fact-checking service may be temporarily unavailable
- Check your internet connection
- Try again in a few moments

**Text not highlighting?**
- Some websites may prevent content modification
- Try using the popup method instead

## Privacy & Security

- Text is only sent to the TruthLens API for analysis
- No personal data is stored or transmitted
- Analysis results are temporarily cached for performance
- All communication uses secure HTTPS connections

## Support

For issues or questions, please contact the TruthLens development team or check the main application documentation.

## Version

Current version: 1.0
Compatible with: Chrome (Manifest V3)