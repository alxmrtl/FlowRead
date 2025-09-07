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
        this.textManager = new TextManager();
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
            
            // Initialize training settings to match HTML default (word-by-word is active)
            this.setTrainingMode('word-by-word');
            this.currentTextSize = 'medium';
            this.setupTrainingControls();
            
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
            
            // Load font preference from localStorage
            const savedFont = localStorage.getItem('flowread_font_type');
            if (savedFont) {
                this.settings.fontType = savedFont;
            } else {
                this.settings.fontType = 'serif'; // Default to serif
            }
            
            // Apply settings
            this.applySettings();
        } catch (error) {
            console.error('Failed to load user preferences:', error);
        }
    }

    // Apply settings to UI
    applySettings() {
        const body = document.body;
        
        // Apply font setting
        if (this.settings.fontType) {
            this.toggleFont(this.settings.fontType);
        }
        
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
        
        const text = textarea.value ? String(textarea.value).trim() : '';
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
        
        const text = textarea.value ? String(textarea.value).trim() : '';
        const wordCount = text ? textProcessor.countWords(text) : 0;
        
        // Estimate reading time at average speed (250 WPM)
        const estimatedMinutes = Math.ceil(wordCount / 250);
        
        wordCountEl.textContent = wordCount;
        estimatedTimeEl.textContent = estimatedMinutes === 1 ? '1 min' : `${estimatedMinutes} min`;
    }

    async useCustomTrainingText() {
        const textarea = document.getElementById('custom-training-text');
        if (!textarea) return;
        
        const text = textarea.value ? String(textarea.value).trim() : '';
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

    // Setup training controls
    setupTrainingControls() {
        try {
            // Load saved texts into dropdown
            this.updateTextDropdown();
            
            // Setup custom text title and textarea
            const titleInput = document.getElementById('custom-text-title');
            const textArea = document.getElementById('custom-training-text');
            
            if (titleInput && textArea) {
                // Auto-generate title placeholder as user types
                textArea.oninput = () => {
                    this.updateCustomTextStats();
                    if (!titleInput.value && textArea.value) {
                        titleInput.placeholder = this.generateTitleFromContent(textArea.value);
                    }
                };
                
                titleInput.oninput = () => {
                    // Clear auto-generated placeholder when user types their own title
                    if (titleInput.value) {
                        titleInput.placeholder = 'Enter a title for this text...';
                    }
                };
            }
        } catch (error) {
            console.error('Error setting up training controls:', error);
        }
    }

    // Update custom text statistics in modal
    updateCustomTextStats() {
        const textArea = document.getElementById('custom-training-text');
        const wordCountEl = document.getElementById('word-count');
        const estTimeEl = document.getElementById('estimated-time');
        
        if (!textArea || !wordCountEl || !estTimeEl) return;
        
        try {
            const text = textArea.value ? String(textArea.value).trim() : '';
            const wordCount = text ? textProcessor.countWords(text) : 0;
            const estMinutes = Math.ceil(wordCount / 300); // Estimate at 300 WPM
            
            wordCountEl.textContent = wordCount;
            estTimeEl.textContent = estMinutes === 1 ? '1 min' : `${estMinutes} min`;
        } catch (error) {
            console.error('Error updating text stats:', error);
            wordCountEl.textContent = '0';
            estTimeEl.textContent = '0 min';
        }
    }

    // Set training mode (unified interface)
    setTrainingMode(mode) {
        this.currentTrainingMode = mode;
        console.log('Training mode set to:', mode);
        
        // Update training zone mode
        if (typeof trainingZone !== 'undefined') {
            trainingZone.setMode(mode);
        }
        
        // Update mode button states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
        
        // Show/hide appropriate display areas
        const lineArea = document.querySelector('.line-by-line-area');
        const wordArea = document.getElementById('word-training-text');
        const phrasesArea = document.getElementById('phrases-training-text');
        
        if (lineArea) {
            lineArea.style.display = mode === 'line-by-line' ? 'block' : 'none';
        }
        if (wordArea) {
            wordArea.style.display = mode === 'word-by-word' ? 'block' : 'none';
        }
        if (phrasesArea) {
            phrasesArea.style.display = mode === 'phrases' ? 'block' : 'none';
        }
    }

    // Toggle font type (serif/sans)
    toggleFont(fontType) {
        console.log('Font changed to:', fontType);
        
        // Update button states
        document.querySelectorAll('.font-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.font === fontType) {
                btn.classList.add('active');
            }
        });
        
        // Apply font to training areas immediately
        const trainingAreas = [
            document.getElementById('training-text'),
            document.getElementById('word-training-text'),
            document.getElementById('phrases-training-text'),
            document.getElementById('test-content')
        ];
        
        const fontFamily = fontType === 'serif' 
            ? 'Georgia, "Times New Roman", Times, serif'
            : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        
        trainingAreas.forEach(area => {
            if (area) {
                area.style.fontFamily = fontFamily;
            }
        });
        
        // Save preference
        this.settings.fontType = fontType;
        localStorage.setItem('flowread_font_type', fontType);
    }

    // Load sample or saved text
    loadSampleText(index) {
        if (!index) return; // Empty selection
        
        console.log('Loading text:', index);
        
        if (index.startsWith('sample-')) {
            // Handle sample texts
            const sampleIndex = parseInt(index.replace('sample-', ''));
            const sampleTexts = storage.getSampleTexts();
            const selectedText = sampleTexts[sampleIndex];
            
            if (selectedText && typeof trainingZone !== 'undefined') {
                trainingZone.setCustomText(selectedText.content);
                console.log('Sample text loaded:', selectedText.title);
            }
        } else if (index.startsWith('saved-')) {
            // Handle saved texts
            const savedId = index.replace('saved-', '');
            const savedText = this.getSavedTextById(savedId);
            
            if (savedText && typeof trainingZone !== 'undefined') {
                trainingZone.setCustomText(savedText.content);
                console.log('Saved text loaded:', savedText.title);
            }
        }
    }

    // Saved texts management
    getSavedTexts() {
        try {
            const saved = localStorage.getItem('flowread_saved_texts');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved texts:', error);
            return [];
        }
    }

    getSavedTextById(id) {
        const savedTexts = this.getSavedTexts();
        return savedTexts.find(text => text.id === id);
    }

    saveText(title, content) {
        try {
            // Ensure content is a string and validate input
            const contentStr = content ? String(content) : '';
            if (!contentStr || contentStr.trim().length < 10) {
                throw new Error('Text must be at least 10 characters long');
            }
            
            if (contentStr.length > 50000) {
                throw new Error('Text is too long (max 50,000 characters)');
            }

            const savedTexts = this.getSavedTexts();
            
            // Check limits
            if (savedTexts.length >= 20) {
                throw new Error('Maximum of 20 saved texts allowed');
            }

            // Generate unique ID and clean title
            const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            const cleanTitle = this.sanitizeTitle(title) || this.generateTitleFromContent(contentStr);
            const finalTitle = this.ensureUniqueTitle(cleanTitle, savedTexts);
            
            // Create saved text object
            const savedText = {
                id: id,
                title: finalTitle,
                content: this.sanitizeContent(contentStr),
                wordCount: textProcessor.countWords(contentStr),
                dateCreated: new Date().toISOString()
            };

            // Save to localStorage
            savedTexts.push(savedText);
            localStorage.setItem('flowread_saved_texts', JSON.stringify(savedTexts));
            
            // Update dropdown
            this.updateTextDropdown();
            
            return savedText;
        } catch (error) {
            console.error('Error saving text:', error);
            this.showError(error.message);
            return null;
        }
    }

    deleteSavedText(id) {
        try {
            const savedTexts = this.getSavedTexts();
            const filteredTexts = savedTexts.filter(text => text.id !== id);
            localStorage.setItem('flowread_saved_texts', JSON.stringify(filteredTexts));
            this.updateTextDropdown();
            return true;
        } catch (error) {
            console.error('Error deleting text:', error);
            this.showError('Failed to delete text');
            return false;
        }
    }

    sanitizeTitle(title) {
        if (!title) return '';
        const titleStr = String(title);
        return titleStr.trim().replace(/[<>]/g, '').substring(0, 50);
    }

    sanitizeContent(content) {
        if (!content) return '';
        const contentStr = String(content);
        return contentStr.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    generateTitleFromContent(content) {
        if (!content) return 'Untitled Text';
        const contentStr = String(content);
        const cleaned = contentStr.trim().replace(/\s+/g, ' ');
        return cleaned.substring(0, 30).trim() + (cleaned.length > 30 ? '...' : '');
    }

    ensureUniqueTitle(title, existingTexts) {
        const baseName = title;
        let counter = 1;
        let finalName = baseName;
        
        while (existingTexts.some(text => text.title === finalName)) {
            counter++;
            finalName = `${baseName} (${counter})`;
        }
        
        return finalName;
    }

    updateTextDropdown() {
        const dropdownMenu = document.getElementById('text-dropdown-menu');
        if (!dropdownMenu) return;

        // Clear all existing items
        dropdownMenu.innerHTML = '';

        // Get sample texts and convert them to the same format as saved texts
        const sampleTexts = storage.getSampleTexts();
        const savedTexts = this.getSavedTexts();
        
        // Combine sample texts and saved texts
        const allTexts = [];
        
        // Add sample texts with deletable format
        sampleTexts.forEach((sampleTextObj, index) => {
            allTexts.push({
                id: `sample-${index}`,
                title: sampleTextObj.title || `Sample Text ${index + 1}`,
                content: sampleTextObj.content,
                wordCount: textProcessor.countWords(sampleTextObj.content),
                isSample: true
            });
        });
        
        // Add saved texts
        savedTexts.forEach(text => {
            allTexts.push({
                ...text,
                id: `saved-${text.id}`,
                isSample: false
            });
        });

        // Add all texts to dropdown
        allTexts.forEach(text => {
            const item = document.createElement('div');
            item.className = 'dropdown-item saved-text-item';
            
            const wordDisplay = text.wordCount > 999 ? 
                `${(text.wordCount/1000).toFixed(1)}k` : 
                text.wordCount.toString();
            
            item.innerHTML = `
                <div class="saved-text-info">
                    <span>${this.escapeHtml(text.title)}</span>
                    <span class="text-word-count">(${wordDisplay} words)</span>
                </div>
                <button class="delete-saved-text" onclick="event.stopPropagation(); deleteSavedTextWithConfirmation('${text.id}', '${this.escapeHtml(text.title)}')">×</button>
            `;
            
            item.onclick = () => this.selectText(text.id);
            dropdownMenu.appendChild(item);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    selectText(value) {
        this.closeTextDropdown();
        this.loadSampleText(value);
        
        // Update dropdown label
        const label = document.getElementById('dropdown-label');
        if (label) {
            if (value.startsWith('sample-')) {
                const sampleIndex = parseInt(value.replace('sample-', ''));
                const sampleTexts = storage.getSampleTexts();
                const selectedSample = sampleTexts[sampleIndex];
                if (selectedSample) {
                    label.textContent = selectedSample.title;
                } else {
                    label.textContent = `Sample Text ${sampleIndex + 1}`;
                }
            } else if (value.startsWith('saved-')) {
                const savedId = value.replace('saved-', '');
                const savedText = this.getSavedTextById(savedId);
                if (savedText) {
                    label.textContent = savedText.title;
                }
            }
        }
    }

    closeTextDropdown() {
        const dropdown = document.getElementById('text-dropdown-menu');
        const toggle = document.querySelector('.dropdown-toggle');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
        if (toggle) {
            toggle.classList.remove('active');
        }
    }

    // Set text size (now accepts pixel value)
    setTextSize(sizePx) {
        this.currentTextSize = sizePx;
        console.log('Selected text size:', sizePx + 'px');
        
        // Update UI
        this.updateTextSizeDisplay();
        
        // Apply size directly via CSS custom property
        const trainingDisplay = document.querySelector('.training-display');
        if (trainingDisplay) {
            trainingDisplay.style.setProperty('--dynamic-font-size', sizePx + 'px');
        }
        
        // Also apply to test content
        const testContent = document.getElementById('test-content');
        if (testContent) {
            testContent.style.setProperty('--dynamic-font-size', sizePx + 'px');
        }
    }

    updateTextSizeDisplay() {
        // Update size slider and value display
        const sizeSlider = document.getElementById('text-size-slider');
        const sizeValue = document.getElementById('size-value');
        
        if (sizeSlider && this.currentTextSize) {
            sizeSlider.value = this.currentTextSize;
        }
        
        if (sizeValue && this.currentTextSize) {
            sizeValue.textContent = this.currentTextSize;
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

function setTrainingMode(mode) {
    app.setTrainingMode(mode);
}

function setTextSize(size) {
    app.setTextSize(size);
}
function toggleFont(fontType) {
    app.toggleFont(fontType);
}

function useCustomTextOnce() {
    const textArea = document.getElementById('custom-training-text');
    const text = textArea?.value ? textArea.value.trim() : '';
    
    if (!text || text.length < 10) {
        app.showError('Please enter at least 10 characters of text.');
        return;
    }
    
    // Use text without saving
    if (typeof trainingZone !== 'undefined') {
        trainingZone.setCustomText(text);
    }
    
    // Clear and close modal
    textArea.value = '';
    document.getElementById('custom-text-title').value = '';
    app.updateCustomTextStats();
    app.closeCustomTrainingTextDialog();
    
    app.showSuccess('Text loaded for training!');
}

function saveAndUseCustomText() {
    const titleInput = document.getElementById('custom-text-title');
    const textArea = document.getElementById('custom-training-text');
    const title = titleInput?.value ? titleInput.value.trim() : '';
    const text = textArea?.value ? textArea.value.trim() : '';
    
    if (!text || text.length < 10) {
        app.showError('Please enter at least 10 characters of text.');
        return;
    }
    
    // Show loading state
    const saveBtn = document.querySelector('.primary-btn');
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
    saveBtn.disabled = true;
    
    try {
        // Save the text
        const savedText = app.saveText(title, text);
        
        if (savedText) {
            // Use the saved text
            if (typeof trainingZone !== 'undefined') {
                trainingZone.setCustomText(savedText.content);
            }
            
            // Update dropdown label to show the saved text
            const label = document.getElementById('dropdown-label');
            if (label) {
                label.textContent = savedText.title;
            }
            
            // Clear and close modal
            titleInput.value = '';
            textArea.value = '';
            app.updateCustomTextStats();
            app.closeCustomTrainingTextDialog();
            
            app.showSuccess(`"${savedText.title}" saved and loaded for training!`);
        }
    } catch (error) {
        console.error('Error saving text:', error);
        app.showError('Failed to save text');
    } finally {
        // Reset button
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

function deleteSavedTextWithConfirmation(id, title) {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
        if (app.deleteSavedText(id)) {
            app.showSuccess('Text deleted successfully');
            // Reset dropdown label if the deleted text was selected
            const label = document.getElementById('dropdown-label');
            if (label && label.textContent === title) {
                label.textContent = 'SAVED TEXTS';
            }
        }
    }
}


function selectText(value) {
    app.selectText(value);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('text-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        app.closeTextDropdown();
    }
});


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

// Panel toggle functions
function toggleTrainingPanel() {
    const panel = document.getElementById('training-panel');
    if (panel) {
        panel.classList.toggle('collapsed');
    }
}

function toggleTestInstructions() {
    const instructions = document.getElementById('test-instructions');
    if (instructions) {
        instructions.classList.toggle('collapsed');
    }
}

function toggleTestHistory() {
    const historySection = document.querySelector('.dashboard-test-history');
    const content = document.getElementById('test-history-content');
    
    if (historySection && content) {
        const isCollapsed = historySection.classList.contains('collapsed');
        
        if (isCollapsed) {
            historySection.classList.remove('collapsed');
            content.style.display = 'block';
            // Load test history when expanded
            if (typeof speedTest !== 'undefined') {
                speedTest.populateTestHistory();
            }
        } else {
            historySection.classList.add('collapsed');
            content.style.display = 'none';
        }
    }
}

// Global function for deleting text with confirmation
function deleteSavedTextWithConfirmation(id, title) {
    if (confirm(`Delete "${title}"?`)) {
        if (id.startsWith('sample-')) {
            const sampleIndex = parseInt(id.replace('sample-', ''));
            if (storage && storage.deleteSampleText(sampleIndex)) {
                // Reset dropdown to default if the deleted text was selected
                const label = document.getElementById('dropdown-label');
                if (label && label.textContent === title) {
                    label.textContent = 'Choose Text';
                }
                // Update the dropdown to reflect the deletion
                if (app) {
                    app.updateTextDropdown();
                    app.showSuccess('Sample text deleted successfully');
                }
            } else {
                if (app) app.showError('Failed to delete sample text');
            }
        } else {
            const savedId = id.replace('saved-', '');
            if (app && app.deleteSavedText(savedId)) {
                // Reset dropdown to default if the deleted text was selected
                const label = document.getElementById('dropdown-label');
                if (label && label.textContent === title) {
                    label.textContent = 'Choose Text';
                }
                app.showSuccess('Text deleted successfully');
            }
        }
    }
}

// Auto-collapse functions
function collapseTrainingPanel() {
    const panel = document.getElementById('training-panel');
    if (panel && !panel.classList.contains('collapsed')) {
        panel.classList.add('collapsed');
    }
}

function collapseTestInstructions() {
    const instructions = document.getElementById('test-instructions');
    if (instructions && !instructions.classList.contains('collapsed')) {
        instructions.classList.add('collapsed');
    }
}

// Text Management System
class TextManager {
    constructor() {
        this.selectedTextId = null;
        this.currentText = null;
    }

    async init() {
        await this.loadSavedTexts();
        this.updateCurrentTextDisplay();
    }

    async loadSavedTexts() {
        const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
        const sampleTexts = this.getSampleTexts();
        this.renderSavedTextsList(savedTexts, sampleTexts);
    }

    getSampleTexts() {
        const allSamples = [
            {
                id: 'sample-1',
                title: 'Speed Reading Basics',
                content: `Speed reading is a collection of reading methods which attempt to increase rates of reading without greatly reducing comprehension or retention. These methods include ways to increase reading speed by reading different parts of words, or by removing subvocalization. The most common speed reading technique is the use of peripheral vision to take in groups of words at once rather than reading each word individually. This technique can dramatically improve reading speed while maintaining good comprehension.

Research has shown that most adults read at an average rate of 200-300 words per minute. However, with proper training and techniques, this rate can be increased to 500-800 words per minute or even higher. The key is to train your eyes to move more efficiently across the text and to reduce the mental voice that many people hear when reading.

One important aspect of speed reading is reducing regression, which is the tendency to go back and re-read words or sentences. This habit significantly slows down reading speed. By training yourself to maintain forward momentum and trust your comprehension, you can eliminate most regression and read much faster.`,
                isSample: true
            },
            {
                id: 'sample-2', 
                title: 'The Science of Learning',
                content: `Learning is a complex neurobiological process that involves the formation and strengthening of neural pathways in the brain. When we encounter new information, neurons create connections called synapses. The more frequently these connections are used, the stronger they become, which is why repetition is such an important part of learning.

The brain's ability to change and adapt throughout life is called neuroplasticity. This means that we can continue learning and improving our cognitive abilities regardless of age. Modern neuroscience has shown that the brain can reorganize itself, form new neural connections, and even generate new neurons in certain regions.

Different types of learning activate different parts of the brain. For example, motor learning involves the cerebellum and motor cortex, while language learning primarily activates areas in the left hemisphere such as Broca's and Wernicke's areas. Understanding how the brain learns can help us develop more effective learning strategies.`,
                isSample: true
            },
            {
                id: 'sample-3',
                title: 'Focus and Concentration',
                content: `In our modern digital age, maintaining focus and concentration has become increasingly challenging. Constant notifications, social media, and multitasking demands have created an environment where sustained attention is difficult to achieve. However, focus is a skill that can be developed and strengthened through practice.

The ability to concentrate deeply is what psychologist Cal Newport calls "deep work" - the ability to focus without distraction on cognitively demanding tasks. This skill is becoming increasingly valuable in our economy, yet it's becoming increasingly rare as people struggle with constant interruptions.

Research shows that it takes an average of 23 minutes and 15 seconds to fully refocus after an interruption. This means that frequent interruptions can severely impact productivity and the quality of work. By creating environments that minimize distractions and practicing sustained attention, we can significantly improve our ability to focus and accomplish meaningful work.`,
                isSample: true
            }
        ];
        
        // Filter out removed samples for this session
        return allSamples.filter(sample => 
            !this.removedSamples || !this.removedSamples.includes(sample.id)
        );
    }

    renderSavedTextsList(savedTexts, sampleTexts = []) {
        const list = document.getElementById('saved-texts-list');
        if (!list) return;

        list.innerHTML = '';
        
        // Add sample texts section
        if (sampleTexts.length > 0) {
            const sampleHeader = document.createElement('div');
            sampleHeader.className = 'text-section-header';
            sampleHeader.innerHTML = '<span>📚 Sample Texts</span>';
            list.appendChild(sampleHeader);
            
            sampleTexts.forEach(text => {
                const item = document.createElement('div');
                item.className = 'saved-text-item sample-text-item';
                item.dataset.textId = text.id;
                const isDefault = this.isDefaultText(text.id);
                if (isDefault) item.classList.add('is-default');
                
                item.innerHTML = `
                    <div class="saved-text-content">
                        <span class="saved-text-item-title">${text.title || 'Untitled'}</span>
                        <span class="saved-text-item-info">${this.getWordCount(text.content)} words</span>
                    </div>
                    <div class="saved-text-actions">
                        <button class="set-default-btn ${isDefault ? 'active' : ''}" onclick="event.stopPropagation(); app.textManager.setDefaultText('${text.id}')" title="${isDefault ? 'Default text' : 'Set as default'}">
                            ${isDefault ? '★' : '☆'}
                        </button>
                        <button class="delete-saved-text sample-text-delete" onclick="event.stopPropagation(); deleteSampleText('${text.id}', '${this.escapeHtml(text.title)}')">×</button>
                    </div>
                `;
                item.onclick = () => this.selectText(text);
                list.appendChild(item);
            });
        }
        
        // Add saved texts section
        if (savedTexts.length > 0) {
            const savedHeader = document.createElement('div');
            savedHeader.className = 'text-section-header';
            savedHeader.innerHTML = '<span>💾 Your Texts</span>';
            list.appendChild(savedHeader);
        }
        
        savedTexts.forEach(text => {
            const item = document.createElement('div');
            item.className = 'saved-text-item';
            item.dataset.textId = text.id;
            const textId = 'saved-' + text.id;
            const isDefault = this.isDefaultText(textId);
            if (isDefault) item.classList.add('is-default');
            
            item.innerHTML = `
                <div class="saved-text-content">
                    <span class="saved-text-item-title">${text.title || 'Untitled'}</span>
                    <span class="saved-text-item-info">${this.getWordCount(text.content)} words</span>
                </div>
                <div class="saved-text-actions">
                    <button class="set-default-btn ${isDefault ? 'active' : ''}" onclick="event.stopPropagation(); app.textManager.setDefaultText('${textId}')" title="${isDefault ? 'Default text' : 'Set as default'}">
                        ${isDefault ? '★' : '☆'}
                    </button>
                    <button class="delete-saved-text" onclick="event.stopPropagation(); deleteSavedTextWithConfirmation('${text.id}', '${this.escapeHtml(text.title)}')">×</button>
                </div>
            `;
            item.onclick = () => this.selectText(text);
            list.appendChild(item);
        });
    }

    selectText(text) {
        this.selectedTextId = text.id;
        this.currentText = text;
        
        // Update UI
        document.querySelectorAll('.saved-text-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.textId === text.id);
        });
        
        // Populate editor
        document.getElementById('text-editor-title').value = text.title || '';
        document.getElementById('text-editor-content').value = text.content || '';
        this.updateWordCount();
        
        // Show/hide appropriate elements
        document.getElementById('text-editor-form').style.display = 'block';
        document.getElementById('text-editor-empty').style.display = 'none';
        document.getElementById('save-text-btn').style.display = 'inline-block';
        document.getElementById('delete-text-btn').style.display = 'inline-block';
    }

    createNewText() {
        this.selectedTextId = Date.now().toString();
        this.currentText = { id: this.selectedTextId, title: '', content: '' };
        
        // Clear selection
        document.querySelectorAll('.saved-text-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Clear and show editor
        document.getElementById('text-editor-title').value = '';
        document.getElementById('text-editor-content').value = '';
        this.updateWordCount();
        
        document.getElementById('text-editor-form').style.display = 'block';
        document.getElementById('text-editor-empty').style.display = 'none';
        document.getElementById('save-text-btn').style.display = 'inline-block';
        document.getElementById('delete-text-btn').style.display = 'none';
        
        // Focus title field
        document.getElementById('text-editor-title').focus();
    }

    async saveCurrentText() {
        const title = document.getElementById('text-editor-title').value.trim();
        const content = document.getElementById('text-editor-content').value.trim();
        
        if (!content || content.length < 10) {
            app.showError('Please enter at least 10 characters of text.');
            return;
        }
        
        this.currentText.title = title || 'Untitled';
        this.currentText.content = content;
        
        // Save to localStorage
        const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
        const existingIndex = savedTexts.findIndex(text => text.id === this.selectedTextId);
        
        if (existingIndex >= 0) {
            savedTexts[existingIndex] = this.currentText;
        } else {
            savedTexts.push(this.currentText);
        }
        
        localStorage.setItem('saved-training-texts', JSON.stringify(savedTexts));
        
        // Refresh the sidebar list to show the newly saved text
        await this.loadSavedTexts();
        
        // Set as current text and close dialog
        await this.useText(this.currentText);
        this.closeDialog();
    }

    async deleteCurrentText() {
        if (!this.selectedTextId) return;
        
        if (confirm('Are you sure you want to delete this text?')) {
            const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
            const filteredTexts = savedTexts.filter(text => text.id !== this.selectedTextId);
            localStorage.setItem('saved-training-texts', JSON.stringify(filteredTexts));
            
            await this.loadSavedTexts();
            this.clearEditor();
        }
    }

    async useText(text) {
        app.currentText = text.content;
        if (typeof trainingZone !== 'undefined') {
            trainingZone.setCustomText(text.content);
        }
        this.updateCurrentTextDisplay(text);
    }

    updateCurrentTextDisplay(text = null) {
        const display = document.getElementById('current-text-display');
        if (!display) return;
        
        const titleEl = display.querySelector('.current-text-title');
        const infoEl = display.querySelector('.current-text-info');
        
        if (text || app.currentText) {
            const currentText = text || { title: 'Current Text', content: app.currentText || '' };
            titleEl.textContent = currentText.title || 'Custom Text';
            infoEl.textContent = `${this.getWordCount(currentText.content)} words`;
        } else {
            titleEl.textContent = 'No text selected';
            infoEl.textContent = '0 words';
        }
    }

    updateWordCount() {
        const content = document.getElementById('text-editor-content').value;
        const wordCount = this.getWordCount(content);
        const estimatedTime = Math.ceil(wordCount / 250); // Assume 250 WPM reading speed
        
        document.getElementById('text-editor-word-count').textContent = wordCount;
        document.getElementById('text-editor-estimated-time').textContent = `${estimatedTime} min`;
    }

    getWordCount(text) {
        return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
    }

    clearEditor() {
        this.selectedTextId = null;
        this.currentText = null;
        
        document.getElementById('text-editor-form').style.display = 'none';
        document.getElementById('text-editor-empty').style.display = 'flex';
        document.getElementById('save-text-btn').style.display = 'none';
        document.getElementById('delete-text-btn').style.display = 'none';
    }

    deleteSampleText(textId) {
        // When a sample text is "deleted", we actually convert it to a saved text
        // that the user can then modify
        const sampleTexts = this.getSampleTexts();
        const sampleText = sampleTexts.find(text => text.id === textId);
        
        if (sampleText) {
            // Create a new saved text based on the sample
            const newText = {
                id: Date.now().toString(),
                title: sampleText.title + ' (Copy)',
                content: sampleText.content,
                created: Date.now()
            };
            
            // Save it to localStorage
            const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
            savedTexts.push(newText);
            localStorage.setItem('saved-training-texts', JSON.stringify(savedTexts));
            
            // Remove the sample from the local list (for this session)
            this.removedSamples = this.removedSamples || [];
            this.removedSamples.push(textId);
            
            // Reload the texts list
            this.loadSavedTexts();
            
            // Auto-select the new text for editing
            this.selectText(newText);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Default text management
    getDefaultTextId() {
        return localStorage.getItem('flowread_default_text_id') || 'sample-0';
    }

    setDefaultText(textId) {
        localStorage.setItem('flowread_default_text_id', textId);
        // Update the UI to reflect the new default
        this.updateSavedTextsListForDefault();
    }

    isDefaultText(textId) {
        return this.getDefaultTextId() === textId;
    }

    updateSavedTextsListForDefault() {
        const defaultTextId = this.getDefaultTextId();
        document.querySelectorAll('.saved-text-item').forEach(item => {
            const textId = item.dataset.textId;
            const isDefault = textId === defaultTextId;
            
            if (isDefault) {
                item.classList.add('is-default');
            } else {
                item.classList.remove('is-default');
            }
        });
    }

    setDefaultText(textId) {
        app.setDefaultText(textId);
        app.showSuccess('Default text updated');
    }

    closeDialog() {
        const modal = document.getElementById('text-management-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
}

// Text Management Functions
function showTextManagementDialog() {
    const modal = document.getElementById('text-management-modal');
    if (modal) {
        modal.classList.add('active');
        app.textManager.init();
        
        // Set up word count updating
        const contentTextarea = document.getElementById('text-editor-content');
        if (contentTextarea) {
            contentTextarea.oninput = () => app.textManager.updateWordCount();
        }
    }
}

function closeTextManagementDialog() {
    app.textManager.closeDialog();
}

function deleteSampleText(textId, title) {
    if (confirm(`Are you sure you want to delete the sample text "${title}"?`)) {
        app.textManager.deleteSampleText(textId);
    }
}

function createNewText() {
    app.textManager.createNewText();
}

function saveCurrentText() {
    app.textManager.saveCurrentText();
}

function deleteCurrentText() {
    app.textManager.deleteCurrentText();
}

// Export app for debugging
window.FlowReadApp = app;