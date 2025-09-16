class PomodoroBackground {
    constructor() {
        this.timerId = null;
        this.timeRemaining = 0;
        this.sessionType = 'work';
        this.isRunning = false;
        
        this.setupMessageListener();
        this.loadState();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'START_TIMER':
                    this.startTimer(message.timeRemaining, message.sessionType);
                    break;
                case 'PAUSE_TIMER':
                    this.pauseTimer();
                    break;
                case 'RESET_TIMER':
                    this.resetTimer();
                    break;
                case 'PLAY_SOUND':
                    this.playSound(message.sessionType);
                    break;
            }
        });
    }

    async loadState() {
        try {
            const result = await chrome.storage.local.get([
                'isRunning', 'timeRemaining', 'sessionType', 'timerStartTime'
            ]);
            
            if (result.isRunning && result.timeRemaining && result.timerStartTime) {
                // Calculate elapsed time since last save
                const now = Date.now();
                const elapsed = Math.floor((now - result.timerStartTime) / 1000);
                const remainingTime = Math.max(0, result.timeRemaining - elapsed);
                
                if (remainingTime > 0) {
                    this.timeRemaining = remainingTime;
                    this.sessionType = result.sessionType;
                    this.isRunning = true;
                    this.startTimer(this.timeRemaining, this.sessionType);
                } else {
                    // Timer should have completed while extension was closed
                    this.sessionComplete();
                }
            }
        } catch (error) {
            console.error('Error loading background state:', error);
        }
    }

    async saveState() {
        try {
            await chrome.storage.local.set({
                isRunning: this.isRunning,
                timeRemaining: this.timeRemaining,
                sessionType: this.sessionType,
                timerStartTime: Date.now()
            });
        } catch (error) {
            console.error('Error saving background state:', error);
        }
    }

    startTimer(timeRemaining, sessionType) {
        this.timeRemaining = timeRemaining;
        this.sessionType = sessionType;
        this.isRunning = true;
        this.saveState();
        
        // Clear existing timer
        if (this.timerId) {
            clearInterval(this.timerId);
        }
        
        // Start new timer
        this.timerId = setInterval(() => {
            this.timeRemaining--;
            
            // Send tick to popup if it's open
            this.sendMessageToPopup({
                type: 'TIMER_TICK',
                timeRemaining: this.timeRemaining
            });
            
            // Save state periodically
            if (this.timeRemaining % 30 === 0) { // Every 30 seconds
                this.saveState();
            }
            
            // Check if session is complete
            if (this.timeRemaining <= 0) {
                this.sessionComplete();
            }
        }, 1000);
        
        // Update badge
        this.updateBadge();
    }

    pauseTimer() {
        this.isRunning = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.saveState();
        chrome.action.setBadgeText({ text: '' });
    }

    resetTimer() {
        this.isRunning = false;
        this.timeRemaining = 0;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.saveState();
        chrome.action.setBadgeText({ text: '' });
    }

    sessionComplete() {
        this.isRunning = false;
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        
        // Send completion message to popup
        this.sendMessageToPopup({
            type: 'SESSION_COMPLETE'
        });
        
        // Show notification
        this.showNotification();
        
        // Play sound
        this.playSound(this.sessionType);
        
        this.saveState();
        chrome.action.setBadgeText({ text: '' });
    }

    async sendMessageToPopup(message) {
        try {
            await chrome.runtime.sendMessage(message);
        } catch (error) {
            // Popup might not be open, which is fine
        }
    }

    updateBadge() {
        if (this.isRunning && this.timeRemaining > 0) {
            const minutes = Math.floor(this.timeRemaining / 60);
            chrome.action.setBadgeText({ text: minutes.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
        } else {
            chrome.action.setBadgeText({ text: '' });
        }
    }

    async showNotification() {
        const sessionLabels = {
            work: 'Work session complete! Time for a break 🎉',
            break: 'Break time is over! Ready to focus? 💪',
            longBreak: 'Long break finished! Great job on completing a full cycle! 🏆'
        };
        
        try {
            await chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'CozyPomodoro',
                message: sessionLabels[this.sessionType]
            });
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    async playSound(sessionType) {
        // Use chrome.offscreen API to play sound in an offscreen document
        try {
            // Check if offscreen document exists, if not, create it
            const OFFSCREEN_URL = 'offscreen.html';
            const OFFSCREEN_REASON = chrome.offscreen.Reason.AUDIO_PLAYBACK;

            const offscreenDocs = await chrome.offscreen.hasDocument();
            if (!offscreenDocs) {
                await chrome.offscreen.createDocument({
                    url: OFFSCREEN_URL,
                    reasons: [OFFSCREEN_REASON],
                    justification: 'Play notification sound for Pomodoro timer'
                });
            }

            // Send message to offscreen document to play sound
            chrome.runtime.sendMessage({
                type: 'OFFSCREEN_PLAY_SOUND',
                sessionType: sessionType
            });
        } catch (error) {
            console.error('Error playing sound via offscreen document:', error);
        }
    }
}

// Initialize background script
const pomodoroBackground = new PomodoroBackground();

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    pomodoroBackground.loadState();
});

// Handle extension install
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
});