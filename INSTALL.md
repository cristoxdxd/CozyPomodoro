# CozyPomodoro Installation Guide

## How to Install in Chrome

1. **Download the Extension**:
   - Download or clone this repository to your computer
   - Ensure all files are in a single folder

2. **Open Chrome Extensions Page**:
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle "Developer mode" switch in the top-right corner

4. **Load the Extension**:
   - Click "Load unpacked" button
   - Select the CozyPomodoro folder containing manifest.json
   - The extension should appear in your extensions list

5. **Start Using**:
   - The CozyPomodoro icon (🍅) will appear in your Chrome toolbar
   - Click it to open the timer interface
   - Click "Start" to begin your first Pomodoro session!

## Troubleshooting

- **Extension not loading**: Make sure manifest.json is in the root folder
- **No sound**: Check that sound notifications are enabled in the popup
- **Timer not working**: Try clicking Reset and Start again

## Extension Features Test Checklist

- [ ] Extension loads without errors
- [ ] Popup opens when clicking the icon
- [ ] Timer starts and shows countdown
- [ ] Timer automatically cycles through sessions
- [ ] Sound notifications play (if enabled)
- [ ] State persists when closing/reopening popup
- [ ] Badge shows remaining minutes
- [ ] Notifications appear when sessions complete