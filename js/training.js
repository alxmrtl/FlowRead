// Phrases Trainer Class (displays 6 words at once)
class PhrasesTrainer {
    constructor() {
        this.phrases = [];
        this.currentPhraseIndex = 0;
        this.isTraining = false;
        this.isPaused = false;
        this.intervalId = null;
        this.wpm = 250;
        this.currentText = '';
        this.customText = null;
    }

    init() {
        console.log('PhrasesTrainer initialized');
    }

    setCustomText(text) {
        this.customText = text;
        console.log('Custom text set for phrases trainer');
    }

    setMode(mode) {
        console.log('Phrases trainer mode set to:', mode);
    }

    startTraining(text, wpm) {
        if (this.isTraining) return;
        
        this.currentText = this.customText || text;
        this.wpm = wpm;
        
        // Create phrases (6 words each)
        const words = this.currentText.replace(/\s+/g, ' ').trim().split(' ');
        this.phrases = [];
        
        for (let i = 0; i < words.length; i += 6) {
            const phrase = words.slice(i, i + 6).join(' ');
            this.phrases.push(phrase);
        }
        
        console.log(`Created ${this.phrases.length} phrases for training`);
        
        this.currentPhraseIndex = 0;
        this.isTraining = true;
        this.isPaused = false;
        
        this.updateDisplay();
        this.startPhraseAnimation();
    }

    updateDisplay() {
        const currentPhraseElement = document.getElementById('current-phrase');
        const totalPhrasesElement = document.getElementById('total-phrases');
        const currentPhraseIndexElement = document.getElementById('current-phrase-index');
        const progressFillElement = document.getElementById('phrase-progress-fill');
        
        if (currentPhraseElement && this.phrases[this.currentPhraseIndex]) {
            currentPhraseElement.textContent = this.phrases[this.currentPhraseIndex];
        }
        
        if (totalPhrasesElement) {
            totalPhrasesElement.textContent = this.phrases.length;
        }
        
        if (currentPhraseIndexElement) {
            currentPhraseIndexElement.textContent = this.currentPhraseIndex + 1;
        }
        
        if (progressFillElement) {
            const progress = ((this.currentPhraseIndex + 1) / this.phrases.length) * 100;
            progressFillElement.style.width = `${progress}%`;
        }
    }

    startPhraseAnimation() {
        if (!this.isTraining || this.isPaused) return;
        
        // Calculate delay based on WPM (6 words per phrase)
        const wordsPerPhrase = 6;
        const delayMs = (60 * 1000 * wordsPerPhrase) / this.wpm;
        
        this.intervalId = setTimeout(() => {
            if (this.isTraining && !this.isPaused) {
                this.currentPhraseIndex++;
                
                if (this.currentPhraseIndex >= this.phrases.length) {
                    this.stopTraining();
                    return;
                }
                
                this.updateDisplay();
                this.startPhraseAnimation();
            }
        }, delayMs);
    }

    pauseTraining() {
        this.isPaused = true;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        console.log('Phrases training paused');
    }

    resumeTraining() {
        this.isPaused = false;
        this.startPhraseAnimation();
        console.log('Phrases training resumed');
    }

    stopTraining() {
        this.isTraining = false;
        this.isPaused = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        console.log('Phrases training stopped');
    }

    updateSpeed(newWpm) {
        this.wpm = newWpm;
        console.log('Phrases trainer speed updated to:', newWpm, 'WPM');
    }

    getCurrentWordIndex() {
        return this.currentPhraseIndex * 6;
    }

    getText() {
        return this.currentText;
    }
}

// Single Line Trainer Class (similar to word-by-word but for lines)
class SingleLineTrainer {
    constructor() {
        this.lines = [];
        this.currentLineIndex = 0;
        this.isTraining = false;
        this.isPaused = false;
        this.wpm = 250;
        this.animationId = null;
        this.customText = null;
    }

    // Initialize single line trainer
    init() {
        console.log('SingleLineTrainer initialized');
    }

    // Set view mode (for compatibility)
    setViewMode(viewMode) {
        console.log('Single line trainer view mode set to:', viewMode);
    }

    // Start single line training
    startTraining(lines, wpm) {
        if (this.isTraining) return;

        this.lines = lines;
        this.currentLineIndex = 0;
        this.wpm = wpm;
        this.isTraining = true;
        this.isPaused = false;

        console.log(`Starting single line training with ${this.lines.length} lines at ${wpm} WPM`);

        // Update UI elements
        this.updateLineDisplay();
        this.updateProgress();

        // Start line animation
        this.animateLines();
    }

    // Animate lines
    animateLines() {
        if (!this.isTraining || this.isPaused) return;

        if (this.currentLineIndex >= this.lines.length) {
            console.log('Single line training complete');
            this.completeTraining();
            return;
        }

        const line = this.lines[this.currentLineIndex];
        
        // Display current line
        const lineDisplay = document.getElementById('current-line-display');
        if (lineDisplay) {
            lineDisplay.textContent = line;
        }

        // Update progress
        this.updateProgress();

        // Calculate timing based on line length and WPM
        const lineWords = textProcessor.countWords(line);
        const wordsPerMs = this.wpm / 60000;
        const lineTime = lineWords / wordsPerMs;
        const totalTime = lineTime + 300; // 300ms pause between lines

        console.log(`Line ${this.currentLineIndex + 1}: "${line.substring(0, 50)}..." (${lineWords} words, ${Math.round(totalTime)}ms)`);

        this.currentLineIndex++;

        // Schedule next line
        this.animationId = setTimeout(() => this.animateLines(), totalTime);
    }

    // Update line display
    updateLineDisplay() {
        const lineDisplay = document.getElementById('current-line-display');
        const totalLinesEl = document.getElementById('total-lines');
        
        if (totalLinesEl) {
            totalLinesEl.textContent = this.lines.length;
        }
        
        if (lineDisplay && this.lines.length > 0) {
            lineDisplay.textContent = this.lines[0] || 'Ready...';
        }
    }

    // Update progress indicators
    updateProgress() {
        const currentLineIndexEl = document.getElementById('current-line-index');
        const progressFill = document.getElementById('line-progress-fill');
        
        if (currentLineIndexEl) {
            currentLineIndexEl.textContent = this.currentLineIndex;
        }
        
        if (progressFill) {
            const percentage = (this.currentLineIndex / this.lines.length) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    // Pause training
    pauseTraining() {
        if (!this.isTraining || this.isPaused) return;
        
        this.isPaused = true;
        
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        const lineDisplay = document.getElementById('current-line-display');
        if (lineDisplay) {
            lineDisplay.style.opacity = '0.5';
        }
        
        console.log('Single line training paused');
    }

    // Resume training
    resumeTraining() {
        if (!this.isTraining || !this.isPaused) return;
        
        this.isPaused = false;
        
        const lineDisplay = document.getElementById('current-line-display');
        if (lineDisplay) {
            lineDisplay.style.opacity = '1';
        }
        
        console.log('Single line training resumed');
        this.animateLines();
    }

    // Stop training
    stopTraining() {
        this.isTraining = false;
        this.isPaused = false;
        
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        console.log('Single line training stopped');
    }

    // Complete training
    completeTraining() {
        this.stopTraining();
        
        // Trigger completion in main training zone
        if (typeof trainingZone !== 'undefined') {
            trainingZone.completeTraining();
        }
        
        console.log(`Single line training completed: ${this.currentLineIndex} lines processed`);
    }

    // Get current line index (for stats)
    getCurrentLineIndex() {
        return this.currentLineIndex;
    }

    // Get lines
    getLines() {
        return this.lines;
    }

    // Update speed during training
    updateSpeed(newWpm) {
        this.wpm = newWpm;
        console.log('Single line trainer speed updated to:', newWpm, 'WPM');
    }
}

// FlowRead Training Zone - Line-by-Line Pacer
class TrainingZone {
    constructor() {
        this.session = null;
        this.isTraining = false;
        this.isPaused = false;
        this.currentLine = 0;
        this.lines = [];
        this.startTime = null;
        this.pausedTime = 0;
        this.settings = {
            wpm: 250
        };
        this.animationId = null;
        this.baselineWPM = 0;
        this.customText = null;
        this.isInitialized = false;
        this.currentMode = 'word-by-word';
        this.currentLineViewMode = 'full-text';
        this.wordTrainer = null;
        this.phrasesTrainer = null;
        this.singleLineTrainer = null;
        this.isStartingUp = false; // Flag to track countdown process
        this.isRamping = false; // Flag to track speed ramping
        this.targetWPM = 250; // Target WPM after ramping
        this.currentRampWPM = 250; // Current ramped WPM
    }

    // Initialize training zone
    async init() {
        console.log('TrainingZone init() starting...');
        
        try {
            await this.loadBaselineSpeed();
            console.log('Baseline speed loaded:', this.baselineWPM);
            
            // Wait a moment for DOM to be ready
            setTimeout(() => {
                this.setupControls();
                console.log('Controls setup complete');
                
                this.loadTrainingText();
                console.log('Training text loaded');
                
                this.updateSpeedSettings();
                console.log('Speed settings updated');
                
                this.isInitialized = true;
                
                // Initialize word trainer and single line trainer
                console.log('Initializing word trainer...');
                this.wordTrainer = new WordByWordTrainer();
                this.wordTrainer.init();
                
                console.log('Initializing single line trainer...');
                this.singleLineTrainer = new SingleLineTrainer();
                this.singleLineTrainer.init();
                console.log('Single line trainer initialized:', !!this.singleLineTrainer);
                
                console.log('TrainingZone initialization complete');
                
                // Schedule a refresh of the current text display after app is fully ready
                setTimeout(() => {
                    this.refreshCurrentTextDisplay();
                }, 500);
            }, 100);
            
        } catch (error) {
            console.error('TrainingZone initialization error:', error);
        }
    }

    // Load baseline speed for comparison
    async loadBaselineSpeed() {
        try {
            const stats = await storage.getStats();
            this.baselineWPM = stats.avgSpeed || 0;
            this.settings.wpm = Math.max(this.baselineWPM, 200); // Start at baseline or 200, whichever is higher
        } catch (error) {
            console.error('Failed to load baseline speed:', error);
            this.baselineWPM = 0;
        }
    }

    // Setup training controls
    setupControls() {
        const speedSlider = document.getElementById('training-speed-slider');
        const speedValue = document.getElementById('speed-value');
        const targetWPMDisplay = document.getElementById('target-wpm-display');
        const vsBaseline = document.getElementById('vs-baseline');
        
        console.log('Setting up controls...');
        console.log('Speed slider found:', !!speedSlider);
        console.log('Speed value found:', !!speedValue);
        console.log('Initial WPM setting:', this.settings.wpm);
        
        // Speed slider
        if (speedSlider && speedValue) {
            speedSlider.value = this.settings.wpm;
            speedValue.textContent = this.settings.wpm;
            
            // Update target WPM display if it exists
            if (targetWPMDisplay) {
                targetWPMDisplay.textContent = `${this.settings.wpm} WPM`;
            }
            
            speedSlider.oninput = () => {
                this.settings.wpm = parseInt(speedSlider.value);
                speedValue.textContent = this.settings.wpm;
                console.log('Speed updated to:', this.settings.wpm, 'WPM');
                
                // Update target WPM display if it exists
                if (targetWPMDisplay) {
                    targetWPMDisplay.textContent = `${this.settings.wpm} WPM`;
                }
                
                this.updateVsBaseline();
                
                // Update running training if active
                this.updateActiveTrainingSpeed();
            };
        } else {
            console.error('Speed controls not found - speedSlider:', !!speedSlider, 'speedValue:', !!speedValue);
        }
        
        // Start training button (primary connection)
        const startTrainingBtn = document.getElementById('start-training');
        if (startTrainingBtn && !startTrainingBtn.hasAttribute('data-listener-attached')) {
            startTrainingBtn.addEventListener('click', () => {
                console.log('Start training button clicked');
                this.startTraining();
            });
            startTrainingBtn.setAttribute('data-listener-attached', 'true');
            console.log('Start training button connected');
        } else if (!startTrainingBtn) {
            console.error('Start training button not found');
        }
        
        // Set up pause and stop buttons with retry mechanism
        this.setupPauseStopButtons();
        
        // Text size slider
        const sizeSlider = document.getElementById('text-size-slider');
        const sizeValue = document.getElementById('size-value');
        
        if (sizeSlider && sizeValue) {
            // Initialize with default value
            sizeSlider.value = 16;
            sizeValue.textContent = 16;
            
            sizeSlider.oninput = () => {
                const fontSize = parseInt(sizeSlider.value);
                sizeValue.textContent = fontSize;
                console.log('Text size updated to:', fontSize + 'px');
                
                // Apply the text size directly via CSS custom property
                const trainingDisplay = document.querySelector('.training-display');
                const testContent = document.getElementById('test-content');
                
                if (trainingDisplay) {
                    trainingDisplay.style.setProperty('--dynamic-font-size', fontSize + 'px');
                }
                if (testContent) {
                    testContent.style.setProperty('--dynamic-font-size', fontSize + 'px');
                }
            };
        } else {
            console.error('Size controls not found - sizeSlider:', !!sizeSlider, 'sizeValue:', !!sizeValue);
        }
        
        // Training start button (already connected above, skip duplicate)
        console.log('Training start button setup complete (avoiding duplicate listener)');
        
        // Initial vs baseline update
        this.updateVsBaseline();
    }

    // Setup pause/stop buttons with retry mechanism
    setupPauseStopButtons() {
        const trySetupButtons = () => {
            const pauseTrainingBtn = document.getElementById('pause-training');
            const stopTrainingBtn = document.getElementById('stop-training');
            
            if (pauseTrainingBtn && !pauseTrainingBtn.hasAttribute('data-listener-attached')) {
                pauseTrainingBtn.addEventListener('click', () => {
                    console.log('Pause/Resume training button clicked');
                    if (this.isPaused) {
                        this.resumeTraining();
                    } else {
                        this.pauseTraining();
                    }
                });
                pauseTrainingBtn.setAttribute('data-listener-attached', 'true');
                console.log('Pause/Resume training button connected');
            }
            
            if (stopTrainingBtn && !stopTrainingBtn.hasAttribute('data-listener-attached')) {
                stopTrainingBtn.addEventListener('click', () => {
                    console.log('Stop training button clicked');
                    this.stopTraining();
                });
                stopTrainingBtn.setAttribute('data-listener-attached', 'true');
                console.log('Stop training button connected');
            }
        };
        
        // Try immediately
        trySetupButtons();
        
        // Also try after a short delay to catch any DOM updates
        setTimeout(trySetupButtons, 500);
    }

    // Update vs baseline display
    updateVsBaseline() {
        const vsBaseline = document.getElementById('vs-baseline');
        if (!vsBaseline || this.baselineWPM === 0) {
            if (vsBaseline) vsBaseline.textContent = 'No baseline';
            return;
        }
        
        const difference = this.settings.wpm - this.baselineWPM;
        const percentage = Math.round((difference / this.baselineWPM) * 100);
        
        if (difference > 0) {
            vsBaseline.textContent = `+${percentage}%`;
            vsBaseline.className = 'stat-number positive';
        } else if (difference < 0) {
            vsBaseline.textContent = `${percentage}%`;
            vsBaseline.className = 'stat-number negative';
        } else {
            vsBaseline.textContent = 'Same';
            vsBaseline.className = 'stat-number';
        }
    }

    // Load training text
    loadTrainingText() {
        // Use custom text if available, otherwise use sample text
        let text;
        let selectedText = null;
        if (this.customText) {
            text = this.customText;
            selectedText = { title: 'Custom Text', content: text };
        } else {
            // Get the default text ID and load that text
            let defaultTextId = 'sample-0'; // fallback
            
            try {
                // Try to get the default text ID from localStorage directly
                defaultTextId = localStorage.getItem('flowread_default_text_id') || 'sample-0';
            } catch (error) {
                console.warn('Could not access default text preference:', error);
            }
            
            if (defaultTextId.startsWith('sample-')) {
                const sampleIndex = parseInt(defaultTextId.replace('sample-', ''));
                const sampleTexts = storage.getSampleTexts();
                const selectedSample = sampleTexts[sampleIndex] || sampleTexts[0];
                text = selectedSample.content;
                selectedText = { title: selectedSample.title, content: text };
            } else if (defaultTextId.startsWith('saved-')) {
                const savedId = defaultTextId.replace('saved-', '');
                let savedText = null;
                
                try {
                    // Try to get saved text from localStorage directly
                    const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
                    savedText = savedTexts.find(text => text.id === savedId);
                } catch (error) {
                    console.warn('Could not access saved texts:', error);
                }
                
                if (savedText) {
                    text = savedText.content;
                    selectedText = { title: savedText.title, content: text };
                } else {
                    // Fallback to first sample
                    const sampleTexts = storage.getSampleTexts();
                    text = sampleTexts[0].content;
                    selectedText = { title: sampleTexts[0].title, content: text };
                }
            } else {
                // Fallback to first sample
                const sampleTexts = storage.getSampleTexts();
                text = sampleTexts[0].content;
                selectedText = { title: sampleTexts[0].title, content: text };
            }
        }
        
        // Update the current text display in the UI
        try {
            if (app && app.textManager && app.textManager.updateCurrentTextDisplay) {
                app.textManager.updateCurrentTextDisplay(selectedText);
            }
        } catch (error) {
            console.warn('Could not update text display:', error);
        }
        
        const textContainer = document.getElementById('training-text');
        if (!textContainer) {
            console.error('Training text container not found');
            return;
        }
        
        // Format text into lines (shorter lines for better pacing)
        const words = textProcessor.getWords(text);
        this.lines = [];
        
        // Create lines of approximately 12-18 words each (longer for less wrapping)
        let currentLine = [];
        words.forEach(word => {
            currentLine.push(word);
            if (currentLine.length >= 15 || word.match(/[.!?]$/)) {
                this.lines.push(currentLine.join(' '));
                currentLine = [];
            }
        });
        
        // Add remaining words
        if (currentLine.length > 0) {
            this.lines.push(currentLine.join(' '));
        }
        
        console.log(`Created ${this.lines.length} lines for training`);
        
        // Create HTML with line spans (more compact spacing)
        const linesHTML = this.lines.map((line, index) => 
            `<div class="text-line" data-line="${index}" style="margin-bottom: 0.25rem; padding: 0.125rem 0;">${line}</div>`
        ).join('');
        
        textContainer.innerHTML = linesHTML + '<div class="line-pacer" id="line-pacer"></div>';
        
        // Position the pacer at the first line
        this.resetPacer();
    }

    // Reset pacer to first line
    resetPacer() {
        const pacer = document.getElementById('line-pacer');
        const firstLine = document.querySelector('.text-line[data-line="0"]');
        
        if (pacer && firstLine) {
            // Position pacer over first line
            pacer.style.top = firstLine.offsetTop + 'px';
            pacer.style.left = '0px';
            pacer.style.width = '100%';
            pacer.style.height = firstLine.offsetHeight + 'px';
            pacer.style.opacity = '0';
            pacer.classList.remove('active');
            console.log('Pacer positioned at first line');
        } else {
            console.error('Could not find pacer or first line elements');
        }
        
        this.currentLine = 0;
    }

    // Start training (handles both modes)
    async startTraining() {
        if (this.isTraining || this.isStartingUp) return;
        
        console.log(`Starting ${this.currentMode} training...`);
        
        // Use smooth countdown start sequence
        return this.startWithCountdown();
    }

    // Start line-by-line training
    async startLineTraining() {
        if (this.isTraining) return;
        
        console.log(`Starting line-by-line training in ${this.currentLineViewMode} mode...`);
        
        // Route to appropriate view mode
        if (this.currentLineViewMode === 'single-line') {
            return this.startSingleLineTraining();
        } else {
            return this.startFullTextTraining();
        }
    }

    // Start full text line training (original method)
    async startFullTextTraining() {
        if (this.isTraining) return;
        
        console.log('Starting full text line-by-line training...');
        
        // Ensure we have text loaded
        if (!this.lines || this.lines.length === 0) {
            console.log('No lines available, loading text...');
            this.loadTrainingText();
        }
        
        // Create session
        this.session = new ReadingSession();
        const text = this.lines.join(' ');
        await this.session.init(text, 'training', {
            wpmTarget: this.settings.wpm,
            title: 'Line-by-Line Speed Training'
        });
        
        this.isTraining = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        this.currentLine = 0;
        
        console.log(`Training started with ${this.lines.length} lines at ${this.settings.wpm} WPM`);
        
        // Update UI
        this.updateTrainingButtons(true);
        
        // Start the line-by-line animation
        this.startLineAnimation();
        
        // Update live stats
        this.startLiveStats();
    }

    // Start word-by-word training
    async startWordTraining() {
        if (this.isTraining) return;
        
        console.log('Starting word-by-word training...');
        
        // Ensure word trainer is ready
        this.ensureWordTrainer();
        
        if (!this.wordTrainer) {
            console.error('Failed to initialize word trainer');
            return;
        }
        
        // Create session
        this.session = new ReadingSession();
        let text;
        if (this.customText) {
            text = this.customText;
        } else {
            const sampleTexts = storage.getSampleTexts();
            text = sampleTexts[0].content;
        }
        
        await this.session.init(text, 'training', {
            wpmTarget: this.settings.wpm,
            title: 'Word-by-Word Speed Training'
        });
        
        this.isTraining = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        
        console.log(`Word training started at ${this.settings.wpm} WPM`);
        
        // Update UI
        this.updateTrainingButtons(true);
        
        // Start word trainer
        this.wordTrainer.startTraining(text, this.settings.wpm);
        
        // Update live stats
        this.startLiveStats();
    }

    // Start phrases training
    async startPhrasesTraining() {
        if (this.isTraining) return;
        
        console.log('Starting phrases training...');
        
        // Ensure phrases trainer is ready
        this.ensurePhrasesTrainer();
        
        if (!this.phrasesTrainer) {
            console.error('Failed to initialize phrases trainer');
            return;
        }
        
        // Create session
        this.session = new ReadingSession();
        let text;
        if (this.customText) {
            text = this.customText;
        } else {
            const sampleTexts = storage.getSampleTexts();
            text = sampleTexts[0].content;
        }
        
        await this.session.init(text, 'training', {
            wpmTarget: this.settings.wpm,
            title: 'Phrases Speed Training'
        });
        
        this.isTraining = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        
        console.log(`Phrases training started at ${this.settings.wpm} WPM`);
        
        // Update UI
        this.updateTrainingButtons(true);
        
        // Start phrases trainer
        this.phrasesTrainer.startTraining(text, this.settings.wpm);
        
        // Update live stats
        this.startLiveStats();
    }

    // Start single line training
    async startSingleLineTraining() {
        if (this.isTraining) return;
        
        console.log('Starting single line training...');
        
        // Ensure single line trainer is ready
        this.ensureSingleLineTrainer();
        
        if (!this.singleLineTrainer) {
            console.error('Failed to initialize single line trainer');
            return;
        }
        
        // Ensure we have text loaded
        if (!this.lines || this.lines.length === 0) {
            console.log('No lines available, loading text...');
            this.loadTrainingText();
        }
        
        // Create session
        this.session = new ReadingSession();
        const text = this.lines.join(' ');
        await this.session.init(text, 'training', {
            wpmTarget: this.settings.wpm,
            title: 'Single Line Speed Training'
        });
        
        this.isTraining = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.pausedTime = 0;
        
        console.log(`Single line training started at ${this.settings.wpm} WPM`);
        
        // Update UI
        this.updateTrainingButtons(true);
        
        // Start single line trainer
        this.singleLineTrainer.startTraining(this.lines, this.settings.wpm);
        
        // Update live stats
        this.startLiveStats();
    }

    // Start line animation
    startLineAnimation() {
        const pacer = document.getElementById('line-pacer');
        if (!pacer) {
            console.error('Line pacer element not found');
            return;
        }
        
        console.log('Starting line animation...');
        pacer.classList.add('active');
        
        const animateLine = () => {
            if (!this.isTraining || this.isPaused) {
                console.log('Animation stopped - training inactive or paused');
                return;
            }
            
            if (this.currentLine >= this.lines.length) {
                console.log('Animation complete - reached end of text');
                this.completeTraining();
                return;
            }
            
            console.log(`Animating line ${this.currentLine + 1}/${this.lines.length}: "${this.lines[this.currentLine].substring(0, 30)}..."`);
            
            // Move pacer to current line
            this.moveToLine(this.currentLine);
            
            // Calculate time for this line (with small pause between lines)
            const lineWords = textProcessor.countWords(this.lines[this.currentLine]);
            const wordsPerMs = this.settings.wpm / 60000;
            const lineTime = lineWords / wordsPerMs;
            const totalTime = lineTime + 150; // Fixed 150ms pause between lines
            
            console.log(`Line has ${lineWords} words, will take ${Math.round(totalTime)}ms`);
            
            this.currentLine++;
            
            // Schedule next line
            this.animationId = setTimeout(animateLine, totalTime);
        };
        
        // Start immediately with first line
        animateLine();
    }

    // Move pacer to specific line
    moveToLine(lineIndex) {
        const pacer = document.getElementById('line-pacer');
        const line = document.querySelector(`.text-line[data-line="${lineIndex}"]`);
        
        if (pacer && line) {
            // Position pacer over the line
            pacer.style.top = line.offsetTop + 'px';
            pacer.style.left = '0px';
            pacer.style.width = '100%';
            pacer.style.height = line.offsetHeight + 'px';
            pacer.style.opacity = '1';
            
            console.log(`Moved pacer to line ${lineIndex}, top: ${line.offsetTop}px`);
            
            // Scroll line into view if needed
            line.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        } else {
            console.error(`Could not find pacer or line ${lineIndex}`);
        }
    }

    // Start live stats updates
    startLiveStats() {
        this.statsInterval = setInterval(() => {
            if (!this.isTraining || this.isPaused) return;
            
            const elapsed = Date.now() - this.startTime - this.pausedTime;
            const elapsedMin = elapsed / 60000;
            
            if (elapsedMin > 0 && this.currentLine > 0) {
                const wordsRead = this.lines.slice(0, this.currentLine)
                    .reduce((total, line) => total + textProcessor.countWords(line), 0);
                
                const liveWPM = Math.round(wordsRead / elapsedMin);
                
                const liveWPMEl = document.getElementById('live-wpm');
                if (liveWPMEl) {
                    liveWPMEl.textContent = `${liveWPM} WPM`;
                }
            }
        }, 1000);
    }

    // Pause training
    pauseTraining() {
        if (!this.isTraining || this.isPaused) return;
        
        this.isPaused = true;
        this.pausedTime = Date.now();
        
        if (this.currentMode === 'word-by-word') {
            this.ensureWordTrainer();
            if (this.wordTrainer) this.wordTrainer.pauseTraining();
        } else if (this.currentMode === 'phrases') {
            this.ensurePhrasesTrainer();
            if (this.phrasesTrainer) this.phrasesTrainer.pauseTraining();
        } else if (this.currentMode === 'line-by-line' && this.currentLineViewMode === 'single-line') {
            this.ensureSingleLineTrainer();
            if (this.singleLineTrainer) this.singleLineTrainer.pauseTraining();
        } else {
            if (this.animationId) {
                clearTimeout(this.animationId);
            }
            
            const pacer = document.getElementById('line-pacer');
            if (pacer) {
                pacer.style.opacity = '0.5';
            }
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        
        // Update pause button to show "Resume"
        this.updatePauseButtonState(true);
        
        this.updateTrainingButtons(false, true);
    }

    // Resume training
    resumeTraining() {
        if (!this.isTraining || !this.isPaused) return;
        
        // Adjust for pause duration
        const pauseDuration = Date.now() - this.pausedTime;
        this.pausedTime = pauseDuration;
        
        this.isPaused = false;
        
        if (this.currentMode === 'word-by-word') {
            this.ensureWordTrainer();
            if (this.wordTrainer) this.wordTrainer.resumeTraining();
        } else if (this.currentMode === 'phrases') {
            this.ensurePhrasesTrainer();
            if (this.phrasesTrainer) this.phrasesTrainer.resumeTraining();
        } else if (this.currentMode === 'line-by-line' && this.currentLineViewMode === 'single-line') {
            this.ensureSingleLineTrainer();
            if (this.singleLineTrainer) this.singleLineTrainer.resumeTraining();
        } else {
            const pacer = document.getElementById('line-pacer');
            if (pacer) {
                pacer.style.opacity = '1';
            }
            
            // Resume animation
            this.startLineAnimation();
        }
        
        // Resume stats
        this.startLiveStats();
        
        // Update pause button to show "Pause"
        this.updatePauseButtonState(false);
        
        this.updateTrainingButtons(true);
    }

    // Stop training and proceed to comprehension
    async stopTraining() {
        if (!this.isTraining) return;
        
        this.isTraining = false;
        this.isPaused = false;
        
        let wordsRead = 0;
        let finalText = '';
        
        if (this.currentMode === 'word-by-word') {
            this.ensureWordTrainer();
            if (this.wordTrainer) {
                this.wordTrainer.stopTraining();
                wordsRead = this.wordTrainer.getCurrentWordIndex();
                finalText = this.wordTrainer.getText();
            }
        } else if (this.currentMode === 'phrases') {
            this.ensurePhrasesTrainer();
            if (this.phrasesTrainer) {
                this.phrasesTrainer.stopTraining();
                wordsRead = this.phrasesTrainer.getCurrentWordIndex();
                finalText = this.phrasesTrainer.getText();
            }
        } else if (this.currentMode === 'line-by-line' && this.currentLineViewMode === 'single-line') {
            this.ensureSingleLineTrainer();
            if (this.singleLineTrainer) {
                this.singleLineTrainer.stopTraining();
                const processedLines = this.singleLineTrainer.getCurrentLineIndex();
                wordsRead = this.lines.slice(0, processedLines)
                    .reduce((total, line) => total + textProcessor.countWords(line), 0);
                finalText = this.singleLineTrainer.getLines().join(' ');
            }
        } else {
            if (this.animationId) {
                clearTimeout(this.animationId);
            }
            
            wordsRead = this.lines.slice(0, this.currentLine)
                .reduce((total, line) => total + textProcessor.countWords(line), 0);
            finalText = this.lines.join(' ');
        }
        
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
        
        // Calculate final stats
        const elapsed = Date.now() - this.startTime - this.pausedTime;
        const elapsedMin = elapsed / 60000;
        const finalWPM = Math.round(wordsRead / elapsedMin);
        
        // Save session
        if (this.session) {
            this.session.endTime = Date.now();
            await this.session.saveSession({
                wordCount: wordsRead,
                durationMs: elapsed,
                wpm: finalWPM,
                technique: this.currentMode === 'word-by-word' ? 'word-pacer' : this.currentMode === 'phrases' ? 'phrases-pacer' : 'line-pacer'
            });
        }
        
        // Update UI
        this.updateTrainingButtons(false);
        
        // Reset pause button to pause state
        this.updatePauseButtonState(false);
        
        console.log(`Training completed: ${wordsRead} words in ${(elapsed/1000).toFixed(1)}s at ${finalWPM} WPM`);
        
        // Reset training state - scroll to top and expand controls
        this.resetTrainingView();
    }
    
    // Reset training view to initial state
    resetTrainingView() {
        // Remove any active highlighting and hide the pacer completely
        const pacer = document.getElementById('line-pacer');
        if (pacer) {
            pacer.classList.remove('active');
            pacer.style.top = '0px';
            pacer.style.opacity = '0';
        }
        
        // Clear any word highlights
        const currentWord = document.getElementById('current-word');
        if (currentWord) {
            currentWord.textContent = '';
        }
        
        // Clear any phrase highlights
        const currentPhrase = document.getElementById('current-phrase');
        if (currentPhrase) {
            currentPhrase.textContent = '';
        }
        
        // Remove any countdown overlays
        const countdownOverlay = document.getElementById('training-countdown-overlay');
        if (countdownOverlay) {
            countdownOverlay.remove();
        }
        
        // Remove glow effects from all training areas
        const trainingAreas = [
            document.getElementById('training-text'),
            document.getElementById('word-training-text'),
            document.getElementById('phrases-training-text')
        ];
        trainingAreas.forEach(area => {
            if (area) {
                area.classList.remove('training-area-glow');
            }
        });
        
        // Reset control bar to initial state
        this.resetControlBarToInitialState();
        
        // Reset startup flag and ramping state
        this.isStartingUp = false;
        this.isRamping = false;
        
        // Reset speed slider to original value
        if (this.settings && this.settings.wpm) {
            this.updateSpeedSliderVisual(this.settings.wpm);
        }
        
        // Reset progress bars
        const progressFill = document.getElementById('word-progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
        
        const phraseProgressFill = document.getElementById('phrase-progress-fill');
        if (phraseProgressFill) {
            phraseProgressFill.style.width = '0%';
        }
        
        // Scroll to top of page
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Expand training controls panel
        const trainingControlsPanel = document.getElementById('training-panel');
        if (trainingControlsPanel && trainingControlsPanel.classList.contains('collapsed')) {
            trainingControlsPanel.classList.remove('collapsed');
        }
        
        console.log('Training view reset to initial state');
    }

    // Complete training (reached end of text)
    completeTraining() {
        this.stopTraining();
    }

    // Update training button states (updated for new persistent control bar)
    updateTrainingButtons(isRunning, isPaused = false) {
        // This method is now handled by the persistent control bar transformation
        // We don't need to modify button visibility anymore since we use seamless transformation
        
        // Only update the old training control bar (hide it always)
        const oldControlBar = document.getElementById('training-control-bar');
        if (oldControlBar) {
            oldControlBar.style.display = 'none';
        }
        
        // The new persistent control bar handles its own state through transformation methods
        console.log('Training button states updated - isRunning:', isRunning, 'isPaused:', isPaused);
        
        // Update training control bar (old system)
        this.updateControlBar(isRunning, isPaused);
    }

    // Update speed settings based on performance
    updateSpeedSettings() {
        const speedSlider = document.getElementById('training-speed-slider');
        const speedValueEl = document.getElementById('speed-value');
        
        // Only update if we're on a page with training controls
        if (speedSlider && speedValueEl && this.baselineWPM > 0) {
            // Set initial training speed to 10-20% above baseline
            const suggestedSpeed = Math.round(this.baselineWPM * 1.15);
            const clampedSpeed = Math.max(100, Math.min(999, suggestedSpeed));
            
            speedSlider.value = clampedSpeed;
            this.settings.wpm = clampedSpeed;
            speedValueEl.textContent = clampedSpeed;
            
            // Update target WPM display if it exists (legacy element)
            const targetWPMEl = document.getElementById('target-wpm-display');
            if (targetWPMEl) {
                targetWPMEl.textContent = `${clampedSpeed} WPM`;
            }
            
            console.log('Speed settings updated to:', clampedSpeed, 'WPM');
        } else {
            console.log('Speed controls not found or baseline not set - skipping speed update');
        }
    }

    // Update pause button state between pause and resume
    updatePauseButtonState(isPaused) {
        const pauseButton = document.getElementById('pause-training');
        if (!pauseButton) return;
        
        const btnText = pauseButton.querySelector('.btn-text');
        if (!btnText) return;
        
        if (isPaused) {
            btnText.textContent = '▶';
        } else {
            btnText.textContent = '⏸';
        }
    }

    // Update speed for active training sessions
    updateActiveTrainingSpeed() {
        console.log('Updating active training speed to:', this.settings.wpm, 'WPM');
        
        if (this.isTraining) {
            if (this.currentMode === 'word-by-word' && this.wordTrainer) {
                console.log('Updating word trainer speed');
                this.wordTrainer.updateSpeed(this.settings.wpm);
            } else if (this.currentMode === 'phrases' && this.phrasesTrainer) {
                console.log('Updating phrases trainer speed');
                this.phrasesTrainer.updateSpeed(this.settings.wpm);
            } else if (this.currentMode === 'line-by-line' && this.currentLineViewMode === 'single-line' && this.singleLineTrainer) {
                console.log('Updating single line trainer speed');
                this.singleLineTrainer.updateSpeed(this.settings.wpm);
            }
            // Note: Full text line-by-line mode uses this.settings.wpm directly in calculations
        }
    }

    // Update training control bar (disabled - using new persistent control bar)
    updateControlBar(isRunning, isPaused = false) {
        // Hide the old training control bar completely
        const oldControlBar = document.getElementById('training-control-bar');
        if (oldControlBar) {
            oldControlBar.style.display = 'none';
        }
        
        // Remove padding class from training display since we're using persistent control bar
        const trainingDisplay = document.querySelector('.training-display');
        if (trainingDisplay) {
            trainingDisplay.classList.remove('has-control-bar');
        }
        
        console.log('Old control bar disabled - using persistent control bar instead');
    }

    // Scroll to top of training area
    scrollToTop() {
        const trainingText = document.getElementById('training-text');
        const wordTrainingText = document.getElementById('word-training-text');
        const phrasesTrainingText = document.getElementById('phrases-training-text');
        
        // Scroll to the appropriate training area based on current mode
        let targetElement = trainingText;
        if (this.currentMode === 'word-by-word') {
            targetElement = wordTrainingText;
        } else if (this.currentMode === 'phrases') {
            targetElement = phrasesTrainingText;
        }
        
        if (targetElement) {
            targetElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        } else {
            // Fallback to training display
            const trainingDisplay = document.querySelector('.training-display');
            if (trainingDisplay) {
                trainingDisplay.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        }
    }

    // Refresh current text display (called after app is fully initialized)
    refreshCurrentTextDisplay() {
        try {
            if (this.customText) {
                const selectedText = { title: 'Custom Text', content: this.customText };
                if (app && app.textManager && app.textManager.updateCurrentTextDisplay) {
                    app.textManager.updateCurrentTextDisplay(selectedText);
                }
            } else {
                // Determine which default text is being used
                let defaultTextId = 'sample-0';
                try {
                    defaultTextId = localStorage.getItem('flowread_default_text_id') || 'sample-0';
                } catch (error) {
                    console.warn('Could not access default text preference:', error);
                }
                
                let selectedText = null;
                if (defaultTextId.startsWith('sample-')) {
                    const sampleIndex = parseInt(defaultTextId.replace('sample-', ''));
                    const sampleTexts = storage.getSampleTexts();
                    const selectedSample = sampleTexts[sampleIndex] || sampleTexts[0];
                    selectedText = { title: selectedSample.title, content: selectedSample.content };
                } else if (defaultTextId.startsWith('saved-')) {
                    const savedId = defaultTextId.replace('saved-', '');
                    try {
                        const savedTexts = JSON.parse(localStorage.getItem('saved-training-texts') || '[]');
                        const savedText = savedTexts.find(text => text.id === savedId);
                        if (savedText) {
                            selectedText = { title: savedText.title, content: savedText.content };
                        }
                    } catch (error) {
                        console.warn('Could not access saved texts:', error);
                    }
                }
                
                // Fallback to first sample if nothing found
                if (!selectedText) {
                    const sampleTexts = storage.getSampleTexts();
                    selectedText = { title: sampleTexts[0].title, content: sampleTexts[0].content };
                }
                
                if (app && app.textManager && app.textManager.updateCurrentTextDisplay) {
                    app.textManager.updateCurrentTextDisplay(selectedText);
                }
            }
        } catch (error) {
            console.warn('Could not refresh current text display:', error);
        }
    }

    // Set custom text for training
    setCustomText(text) {
        this.customText = text;
        console.log('Custom text set for training:', text.substring(0, 50) + '...');
        
        // Update the current text display in the UI
        try {
            if (app && app.textManager && app.textManager.updateCurrentTextDisplay) {
                const selectedText = { title: 'Custom Text', content: text };
                app.textManager.updateCurrentTextDisplay(selectedText);
            }
        } catch (error) {
            console.warn('Could not update text display:', error);
        }
        
        // Reload training text with the custom text if training zone is initialized
        if (this.isInitialized && document.getElementById('training-text')) {
            console.log('Training zone is initialized, reloading text...');
            this.loadTrainingText();
        } else {
            console.log('Training zone not yet initialized, custom text will load when training starts');
        }
        
        // Also set text for word trainer, phrases trainer and single line trainer if they exist
        if (this.wordTrainer) {
            this.wordTrainer.setCustomText(text);
        }
        if (this.phrasesTrainer) {
            this.phrasesTrainer.setCustomText(text);
        }
        if (this.singleLineTrainer) {
            console.log('Setting custom text for single line trainer');
            // Single line trainer uses lines, not raw text
        }
    }

    // Set training mode
    setMode(mode) {
        this.currentMode = mode;
        console.log('Training mode set to:', mode);
        
        // Ensure word trainer is ready when switching to word mode
        if (mode === 'word-by-word') {
            this.ensureWordTrainer();
        } else if (mode === 'phrases') {
            this.ensurePhrasesTrainer();
        }
        
        if (this.wordTrainer) {
            this.wordTrainer.setMode(mode);
        }
        if (this.phrasesTrainer) {
            this.phrasesTrainer.setMode(mode);
        }
    }

    // Set line view mode
    setLineViewMode(viewMode) {
        this.currentLineViewMode = viewMode;
        console.log('Line view mode set to:', viewMode);
        
        // Ensure single line trainer is initialized
        this.ensureSingleLineTrainer();
        
        if (this.singleLineTrainer) {
            this.singleLineTrainer.setViewMode(viewMode);
        }
    }

    // Ensure single line trainer is initialized
    ensureSingleLineTrainer() {
        if (!this.singleLineTrainer) {
            console.log('Creating single line trainer on demand...');
            this.singleLineTrainer = new SingleLineTrainer();
            this.singleLineTrainer.init();
        }
    }

    // Ensure word trainer is initialized
    ensureWordTrainer() {
        if (!this.wordTrainer) {
            console.log('Creating word trainer on demand...');
            this.wordTrainer = new WordByWordTrainer();
            this.wordTrainer.init();
        }
    }

    ensurePhrasesTrainer() {
        if (!this.phrasesTrainer) {
            console.log('Creating phrases trainer on demand...');
            this.phrasesTrainer = new PhrasesTrainer();
            this.phrasesTrainer.init();
        }
    }

    // Get the active training area element based on current mode
    getActiveTrainingArea() {
        switch (this.currentMode) {
            case 'word-by-word':
                return document.getElementById('word-training-text');
            case 'phrases':
                return document.getElementById('phrases-training-text');
            case 'line-by-line':
            default:
                return document.getElementById('training-text');
        }
    }

    // Create countdown overlay on the training area
    createCountdownOverlay(trainingArea) {
        const overlay = document.createElement('div');
        overlay.className = 'training-countdown-overlay';
        overlay.id = 'training-countdown-overlay';
        
        const countdownNumber = document.createElement('div');
        countdownNumber.className = 'countdown-number';
        countdownNumber.textContent = '3';
        
        overlay.appendChild(countdownNumber);
        trainingArea.appendChild(overlay);
        
        return { overlay, countdownNumber };
    }

    // Transform control bar to training mode
    transformControlBarToTrainingMode() {
        const controlBar = document.getElementById('persistent-control-bar');
        const startButton = document.getElementById('start-training');
        const pauseButton = document.getElementById('pause-training');
        const stopButton = document.getElementById('stop-training');
        
        console.log('Transforming control bar to training mode');
        
        if (controlBar) {
            controlBar.classList.add('training-mode');
        }
        
        // Immediate state change for mobile reliability
        if (startButton) {
            startButton.style.display = 'none';
            startButton.classList.remove('showing');
            startButton.classList.add('hiding');
        }
        
        if (pauseButton && stopButton) {
            pauseButton.style.display = 'flex';
            stopButton.style.display = 'flex';
            pauseButton.classList.remove('hiding');
            stopButton.classList.remove('hiding');
            pauseButton.classList.add('showing');
            stopButton.classList.add('showing');
            console.log('Pause and stop buttons shown');
        }
    }

    // Reset control bar to initial state
    resetControlBarToInitialState() {
        const controlBar = document.getElementById('persistent-control-bar');
        const startButton = document.getElementById('start-training');
        const pauseButton = document.getElementById('pause-training');
        const stopButton = document.getElementById('stop-training');
        
        console.log('Resetting control bar to initial state');
        
        if (controlBar) {
            controlBar.classList.remove('training-mode');
        }
        
        // Immediate state change for mobile reliability
        if (pauseButton && stopButton) {
            pauseButton.style.display = 'none';
            stopButton.style.display = 'none';
            pauseButton.classList.remove('showing');
            stopButton.classList.remove('showing');
            pauseButton.classList.add('hiding');
            stopButton.classList.add('hiding');
            console.log('Pause and stop buttons hidden');
        }
        
        if (startButton) {
            startButton.style.display = 'flex';
            startButton.classList.remove('hiding');
            startButton.classList.add('showing');
            console.log('Start button shown');
        }
        
        // Reset training controls container
        const trainingControlsContainer = document.querySelector('.training-controls-container');
        if (trainingControlsContainer) {
            trainingControlsContainer.classList.remove('collapsed');
        }
    }

    // Smooth start sequence with countdown
    async startWithCountdown() {
        console.log('Starting training with smooth countdown...');
        
        try {
            // Set startup flag to prevent multiple starts
            this.isStartingUp = true;
        
            // 1. Transform the control bar to training mode first (before countdown)
            this.transformControlBarToTrainingMode();
        
            // 2. Collapse training controls smoothly
            const trainingControlsContainer = document.querySelector('.training-controls-container');
            if (trainingControlsContainer) {
                trainingControlsContainer.classList.add('collapsed');
            }
        
        // 3. Wait for collapse animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 4. Get active training area and add glow
        const trainingArea = this.getActiveTrainingArea();
        if (trainingArea) {
            trainingArea.classList.add('training-area-glow');
            
            // 5. Create and show countdown overlay
            const { overlay, countdownNumber } = this.createCountdownOverlay(trainingArea);
            
            // 6. Countdown sequence
            const countdownSequence = ['3', '2', '1', 'GO!'];
            for (let i = 0; i < countdownSequence.length; i++) {
                countdownNumber.textContent = countdownSequence[i];
                countdownNumber.style.animation = 'none';
                // Trigger reflow to restart animation
                countdownNumber.offsetHeight;
                countdownNumber.style.animation = 'countdownPulse 0.8s ease-in-out';
                
                // Wait for animation (shorter delay for GO!)
                const delay = countdownSequence[i] === 'GO!' ? 500 : 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            
            // 7. Remove countdown overlay
            overlay.remove();
            
            // 8. Start actual training with speed ramping
            console.log('About to start actual training, current mode:', this.currentMode);
            await this.startActualTrainingWithRamping();
            
            // 9. Remove glow after training starts
            setTimeout(() => {
                trainingArea.classList.remove('training-area-glow');
            }, 1000);
        }
        
        // 10. Clear startup flag (don't reset button state - it should stay transformed!)
        this.isStartingUp = false;
        } catch (error) {
            console.error('Error during training start countdown:', error);
            
            // Ensure we clean up on error
            this.isStartingUp = false;
            
            // Remove any leftover UI elements
            const countdownOverlay = document.getElementById('training-countdown-overlay');
            if (countdownOverlay) {
                countdownOverlay.remove();
            }
            
            // Reset UI state
            this.resetTrainingView();
            
            // Show error to user
            if (window.app && typeof app.showError === 'function') {
                app.showError('Failed to start training. Please try again.');
            }
        }
    }

    // Start speed ramping from 25% to 100% over 5 seconds
    startSpeedRamping() {
        this.targetWPM = this.settings.wpm;
        this.currentRampWPM = Math.round(this.targetWPM * 0.25); // Start at 25%
        this.isRamping = true;
        
        console.log(`Starting speed ramp from ${this.currentRampWPM} to ${this.targetWPM} WPM`);
        
        const rampDuration = 5000; // 5 seconds
        const rampSteps = 50; // Smooth animation
        const stepDuration = rampDuration / rampSteps;
        const wpmIncrement = (this.targetWPM - this.currentRampWPM) / rampSteps;
        
        let currentStep = 0;
        
        const rampInterval = setInterval(() => {
            if (!this.isTraining || !this.isRamping) {
                clearInterval(rampInterval);
                return;
            }
            
            currentStep++;
            this.currentRampWPM = Math.round(this.targetWPM * 0.25 + (wpmIncrement * currentStep));
            
            // Update speed slider visual
            this.updateSpeedSliderVisual(this.currentRampWPM);
            
            // Update active training speed
            this.updateActiveTrainingRampSpeed(this.currentRampWPM);
            
            if (currentStep >= rampSteps) {
                this.currentRampWPM = this.targetWPM;
                this.isRamping = false;
                clearInterval(rampInterval);
                console.log('Speed ramping completed at', this.targetWPM, 'WPM');
            }
        }, stepDuration);
    }

    // Update speed slider visual during ramping
    updateSpeedSliderVisual(wpm) {
        const speedSlider = document.getElementById('training-speed-slider');
        const speedValue = document.getElementById('speed-value');
        
        if (speedSlider) {
            speedSlider.value = wpm;
        }
        if (speedValue) {
            speedValue.textContent = wpm;
        }
    }

    // Update active training speed during ramping
    updateActiveTrainingRampSpeed(wpm) {
        if (this.isTraining) {
            if (this.currentMode === 'word-by-word' && this.wordTrainer) {
                this.wordTrainer.updateSpeed(wpm);
            } else if (this.currentMode === 'phrases' && this.phrasesTrainer) {
                this.phrasesTrainer.updateSpeed(wpm);
            } else if (this.currentMode === 'line-by-line' && this.currentLineViewMode === 'single-line' && this.singleLineTrainer) {
                this.singleLineTrainer.updateSpeed(wpm);
            }
        }
    }

    // Start actual training with speed ramping
    async startActualTrainingWithRamping() {
        if (this.isTraining) {
            console.log('Training already running, skipping');
            return;
        }
        
        console.log(`Starting ${this.currentMode} training with speed ramping...`);
        console.log('Is initialized:', this.isInitialized);
        console.log('Lines count:', this.lines ? this.lines.length : 'no lines');
        
        // Ensure we have text loaded
        if (!this.lines || this.lines.length === 0) {
            console.log('No text loaded, loading training text first...');
            this.loadTrainingText();
        }
        
        // Start training at 25% speed first
        const originalWPM = this.settings.wpm;
        this.settings.wpm = Math.round(originalWPM * 0.25);
        
        // Route to appropriate training method
        console.log('Routing to training method for mode:', this.currentMode);
        if (this.currentMode === 'word-by-word') {
            console.log('Starting word training...');
            await this.startWordTraining();
        } else if (this.currentMode === 'phrases') {
            console.log('Starting phrases training...');
            await this.startPhrasesTraining();
        } else {
            console.log('Starting line training...');
            await this.startLineTraining();
        }
        
        // Restore original WPM setting
        this.settings.wpm = originalWPM;
        
        // Start speed ramping after a brief delay
        setTimeout(() => {
            if (this.isTraining) {
                this.startSpeedRamping();
            }
        }, 1000);
    }

    // Original start method renamed to startActualTraining
    async startActualTraining() {
        if (this.isTraining) {
            console.log('Training already running, skipping');
            return;
        }
        
        console.log(`Starting ${this.currentMode} training...`);
        console.log('Is initialized:', this.isInitialized);
        console.log('Lines count:', this.lines ? this.lines.length : 'no lines');
        
        // Ensure we have text loaded
        if (!this.lines || this.lines.length === 0) {
            console.log('No text loaded, loading training text first...');
            this.loadTrainingText();
        }
        
        // Route to appropriate training method
        console.log('Routing to training method for mode:', this.currentMode);
        if (this.currentMode === 'word-by-word') {
            console.log('Starting word training...');
            return this.startWordTraining();
        } else if (this.currentMode === 'phrases') {
            console.log('Starting phrases training...');
            return this.startPhrasesTraining();
        } else {
            console.log('Starting line training...');
            return this.startLineTraining();
        }
    }

    // Start training (public method)
    async start() {
        // Called when entering training zone
        console.log('TrainingZone.start() called');
        await this.init();
        console.log('TrainingZone initialized successfully');
    }
}

// Word-by-Word Trainer Class
class WordByWordTrainer {
    constructor() {
        this.words = [];
        this.currentWordIndex = 0;
        this.isTraining = false;
        this.isPaused = false;
        this.wpm = 250;
        this.animationId = null;
        this.customText = null;
        this.currentText = '';
    }

    // Initialize word trainer
    init() {
        console.log('WordByWordTrainer initialized');
    }

    // Set custom text
    setCustomText(text) {
        this.customText = text;
        console.log('Custom text set for word trainer');
    }

    // Set mode (for compatibility)
    setMode(mode) {
        // Word trainer only works in word-by-word mode
        console.log('Word trainer mode set to:', mode);
    }

    // Start word-by-word training
    startTraining(text, wpm) {
        if (this.isTraining) return;

        // Use custom text if available
        this.currentText = this.customText || text;
        this.words = textProcessor.getWords(this.currentText);
        this.currentWordIndex = 0;
        this.wpm = wpm;
        this.isTraining = true;
        this.isPaused = false;

        console.log(`Starting word training with ${this.words.length} words at ${wpm} WPM`);

        // Update UI elements
        this.updateWordDisplay();
        this.updateProgress();

        // Start word animation
        this.animateWords();
    }

    // Animate words
    animateWords() {
        if (!this.isTraining || this.isPaused) return;

        if (this.currentWordIndex >= this.words.length) {
            console.log('Word training complete');
            this.completeTraining();
            return;
        }

        const word = this.words[this.currentWordIndex];
        
        // Display current word
        const wordDisplay = document.getElementById('current-word');
        if (wordDisplay) {
            wordDisplay.textContent = word;
        }

        // Update progress
        this.updateProgress();

        // Calculate timing (with slight variation for word length)
        const baseTime = 60000 / this.wpm; // ms per word
        const wordLengthFactor = Math.min(word.length / 5, 2); // Longer words get more time
        const wordTime = baseTime * (0.8 + wordLengthFactor * 0.4);

        this.currentWordIndex++;

        // Schedule next word
        this.animationId = setTimeout(() => this.animateWords(), wordTime);
    }

    // Update word display
    updateWordDisplay() {
        const wordDisplay = document.getElementById('current-word');
        const totalWordsEl = document.getElementById('total-words');
        
        if (totalWordsEl) {
            totalWordsEl.textContent = this.words.length;
        }
        
        if (wordDisplay && this.words.length > 0) {
            wordDisplay.textContent = this.words[0] || 'Ready...';
        }
    }

    // Update progress indicators
    updateProgress() {
        const currentWordIndexEl = document.getElementById('current-word-index');
        const progressFill = document.getElementById('word-progress-fill');
        
        if (currentWordIndexEl) {
            currentWordIndexEl.textContent = this.currentWordIndex;
        }
        
        if (progressFill) {
            const percentage = (this.currentWordIndex / this.words.length) * 100;
            progressFill.style.width = `${percentage}%`;
        }
    }

    // Pause training
    pauseTraining() {
        if (!this.isTraining || this.isPaused) return;
        
        this.isPaused = true;
        
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        const wordDisplay = document.getElementById('current-word');
        if (wordDisplay) {
            wordDisplay.style.opacity = '0.5';
        }
        
        console.log('Word training paused');
    }

    // Resume training
    resumeTraining() {
        if (!this.isTraining || !this.isPaused) return;
        
        this.isPaused = false;
        
        const wordDisplay = document.getElementById('current-word');
        if (wordDisplay) {
            wordDisplay.style.opacity = '1';
        }
        
        console.log('Word training resumed');
        this.animateWords();
    }

    // Stop training
    stopTraining() {
        this.isTraining = false;
        this.isPaused = false;
        
        if (this.animationId) {
            clearTimeout(this.animationId);
        }
        
        console.log('Word training stopped');
    }

    // Complete training
    completeTraining() {
        this.stopTraining();
        
        // Trigger completion in main training zone
        if (typeof trainingZone !== 'undefined') {
            trainingZone.completeTraining();
        }
        
        console.log(`Word training completed: ${this.currentWordIndex} words processed`);
    }

    // Get current word index (for stats)
    getCurrentWordIndex() {
        return this.currentWordIndex;
    }

    // Get current text
    getText() {
        return this.currentText;
    }

    // Update speed during training
    updateSpeed(newWpm) {
        this.wpm = newWpm;
        console.log('Word trainer speed updated to:', newWpm, 'WPM');
    }
}

// Initialize training zone
const trainingZone = new TrainingZone();