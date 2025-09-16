# CozyPomodoro 🍅

A simple and cozy Chrome extension for the Pomodoro technique with sound notifications and automatic session cycling.

## Features

- ⏰ **Classic Pomodoro Timer**: 25-minute work sessions, 5-minute breaks, 15-minute long breaks
- 🔄 **Automatic Cycling**: Automatically transitions between work and break sessions
- 🔊 **Sound Notifications**: Pleasant notification sounds for session changes
- 📊 **Progress Tracking**: Visual progress bar and session counter
- 🎨 **Cozy Interface**: Beautiful, minimal design with gradient backgrounds
- 💾 **Persistent State**: Remembers your progress even when closing the popup

## How to Use

1. **Install the Extension**:
   - Download or clone this repository
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top-right corner
   - Click "Load unpacked" and select the CozyPomodoro folder

2. **Using CozyPomodoro**:
   - Click the 🍅 icon in your Chrome toolbar
   - Click "Start" to begin your first 25-minute work session
   - The timer will automatically cycle through:
     - Work session (25 minutes)
     - Short break (5 minutes)
     - Work session (25 minutes)
     - Short break (5 minutes)
     - Work session (25 minutes)
     - Short break (5 minutes)
     - Work session (25 minutes)
     - Long break (15 minutes)
   - Sound notifications will play when sessions change
   - Use "Pause" to pause the current session
   - Use "Reset" to start over

3. **Settings**:
   - Toggle sound notifications on/off with the checkbox
   - Your preferences are automatically saved

## Pomodoro Technique

The Pomodoro Technique is a time management method that uses a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks. After every 4 work sessions, you take a longer break.

Benefits:
- Improved focus and concentration
- Better time awareness
- Reduced mental fatigue
- Enhanced productivity

## Technical Details

- Built with Chrome Extension Manifest V3
- Uses service workers for background timer functionality
- Stores state in Chrome local storage
- Web Audio API for notification sounds
- Responsive design with CSS animations

## License

MIT License - see [LICENSE](LICENSE) file for details.