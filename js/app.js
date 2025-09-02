// FlowRead Main Application
class FlowReadApp {
    constructor() {
        this.currentScreen = 'test';
        this.currentText = null;
        this.isInitialized = false;
        this.settings = {
            dyslexicFont: false,
            highContrast: false,
            motionSensitive: false
        };
    }

    // Initialize the application
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Wait for storage to initialize
            await storage.init();
            
            // Setup navigation
            this.setupNavigation();
            
            // Setup modal handlers
            this.setupModals();
            
            // Setup settings
            this.setupSettings();
            
            // Load user preferences
            await this.loadUserPreferences();
            
            // Initialize progress tracking
            await progressTracker.init();
            
            // Show test screen by default
            this.showScreen('test');
            
            // Initialize warm-up drills when needed
            this.initializeScreenModules();
            
            this.isInitialized = true;
            
            console.log('FlowRead initialized successfully');
        } catch (error) {
            console.error('Failed to initialize FlowRead:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Setup navigation between screens
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const mode = button.dataset.mode;
                await this.showScreen(mode);
                
                // Update active nav button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }

    // Show specific screen
    async showScreen(screenName) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Initialize screen-specific functionality
            await this.initializeScreen(screenName);
        }
    }

    // Initialize screen-specific modules
    async initializeScreen(screenName) {
        switch (screenName) {
            case 'test':
                await this.initializeTestScreen();
                break;
            case 'train':
                await this.initializeTrainScreen();
                break;
        }
    }

    // Initialize all screen modules
    initializeScreenModules() {
        // This ensures modules are available when screens are accessed
        if (typeof warmUpDrills !== 'undefined') {
            warmUpDrills.init();
        }
    }

    // Initialize home screen
    async initializeHomeScreen() {
        await this.updateHomeStats();
        this.updateActionButtons();
    }

    // Update home stats display
    async updateHomeStats() {
        try {
            const stats = await storage.getStats();
            const sessions = await storage.getRecentSessions(1);
            
            // Update baseline display
            if (stats.totalSessions > 0) {
                document.getElementById('baseline-number').textContent = stats.avgSpeed;
                document.getElementById('speed-context').textContent = this.getSpeedContext(stats.avgSpeed);
                
                // Show improvement if we have multiple sessions
                if (stats.totalSessions > 1 && stats.improvements.speed > 0) {
                    const improvementBadge = document.getElementById('improvement-badge');
                    document.getElementById('improvement-amount').textContent = Math.round(stats.improvements.speed);
                    improvementBadge.style.display = 'block';
                }
            }
            
            // Update overview stats
            document.getElementById('total-sessions').textContent = stats.totalSessions;
            document.getElementById('current-speed').textContent = stats.avgSpeed > 0 ? `${stats.avgSpeed} WPM` : '-- WPM';
            
            // Calculate best speed from recent sessions
            if (sessions.length > 0) {
                const bestSpeed = Math.max(...(await storage.getRecentSessions(20)).map(s => s.actualWpm || s.wpmTarget || 0));
                document.getElementById('best-speed').textContent = bestSpeed > 0 ? `${bestSpeed} WPM` : '-- WPM';
            }
            
        } catch (error) {
            console.error('Failed to update home stats:', error);
        }
    }
    
    // Get contextual description for speed
    getSpeedContext(wpm) {
        if (wpm === 0) return 'Take your first assessment to discover your speed';
        if (wpm < 200) return 'Below average - great potential for improvement!';
        if (wpm < 250) return 'Average reading speed - you can do better!';
        if (wpm < 350) return 'Above average - you\'re doing well!';
        if (wpm < 500) return 'Fast reader - excellent skills!';
        return 'Speed reading champion!';
    }
    
    // Update action buttons based on progress
    updateActionButtons() {
        const hasBaseline = parseInt(document.getElementById('total-sessions').textContent) > 0;
        const primaryAction = document.getElementById('primary-action');
        const trainingAction = document.getElementById('training-action');
        
        if (hasBaseline) {
            primaryAction.textContent = 'Retake Assessment';
            primaryAction.classList.remove('primary-btn');
            primaryAction.classList.add('secondary-btn');
            trainingAction.style.display = 'inline-block';
        } else {
            primaryAction.textContent = 'Discover Your Reading Speed';
            primaryAction.classList.add('primary-btn');
            primaryAction.classList.remove('secondary-btn');
            trainingAction.style.display = 'none';
        }
    }

    // Initialize assessment screen
    initializeAssessmentScreen() {
        // Assessment screen is handled by AssessmentReader class
    }

    // Initialize training screen
    async initializeTrainingScreen() {
        console.log('Initializing training screen...');
        // Training screen is handled by TrainingZone class
        if (typeof trainingZone !== 'undefined') {
            await trainingZone.init();
            console.log('Training zone initialized from app');
        } else {
            console.error('TrainingZone not found!');
        }
        
        // Initialize training mode selection
        this.currentTrainingMode = 'line-by-line';
        this.currentLineViewMode = 'full-text';
        this.currentTextSize = 'medium';
        this.updateTrainingModeDisplay();
    }

    // Initialize progress screen
    async initializeProgressScreen() {
        await progressTracker.refresh();
    }

    // Initialize test screen
    async initializeTestScreen() {
        console.log('Initializing test screen...');
        
        try {
            if (typeof speedTest !== 'undefined') {
                await speedTest.init();
            }
        } catch (error) {
            console.error('Failed to initialize test screen:', error);
        }
    }

    // Initialize train screen (formerly training screen)
    async initializeTrainScreen() {
        console.log('Initializing train screen...');
        
        try {
            if (typeof trainingZone !== 'undefined') {
                await trainingZone.init();
            }
        } catch (error) {
            console.error('Failed to initialize train screen:', error);
        }
    }

    // Setup modal handlers
    setupModals() {
        // Text input modal
        const modal = document.getElementById('text-input-modal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.closeTextModal();
        }
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) {
                    this.closeTextModal();
                }
            };
        }

        // Custom training text modal
        const trainingModal = document.getElementById('custom-training-text-modal');
        
        if (trainingModal) {
            trainingModal.onclick = (e) => {
                if (e.target === trainingModal) {
                    this.closeCustomTrainingTextDialog();
                }
            };
        }

        // Setup custom training text input handler
        const customTrainingTextarea = document.getElementById('custom-training-text');
        if (customTrainingTextarea) {
            customTrainingTextarea.oninput = () => this.updateCustomTextStats();
        }
        
        // Escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTextModal();
                this.closeCustomTrainingTextDialog();
            }
        });
    }

    // Setup settings panel
    setupSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        const settingsToggle = document.querySelector('.settings-toggle');
        
        if (settingsToggle) {
            settingsToggle.onclick = () => this.toggleSettings();
        }
        
        // Settings checkboxes
        const dyslexicFontCheck = document.getElementById('dyslexic-font');
        const highContrastCheck = document.getElementById('high-contrast');
        const motionSensitiveCheck = document.getElementById('motion-sensitive');
        
        if (dyslexicFontCheck) {
            dyslexicFontCheck.onchange = () => this.toggleDyslexicFont(dyslexicFontCheck.checked);
        }
        
        if (highContrastCheck) {
            highContrastCheck.onchange = () => this.toggleHighContrast(highContrastCheck.checked);
        }
        
        if (motionSensitiveCheck) {
            motionSensitiveCheck.onchange = () => this.toggleMotionSensitive(motionSensitiveCheck.checked);
        }
        
        // Click outside to close settings
        document.addEventListener('click', (e) => {
            if (settingsPanel && !settingsPanel.contains(e.target) && !settingsToggle?.contains(e.target)) {
                settingsPanel.classList.remove('active');
            }
        });
    }

    // Load user preferences
    async loadUserPreferences() {
        try {
            const user = await storage.getUser();
            this.settings = { ...this.settings, ...user.preferences };
            
            // Apply settings
            this.applySettings();
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    }

    // Apply settings to UI
    applySettings() {
        const body = document.body;
        
        // Dyslexic font
        if (this.settings.dyslexicFont) {
            body.setAttribute('data-font', 'dyslexic');
        } else {
            body.removeAttribute('data-font');
        }
        
        // High contrast
        if (this.settings.highContrast) {
            body.setAttribute('data-theme', 'high-contrast');
        } else {
            body.removeAttribute('data-theme');
        }
        
        // Motion sensitive
        if (this.settings.motionSensitive) {
            body.classList.add('reduce-motion');
        } else {
            body.classList.remove('reduce-motion');
        }
        
        // Update checkboxes
        const dyslexicCheck = document.getElementById('dyslexic-font');
        const contrastCheck = document.getElementById('high-contrast');
        const motionCheck = document.getElementById('motion-sensitive');
        
        if (dyslexicCheck) dyslexicCheck.checked = this.settings.dyslexicFont;
        if (contrastCheck) contrastCheck.checked = this.settings.highContrast;
        if (motionCheck) motionCheck.checked = this.settings.motionSensitive;
    }

    // Save user preferences
    async saveUserPreferences() {
        try {
            await storage.updateUserPreferences(this.settings);
        } catch (error) {
            console.error('Failed to save user preferences:', error);
        }
    }

    // Settings toggle handlers
    toggleSettings() {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel) {
            settingsPanel.classList.toggle('active');
        }
    }

    async toggleDyslexicFont(enabled) {
        this.settings.dyslexicFont = enabled;
        this.applySettings();
        await this.saveUserPreferences();
    }

    async toggleHighContrast(enabled) {
        this.settings.highContrast = enabled;
        this.applySettings();
        await this.saveUserPreferences();
    }

    async toggleMotionSensitive(enabled) {
        this.settings.motionSensitive = enabled;
        this.applySettings();
        await this.saveUserPreferences();
    }

    // Text input modal handlers
    showTextInput() {
        const modal = document.getElementById('text-input-modal');
        if (modal) {
            modal.classList.add('active');
            
            const textarea = document.getElementById('custom-text');
            if (textarea) {
                textarea.focus();
            }
        }
    }

    closeTextModal() {
        const modal = document.getElementById('text-input-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Use custom text
    async useCustomText() {
        const textarea = document.getElementById('custom-text');
        if (!textarea) return;
        
        const text = textarea.value.trim();
        if (!text) {
            this.showError('Please enter some text to read.');
            return;
        }
        
        if (text.length < 50) {
            this.showError('Text should be at least 50 characters long for meaningful practice.');
            return;
        }
        
        this.currentText = text;
        this.closeTextModal();
        
        // Start assessment with custom text
        this.showScreen('assessment');
        await assessmentReader.start(text);
    }

    // Custom training text modal handlers
    showCustomTextDialog() {
        const modal = document.getElementById('custom-training-text-modal');
        if (modal) {
            modal.classList.add('active');
            
            const textarea = document.getElementById('custom-training-text');
            if (textarea) {
                textarea.focus();
                this.updateCustomTextStats();
            }
        }
    }

    closeCustomTrainingTextDialog() {
        const modal = document.getElementById('custom-training-text-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    updateCustomTextStats() {
        const textarea = document.getElementById('custom-training-text');
        const wordCountEl = document.getElementById('word-count');
        const estimatedTimeEl = document.getElementById('estimated-time');
        
        if (!textarea || !wordCountEl || !estimatedTimeEl) return;
        
        const text = textarea.value.trim();
        const wordCount = text ? textProcessor.countWords(text) : 0;
        
        // Estimate reading time at average speed (250 WPM)
        const estimatedMinutes = Math.ceil(wordCount / 250);
        
        wordCountEl.textContent = wordCount;
        estimatedTimeEl.textContent = estimatedMinutes === 1 ? '1 min' : `${estimatedMinutes} min`;
    }

    async useCustomTrainingText() {
        const textarea = document.getElementById('custom-training-text');
        if (!textarea) return;
        
        const text = textarea.value.trim();
        if (!text) {
            this.showError('Please enter some text for training.');
            return;
        }
        
        if (text.length < 100) {
            this.showError('Training text should be at least 100 characters long for effective practice.');
            return;
        }
        
        if (textProcessor.countWords(text) < 50) {
            this.showError('Training text should contain at least 50 words for effective practice.');
            return;
        }
        
        // Clear the textarea
        textarea.value = '';
        this.updateCustomTextStats();
        this.closeCustomTrainingTextDialog();
        
        // Set the custom text for training
        if (typeof trainingZone !== 'undefined') {
            trainingZone.setCustomText(text);
            this.showSuccess('Custom text loaded! Start training to use your text.');
        }
    }

    // Training mode selection
    selectTrainingMode(mode) {
        this.currentTrainingMode = mode;
        console.log('Selected training mode:', mode);
        
        // Update UI
        this.updateTrainingModeDisplay();
        
        // Update training zone mode
        if (typeof trainingZone !== 'undefined') {
            trainingZone.setMode(mode);
        }
    }

    // Set line-by-line view mode
    setLineViewMode(viewMode) {
        this.currentLineViewMode = viewMode;
        console.log('Selected line view mode:', viewMode);
        
        // Update UI
        this.updateLineViewModeDisplay();
        
        // Update training zone view mode
        if (typeof trainingZone !== 'undefined') {
            trainingZone.setLineViewMode(viewMode);
        }
    }

    // Set text size
    setTextSize(size) {
        this.currentTextSize = size;
        console.log('Selected text size:', size);
        
        // Update UI
        this.updateTextSizeDisplay();
        
        // Apply size class to training display
        const trainingDisplay = document.querySelector('.training-display');
        if (trainingDisplay) {
            // Remove existing size classes
            trainingDisplay.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
            // Add new size class
            trainingDisplay.classList.add(`text-size-${size}`);
        }
    }

    updateTextSizeDisplay() {
        // Update size toggle buttons
        const sizeBtns = document.querySelectorAll('.size-toggle-btn');
        sizeBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.size === this.currentTextSize) {
                btn.classList.add('active');
            }
        });
    }

    updateLineViewModeDisplay() {
        // Update inline toggle buttons
        const toggleBtns = document.querySelectorAll('.inline-toggle-btn');
        toggleBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === this.currentLineViewMode) {
                btn.classList.add('active');
            }
        });

        // Show/hide appropriate line training areas
        const fullTextView = document.querySelector('.full-text-view');
        const singleLineView = document.querySelector('.single-line-view');
        
        if (fullTextView && singleLineView) {
            if (this.currentLineViewMode === 'full-text') {
                fullTextView.style.display = 'block';
                singleLineView.style.display = 'none';
            } else {
                fullTextView.style.display = 'none';
                singleLineView.style.display = 'block';
            }
        }
    }

    updateTrainingModeDisplay() {
        // Update mode tabs
        const modeTabs = document.querySelectorAll('.mode-tab');
        modeTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.mode === this.currentTrainingMode) {
                tab.classList.add('active');
            }
        });

        // Update mode instructions
        const instructionsEl = document.getElementById('mode-instructions');
        if (instructionsEl) {
            const instructionsP = instructionsEl.querySelector('p');
            if (instructionsP) {
                if (this.currentTrainingMode === 'line-by-line') {
                    instructionsP.textContent = 'Read line by line with guided pacing to build smooth reading flow and reduce subvocalization. Perfect for developing natural reading rhythm.';
                } else {
                    instructionsP.textContent = 'Focus on individual words flashing at high speed to eliminate inner voice and boost reading speed. Ideal for breaking subvocalization habits.';
                }
            }
        }

        // Update start button text
        const startBtn = document.getElementById('start-training');
        const startBtnText = startBtn?.querySelector('.btn-text');
        if (startBtnText) {
            startBtnText.textContent = '▶️ START';
        }

        // Show/hide view mode toggle (only for line-by-line)
        const viewModeSection = document.getElementById('view-mode-section');
        if (viewModeSection) {
            if (this.currentTrainingMode === 'line-by-line') {
                viewModeSection.style.display = 'block';
                this.updateLineViewModeDisplay();
            } else {
                viewModeSection.style.display = 'none';
            }
        }

        // Update text size display
        this.updateTextSizeDisplay();
        
        // Apply default text size
        const trainingDisplay = document.querySelector('.training-display');
        if (trainingDisplay && !trainingDisplay.classList.contains('text-size-small') && 
            !trainingDisplay.classList.contains('text-size-medium') && 
            !trainingDisplay.classList.contains('text-size-large')) {
            trainingDisplay.classList.add('text-size-medium');
        }

        // Show/hide appropriate training areas
        const lineAreas = document.querySelectorAll('.line-by-line-area');
        const wordArea = document.querySelector('.word-by-word-area');
        
        if (this.currentTrainingMode === 'line-by-line') {
            lineAreas.forEach(area => area.style.display = area.classList.contains('full-text-view') && this.currentLineViewMode === 'full-text' ? 'block' : 
                area.classList.contains('single-line-view') && this.currentLineViewMode === 'single-line' ? 'block' : 'none');
            if (wordArea) wordArea.style.display = 'none';
        } else {
            lineAreas.forEach(area => area.style.display = 'none');
            if (wordArea) wordArea.style.display = 'block';
        }
    }

    // Start assessment
    async startAssessment() {
        await this.showScreen('assessment');
        await assessmentReader.start();
    }
    
    // Start training
    async startTraining() {
        await this.showScreen('training');
        if (typeof trainingZone !== 'undefined') {
            await trainingZone.start();
        }
    }

    // Navigation helpers
    showHome() {
        this.showScreen('home');
        this.updateNavigation('home');
    }

    showProgress() {
        this.showScreen('progress');
        this.updateNavigation('progress');
    }

    updateNavigation(activeScreen) {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === activeScreen) {
                btn.classList.add('active');
            }
        });
    }

    // Error handling
    showError(message) {
        // Create error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'error-toast';
        errorToast.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close">&times;</button>
            </div>
        `;
        
        // Add styles
        errorToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 1rem;
            max-width: 400px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(errorToast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorToast.parentNode) {
                errorToast.parentNode.removeChild(errorToast);
            }
        }, 5000);
        
        // Manual close
        const closeBtn = errorToast.querySelector('.error-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                if (errorToast.parentNode) {
                    errorToast.parentNode.removeChild(errorToast);
                }
            };
        }
    }

    // Success message
    showSuccess(message) {
        const successToast = document.createElement('div');
        successToast.className = 'success-toast';
        successToast.innerHTML = `
            <div class="success-content">
                <span class="success-icon">✓</span>
                <span class="success-message">${message}</span>
            </div>
        `;
        
        successToast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dcfce7;
            border: 1px solid #bbf7d0;
            border-radius: 6px;
            padding: 1rem;
            max-width: 400px;
            z-index: 1000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        document.body.appendChild(successToast);
        
        setTimeout(() => {
            if (successToast.parentNode) {
                successToast.parentNode.removeChild(successToast);
            }
        }, 3000);
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch (e.key) {
                case '1':
                    this.showScreen('baseline');
                    break;
                case '2':
                    this.showScreen('warmup');
                    break;
                case '3':
                    this.showScreen('mainread');
                    break;
                case '4':
                    this.showScreen('progress');
                    break;
                case 'h':
                    this.showScreen('home');
                    break;
                case 's':
                    this.toggleSettings();
                    break;
            }
        });
    }

    // Get app statistics
    async getAppStats() {
        return {
            totalSessions: await storage.getAll('session').then(sessions => sessions.length),
            totalTexts: await storage.getAll('text').then(texts => texts.length),
            totalDrills: await storage.getAll('drills').then(drills => drills.length),
            userLevel: progressTracker.getReadingLevel(),
            currentStats: await storage.getStats()
        };
    }

    // Export user data
    async exportData() {
        try {
            const data = {
                user: await storage.getUser(),
                sessions: await storage.getAll('session'),
                texts: await storage.getAll('text'),
                comprehension: await storage.getAll('comprehension'),
                drills: await storage.getAll('drills'),
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `flowread-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccess('Data exported successfully!');
        } catch (error) {
            console.error('Failed to export data:', error);
            this.showError('Failed to export data. Please try again.');
        }
    }

    // Clear all data (with confirmation)
    async clearAllData() {
        if (!confirm('Are you sure you want to clear all FlowRead data? This cannot be undone.')) {
            return;
        }
        
        if (!confirm('This will delete all your reading sessions, progress, and preferences. Continue?')) {
            return;
        }
        
        try {
            // Clear IndexedDB
            const stores = ['user', 'text', 'session', 'comprehension', 'drills', 'retention'];
            
            for (const store of stores) {
                const allData = await storage.getAll(store);
                for (const item of allData) {
                    await storage.delete(store, item.id);
                }
            }
            
            this.showSuccess('All data cleared successfully!');
            
            // Reinitialize
            await this.init();
            this.showScreen('home');
            
        } catch (error) {
            console.error('Failed to clear data:', error);
            this.showError('Failed to clear data. Please try again.');
        }
    }
}

// Global functions for HTML onclick handlers
function startAssessment() {
    app.startAssessment();
}

function startTraining() {
    app.startTraining();
}

function showTextInput() {
    app.showTextInput();
}

function closeTextModal() {
    app.closeTextModal();
}

function useCustomText() {
    app.useCustomText();
}

function toggleSettings() {
    app.toggleSettings();
}

function showCustomTextDialog() {
    app.showCustomTextDialog();
}

function closeCustomTrainingTextDialog() {
    app.closeCustomTrainingTextDialog();
}

function useCustomTrainingText() {
    app.useCustomTrainingText();
}

function selectTrainingMode(mode) {
    app.selectTrainingMode(mode);
}

function setLineViewMode(viewMode) {
    app.setLineViewMode(viewMode);
}

function setTextSize(size) {
    app.setTextSize(size);
}

// Initialize app when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', async () => {
    app = new FlowReadApp();
    
    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading';
    loadingDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            z-index: 1000;
        ">
            <h3>Loading FlowRead...</h3>
            <p style="color: #6b7280;">Initializing your reading trainer</p>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
    
    try {
        await app.init();
        
        // Setup keyboard shortcuts
        app.setupKeyboardShortcuts();
        
        // Remove loading indicator
        if (loadingDiv.parentNode) {
            loadingDiv.parentNode.removeChild(loadingDiv);
        }
        
    } catch (error) {
        console.error('Failed to initialize FlowRead:', error);
        
        // Show error instead of loading
        loadingDiv.innerHTML = `
            <div style="text-align: center; color: #dc2626;">
                <h3>Failed to Load FlowRead</h3>
                <p>Please refresh the page to try again.</p>
                <button onclick="location.reload()" style="
                    background: #dc2626;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 1rem;
                ">Refresh Page</button>
            </div>
        `;
    }
});

// Export app for debugging
window.FlowReadApp = app;