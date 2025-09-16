class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.currentSession = 1;
        this.maxSessions = 4;
        this.sessionType = 'work'; // 'work', 'break', 'longBreak'
        this.soundEnabled = true;
        
        // Demo mode detection
        this.isDemoMode = typeof chrome === 'undefined' || !chrome.storage;
        
        this.sessions = this.isDemoMode ? {
            work: 10,       // 10 seconds for demo
            break: 5,       // 5 seconds for demo
            longBreak: 15   // 15 seconds for demo
        } : {
            work: 25 * 60,      // 25 minutes
            break: 5 * 60,      // 5 minutes
            longBreak: 15 * 60  // 15 minutes
        };

        this.timeRemaining = this.sessions.work; // Set initial time based on mode

        this.initializeElements();
        this.loadState();
        this.updateDisplay();
        this.bindEvents();
    }

    initializeElements() {
        this.timeDisplay = document.getElementById('time-remaining');
        this.sessionTypeDisplay = document.getElementById('session-type');
        this.currentSessionDisplay = document.getElementById('current-session');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.progressFill = document.getElementById('progress-fill');
        this.soundCheckbox = document.getElementById('sound-enabled');
        this.demoBadge = document.getElementById('demo-badge');
        
        // Show demo badge if in demo mode
        if (this.isDemoMode && this.demoBadge) {
            this.demoBadge.style.display = 'block';
        }
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.soundCheckbox.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            this.saveState();
        });

        // Listen for messages from background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'TIMER_TICK') {
                    this.timeRemaining = message.timeRemaining;
                    this.updateDisplay();
                } else if (message.type === 'SESSION_COMPLETE') {
                    this.onSessionComplete();
                }
            });
        }
    }

    async loadState() {
        try {
            // Check if we're in a Chrome extension context
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get([
                    'isRunning', 'currentSession', 'timeRemaining', 
                    'sessionType', 'soundEnabled'
                ]);
                
                if (result.isRunning !== undefined) this.isRunning = result.isRunning;
                if (result.currentSession !== undefined) this.currentSession = result.currentSession;
                if (result.timeRemaining !== undefined) this.timeRemaining = result.timeRemaining;
                if (result.sessionType !== undefined) this.sessionType = result.sessionType;
                if (result.soundEnabled !== undefined) this.soundEnabled = result.soundEnabled;
            } else {
                // Fallback for demo/testing outside Chrome extension
                console.log('Running in demo mode - Chrome extension APIs not available');
            }
            
            this.soundCheckbox.checked = this.soundEnabled;
            this.updateButtonStates();
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    async saveState() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({
                    isRunning: this.isRunning,
                    currentSession: this.currentSession,
                    timeRemaining: this.timeRemaining,
                    sessionType: this.sessionType,
                    soundEnabled: this.soundEnabled
                });
            }
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    async start() {
        this.isRunning = true;
        this.updateButtonStates();
        this.saveState();
        
        // Send message to background script to start timer
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                await chrome.runtime.sendMessage({
                    type: 'START_TIMER',
                    timeRemaining: this.timeRemaining,
                    sessionType: this.sessionType
                });
            } else {
                // Demo mode - start a local timer
                this.startLocalTimer();
            }
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    }

    async pause() {
        this.isRunning = false;
        this.updateButtonStates();
        this.saveState();
        
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                await chrome.runtime.sendMessage({ type: 'PAUSE_TIMER' });
            } else {
                // Demo mode - clear local timer
                if (this.localTimerId) {
                    clearInterval(this.localTimerId);
                    this.localTimerId = null;
                }
            }
        } catch (error) {
            console.error('Error pausing timer:', error);
        }
    }

    async reset() {
        this.isRunning = false;
        this.currentSession = 1;
        this.sessionType = 'work';
        this.timeRemaining = this.sessions.work;
        this.updateButtonStates();
        this.updateDisplay();
        this.saveState();
        
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                await chrome.runtime.sendMessage({ type: 'RESET_TIMER' });
            } else {
                // Demo mode - clear local timer
                if (this.localTimerId) {
                    clearInterval(this.localTimerId);
                    this.localTimerId = null;
                }
            }
        } catch (error) {
            console.error('Error resetting timer:', error);
        }
    }

    onSessionComplete() {
        this.showCelebration();
        this.playNotificationSound();
        this.nextSession();
        this.updateDisplay();
        this.saveState();
        
        // Auto-start next session
        if (this.isRunning) {
            setTimeout(() => this.start(), 3000); // Wait 3 seconds for celebration
        }
    }

    showCelebration() {
        const overlay = document.getElementById('celebration-overlay');
        const emojiEl = overlay.querySelector('.celebration-emoji');
        const textEl = overlay.querySelector('.celebration-text');
        const subtextEl = overlay.querySelector('.celebration-subtext');
        
        // Set celebration content based on session type
        if (this.sessionType === 'work') {
            emojiEl.textContent = '🎉';
            textEl.textContent = 'Great Work!';
            subtextEl.textContent = 'Time for a break!';
        } else {
            emojiEl.textContent = '☕';
            textEl.textContent = 'Break Time!';
            subtextEl.textContent = 'Ready to focus again?';
        }
        
        // Show celebration
        overlay.style.display = 'flex';
        
        // Hide after 3 seconds
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 3000);
    }

    nextSession() {
        if (this.sessionType === 'work') {
            if (this.currentSession >= this.maxSessions) {
                // Long break after 4 work sessions
                this.sessionType = 'longBreak';
                this.timeRemaining = this.sessions.longBreak;
                this.currentSession = 1; // Reset session count
            } else {
                // Regular break
                this.sessionType = 'break';
                this.timeRemaining = this.sessions.break;
            }
        } else {
            // After any break, go to work
            this.sessionType = 'work';
            this.timeRemaining = this.sessions.work;
            if (this.sessionType !== 'longBreak') {
                this.currentSession++;
            }
        }
    }

    updateDisplay() {
        // Update time display
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Update session type display
        const sessionLabels = {
            work: 'Work Session',
            break: 'Short Break',
            longBreak: 'Long Break'
        };
        this.sessionTypeDisplay.textContent = sessionLabels[this.sessionType];

        // Update current session
        this.currentSessionDisplay.textContent = this.currentSession;

        // Update progress bar
        const totalTime = this.sessions[this.sessionType];
        const progress = ((totalTime - this.timeRemaining) / totalTime) * 100;
        this.progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;

        // Update background color based on session type
        document.body.className = `${this.sessionType}-session`;

        // Add breathing animation when running and pulse when time is low
        if (this.isRunning && this.sessionType === 'work') {
            this.timeDisplay.classList.add('breathe');
        } else {
            this.timeDisplay.classList.remove('breathe');
        }

        // Add pulse animation when time is running low (last 2 minutes)
        if (this.timeRemaining <= 120 && this.isRunning) {
            this.timeDisplay.classList.add('pulse');
        } else {
            this.timeDisplay.classList.remove('pulse');
        }

        // Update cozy message
        this.updateCozyMessage();
    }

    updateCozyMessage() {
        const cozyText = document.getElementById('cozy-text');
        if (!cozyText) return;

        if (this.isRunning) {
            if (this.sessionType === 'work') {
                cozyText.textContent = '🔥 Focus time! You\'ve got this!';
            } else {
                cozyText.textContent = '☕ Take a breather, you earned it!';
            }
        } else {
            cozyText.textContent = '🌟 Ready when you are, friend!';
        }
    }

    updateButtonStates() {
        if (this.isRunning) {
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'block';
        } else {
            this.startBtn.style.display = 'block';
            this.pauseBtn.style.display = 'none';
        }
    }

    async playNotificationSound() {
        if (!this.soundEnabled) return;
        
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                // Send message to background script to play sound
                await chrome.runtime.sendMessage({
                    type: 'PLAY_SOUND',
                    sessionType: this.sessionType
                });
            } else {
                // Demo mode - play sound directly
                this.playDemoSound();
            }
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    startLocalTimer() {
        // Demo timer for testing outside Chrome extension
        if (this.localTimerId) {
            clearInterval(this.localTimerId);
        }
        
        this.localTimerId = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            
            if (this.timeRemaining <= 0) {
                clearInterval(this.localTimerId);
                this.onSessionComplete();
            }
        }, 1000);
    }

    playDemoSound() {
        // Simple beep sound for demo
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('Error playing demo sound:', error);
        }
    }
}

// Initialize the timer when popup opens
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});