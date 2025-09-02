// FlowRead Reading Module
class ReadingSession {
    constructor() {
        this.currentText = null;
        this.startTime = null;
        this.endTime = null;
        this.isActive = false;
        this.mode = 'baseline';
        this.wpmTarget = 250;
        this.timer = null;
        this.pacerTimer = null;
        this.flashTimer = null;
        this.currentWordIndex = 0;
        this.pausedTime = 0;
        this.isPaused = false;
    }

    // Initialize reading session
    async init(textContent, mode = 'baseline', options = {}) {
        this.currentText = textContent;
        this.mode = mode;
        this.wpmTarget = options.wpmTarget || 250;
        this.chunkSize = options.chunkSize || 3;
        this.technique = options.technique || 'normal';
        
        // Save text to storage
        const textTitle = options.title || `Reading Session ${Date.now()}`;
        this.textData = await storage.saveText(textTitle, textContent);
        
        return this.textData;
    }

    // Start reading session
    start() {
        if (this.isActive) return;
        
        this.startTime = Date.now();
        this.isActive = true;
        this.isPaused = false;
        this.currentWordIndex = 0;
        
        // Start timer display
        this.startTimer();
        
        // Initialize technique-specific features
        if (this.technique === 'pacer') {
            this.startPacer();
        } else if (this.technique === 'flash') {
            this.startFlashReading();
        }
    }

    // Pause reading session
    pause() {
        if (!this.isActive || this.isPaused) return;
        
        this.isPaused = true;
        this.pausedTime = Date.now();
        
        if (this.timer) clearInterval(this.timer);
        if (this.pacerTimer) clearInterval(this.pacerTimer);
        if (this.flashTimer) clearInterval(this.flashTimer);
    }

    // Resume reading session
    resume() {
        if (!this.isActive || !this.isPaused) return;
        
        // Adjust start time to account for pause duration
        const pauseDuration = Date.now() - this.pausedTime;
        this.startTime += pauseDuration;
        
        this.isPaused = false;
        this.startTimer();
        
        if (this.technique === 'pacer') {
            this.startPacer();
        } else if (this.technique === 'flash') {
            this.startFlashReading();
        }
    }

    // Finish reading session
    finish() {
        if (!this.isActive) return null;
        
        this.endTime = Date.now();
        this.isActive = false;
        
        // Clear all timers
        if (this.timer) clearInterval(this.timer);
        if (this.pacerTimer) clearInterval(this.pacerTimer);
        if (this.flashTimer) clearInterval(this.flashTimer);
        
        // Calculate statistics
        const stats = this.calculateStats();
        
        // Save session data
        this.saveSession(stats);
        
        return stats;
    }

    // Calculate reading statistics
    calculateStats() {
        const durationMs = this.endTime - this.startTime;
        const durationMin = durationMs / 60000;
        const wordCount = textProcessor.countWords(this.currentText);
        const wpm = Math.round(wordCount / durationMin);
        
        return {
            wordCount: wordCount,
            durationMs: durationMs,
            durationMin: durationMin,
            wpm: wpm,
            wpmTarget: this.wpmTarget,
            mode: this.mode,
            technique: this.technique
        };
    }

    // Save session to storage
    async saveSession(stats) {
        const sessionData = {
            mode: this.mode,
            textId: this.textData.id,
            words: stats.wordCount,
            wpmTarget: this.wpmTarget,
            actualWpm: stats.wpm,
            chunkSize: this.chunkSize,
            layout: {
                fontSize: 16,
                lineLength: 80
            },
            rsvpUsed: this.technique === 'flash',
            durationMs: stats.durationMs,
            technique: this.technique
        };
        
        this.sessionData = await storage.saveSession(sessionData);
        return this.sessionData;
    }

    // Timer display
    startTimer() {
        // Support multiple timer element IDs for different pages
        const timerElement = document.getElementById('reading-timer') || 
                           document.getElementById('assessment-timer') ||
                           document.getElementById('test-timer') ||
                           document.getElementById('timer-display');
        if (!timerElement) return;
        
        this.timer = setInterval(() => {
            if (this.isPaused) return;
            
            const elapsed = Date.now() - this.startTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            timerElement.textContent = 
                `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 100);
    }

    // Pacer band implementation
    startPacer() {
        const textDisplay = document.getElementById('main-text-display');
        if (!textDisplay || this.technique !== 'pacer') return;
        
        // Create pacer elements
        let pacerBar = document.querySelector('.pacer-bar');
        let pacerHighlight = document.querySelector('.pacer-highlight');
        
        if (!pacerBar) {
            pacerBar = document.createElement('div');
            pacerBar.className = 'pacer-bar';
            textDisplay.appendChild(pacerBar);
        }
        
        if (!pacerHighlight) {
            pacerHighlight = document.createElement('div');
            pacerHighlight.className = 'pacer-highlight';
            textDisplay.appendChild(pacerHighlight);
        }
        
        // Calculate timing
        const words = textProcessor.getWords(this.currentText);
        const wordsPerSecond = this.wpmTarget / 60;
        const totalDuration = words.length / wordsPerSecond * 1000;
        
        let startTime = Date.now();
        
        this.pacerTimer = setInterval(() => {
            if (this.isPaused) return;
            
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            
            // Update pacer position
            const containerHeight = textDisplay.offsetHeight;
            const y = progress * containerHeight;
            
            pacerBar.style.top = `${y}px`;
            pacerHighlight.style.top = `${y - 14}px`;
            
            // Update current word index
            this.currentWordIndex = Math.floor(progress * words.length);
            
            if (progress >= 1) {
                clearInterval(this.pacerTimer);
            }
        }, 50);
    }

    // Flash reading (RSVP) implementation
    startFlashReading() {
        const textDisplay = document.getElementById('main-text-display');
        if (!textDisplay || this.technique !== 'flash') return;
        
        const words = textProcessor.getWords(this.currentText);
        let currentIndex = 0;
        
        // Create flash container
        textDisplay.innerHTML = '<div class="flash-container"><div class="flash-word"></div></div>';
        const flashWord = textDisplay.querySelector('.flash-word');
        
        const msPerWord = 60000 / this.wpmTarget;
        
        const showNextWord = () => {
            if (currentIndex >= words.length || this.isPaused) return;
            
            const word = words[currentIndex];
            flashWord.textContent = word;
            flashWord.className = 'flash-word active';
            
            // Pause longer on punctuation
            let delay = msPerWord;
            if (word.match(/[.!?]$/)) delay *= 2;
            else if (word.match(/[,;:]$/)) delay *= 1.5;
            
            this.currentWordIndex = currentIndex;
            currentIndex++;
            
            setTimeout(() => {
                flashWord.className = 'flash-word';
                if (currentIndex < words.length) {
                    setTimeout(showNextWord, 50);
                } else {
                    this.finish();
                }
            }, delay);
        };
        
        showNextWord();
    }

    // Chunked reading implementation
    displayChunkedText() {
        const textDisplay = document.getElementById('main-text-display');
        if (!textDisplay) return;
        
        const chunks = textProcessor.createSmartChunks(this.currentText, this.chunkSize);
        let html = '';
        
        chunks.forEach((chunk, index) => {
            html += `<span class="chunk" data-chunk="${index}">${chunk.text}</span> `;
        });
        
        textDisplay.innerHTML = html;
        
        // Add click handlers for manual progression
        const chunkElements = textDisplay.querySelectorAll('.chunk');
        chunkElements.forEach((element, index) => {
            element.addEventListener('click', () => {
                this.highlightChunk(index);
            });
        });
    }

    // Highlight current chunk
    highlightChunk(index) {
        const chunks = document.querySelectorAll('.chunk');
        chunks.forEach((chunk, i) => {
            chunk.classList.remove('current-chunk');
            if (i === index) {
                chunk.classList.add('current-chunk');
            }
        });
        this.currentChunkIndex = index;
    }

    // Get current reading position
    getCurrentPosition() {
        return {
            wordIndex: this.currentWordIndex,
            percentage: this.currentText ? 
                (this.currentWordIndex / textProcessor.countWords(this.currentText)) * 100 : 0
        };
    }

    // Set reading speed
    setSpeed(wpm) {
        this.wpmTarget = Math.max(50, Math.min(1000, wpm));
        
        // Restart technique-specific features with new speed
        if (this.isActive && !this.isPaused) {
            if (this.technique === 'pacer') {
                if (this.pacerTimer) clearInterval(this.pacerTimer);
                this.startPacer();
            } else if (this.technique === 'flash') {
                if (this.flashTimer) clearInterval(this.flashTimer);
                this.startFlashReading();
            }
        }
    }

    // Change technique
    changeTechnique(technique) {
        const wasActive = this.isActive && !this.isPaused;
        
        if (wasActive) {
            this.pause();
        }
        
        this.technique = technique;
        
        if (technique === 'chunking') {
            this.displayChunkedText();
        }
        
        if (wasActive) {
            this.resume();
        }
    }

    // Get session summary
    getSummary() {
        if (!this.sessionData) return null;
        
        return {
            sessionId: this.sessionData.id,
            textTitle: this.textData.title,
            wordCount: this.textData.wordCount,
            duration: this.sessionData.durationMs,
            wpm: this.sessionData.actualWpm || this.sessionData.wpmTarget,
            mode: this.sessionData.mode,
            technique: this.sessionData.technique
        };
    }
}

// Baseline reading controller
class BaselineReader {
    constructor() {
        this.session = null;
        this.currentTextIndex = 0;
        this.sampleTexts = storage.getSampleTexts();
    }

    // Start baseline assessment
    async start(customText = null) {
        const textContent = customText || this.getCurrentSampleText();
        
        this.session = new ReadingSession();
        await this.session.init(textContent, 'baseline', {
            title: customText ? 'Custom Text Assessment' : this.sampleTexts[this.currentTextIndex].title
        });
        
        this.displayText(textContent);
        this.setupControls();
    }

    // Get current sample text
    getCurrentSampleText() {
        const text = this.sampleTexts[this.currentTextIndex];
        return text.content;
    }

    // Display text for reading
    displayText(text) {
        const textElement = document.getElementById('baseline-text');
        if (textElement) {
            textElement.innerHTML = textProcessor.formatForDisplay(text).replace(/\n/g, '<br>');
        }
    }

    // Setup reading controls
    setupControls() {
        const startBtn = document.getElementById('start-reading');
        const finishBtn = document.getElementById('finish-reading');
        
        if (startBtn) {
            startBtn.onclick = () => {
                this.session.start();
                startBtn.style.display = 'none';
                finishBtn.style.display = 'inline-block';
            };
        }
        
        if (finishBtn) {
            finishBtn.onclick = () => {
                const stats = this.session.finish();
                this.showResults(stats);
            };
        }
    }

    // Show baseline results and proceed to quiz
    showResults(stats) {
        // Store baseline stats for reference
        this.baselineStats = stats;
        
        // Proceed to comprehension quiz
        const comprehensionQuiz = new ComprehensionQuiz();
        comprehensionQuiz.start(this.session.sessionData.id, this.session.currentText);
    }
}

// Main reading trainer controller
class MainReader {
    constructor() {
        this.session = null;
        this.currentTechnique = 'pacer';
        this.isTraining = false;
    }

    // Start main reading session
    async start(text, options = {}) {
        this.session = new ReadingSession();
        
        const sessionOptions = {
            wpmTarget: options.wpm || 250,
            technique: this.currentTechnique,
            chunkSize: options.chunkSize || 3,
            title: options.title || 'Main Reading Session'
        };
        
        await this.session.init(text, 'main', sessionOptions);
        
        this.displayText(text);
        this.setupControls();
        
        return this.session;
    }

    // Display text with technique
    displayText(text) {
        const textDisplay = document.getElementById('main-text-display');
        if (!textDisplay) return;
        
        if (this.currentTechnique === 'chunking') {
            this.session.displayChunkedText();
        } else {
            textDisplay.innerHTML = textProcessor.formatForDisplay(text).replace(/\n/g, '<br>');
        }
    }

    // Setup main reading controls
    setupControls() {
        this.setupTechniqueSelector();
        this.setupSpeedControls();
        this.setupStartButton();
    }

    // Setup technique selection
    setupTechniqueSelector() {
        const techniqueButtons = document.querySelectorAll('.technique-btn');
        
        techniqueButtons.forEach(btn => {
            btn.onclick = () => {
                techniqueButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.currentTechnique = btn.dataset.technique;
                if (this.session) {
                    this.session.changeTechnique(this.currentTechnique);
                    this.displayText(this.session.currentText);
                }
            };
        });
    }

    // Setup speed controls
    setupSpeedControls() {
        const speedSlider = document.getElementById('speed-slider');
        const speedDisplay = document.getElementById('target-wpm');
        
        if (speedSlider && speedDisplay) {
            speedSlider.oninput = () => {
                const wpm = parseInt(speedSlider.value);
                speedDisplay.textContent = wpm;
                
                if (this.session) {
                    this.session.setSpeed(wpm);
                }
            };
        }
    }

    // Setup start button
    setupStartButton() {
        const startBtn = document.getElementById('start-main-read');
        
        if (startBtn) {
            startBtn.onclick = () => {
                if (this.isTraining) {
                    this.stop();
                } else {
                    this.startTraining();
                }
            };
        }
    }

    // Start training session
    startTraining() {
        if (!this.session) return;
        
        this.isTraining = true;
        this.session.start();
        
        const startBtn = document.getElementById('start-main-read');
        if (startBtn) {
            startBtn.textContent = 'Stop Training';
            startBtn.classList.add('secondary-btn');
        }

        // Auto-finish after reasonable time
        setTimeout(() => {
            if (this.isTraining) {
                this.stop();
            }
        }, 300000); // 5 minutes max
    }

    // Stop training session
    stop() {
        if (!this.session || !this.isTraining) return;
        
        const stats = this.session.finish();
        this.isTraining = false;
        
        const startBtn = document.getElementById('start-main-read');
        if (startBtn) {
            startBtn.textContent = 'Start Training';
            startBtn.classList.remove('secondary-btn');
        }
        
        // Show results and proceed to quiz
        this.showResults(stats);
    }

    // Show results and proceed to quiz
    showResults(stats) {
        // Store stats for reference
        this.trainingStats = stats;
        
        // Proceed to comprehension quiz
        const comprehensionQuiz = new ComprehensionQuiz();
        comprehensionQuiz.start(this.session.sessionData.id, this.session.currentText);
    }
}

// Initialize reading components
const baselineReader = new BaselineReader();
const mainReader = new MainReader();