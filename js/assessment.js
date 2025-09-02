// FlowRead Assessment Module
class AssessmentReader {
    constructor() {
        this.session = null;
        this.currentTextIndex = 0;
        this.sampleTexts = storage.getSampleTexts();
        this.isAssessing = false;
        this.currentText = '';
    }

    // Start reading speed assessment
    async start(customText = null) {
        try {
            console.log('Starting assessment...');
            this.currentText = customText || this.getCurrentSampleText();
            
            // Initialize reading session
            this.session = new ReadingSession();
            await this.session.init(this.currentText, 'assessment', {
                title: customText ? 'Custom Text Assessment' : this.sampleTexts[this.currentTextIndex].title
            });
            
            console.log('Session initialized, displaying text...');
            this.displayText(this.currentText);
            this.setupControls();
            console.log('Assessment setup complete');
        } catch (error) {
            console.error('Failed to start assessment:', error);
            this.showError('Failed to start assessment. Please try again.');
        }
    }

    // Get current sample text
    getCurrentSampleText() {
        const text = this.sampleTexts[this.currentTextIndex];
        return text.content;
    }

    // Display text for assessment
    displayText(text) {
        console.log('Displaying text:', text.substring(0, 100) + '...');
        const textElement = document.getElementById('assessment-text');
        if (textElement) {
            const formattedText = textProcessor.formatForDisplay(text).replace(/\n/g, '<br>');
            textElement.innerHTML = `<div class="assessment-passage">${formattedText}</div>`;
            console.log('Text displayed successfully');
        } else {
            console.error('assessment-text element not found');
            this.showError('Could not display assessment text');
        }
    }

    // Show error message
    showError(message) {
        const textElement = document.getElementById('assessment-text');
        if (textElement) {
            textElement.innerHTML = `<div class="error-message" style="color: red; text-align: center; padding: 20px;">${message}</div>`;
        }
    }

    // Setup assessment controls
    setupControls() {
        console.log('Setting up assessment controls...');
        const startBtn = document.getElementById('start-assessment');
        const finishBtn = document.getElementById('finish-assessment');
        
        if (startBtn) {
            startBtn.onclick = () => {
                console.log('Start assessment button clicked');
                this.startAssessment();
            };
            startBtn.disabled = false;
            console.log('Start button configured');
        } else {
            console.error('start-assessment button not found');
        }
        
        if (finishBtn) {
            finishBtn.onclick = () => {
                console.log('Finish assessment button clicked');
                this.finishAssessment();
            };
            console.log('Finish button configured');
        } else {
            console.error('finish-assessment button not found');
        }
    }

    // Start the assessment timer
    startAssessment() {
        if (this.isAssessing) {
            console.log('Assessment already in progress');
            return;
        }
        
        console.log('Starting assessment timer...');
        
        if (!this.session) {
            console.error('No session available');
            this.showError('Session not initialized. Please refresh and try again.');
            return;
        }
        
        this.session.start();
        this.isAssessing = true;
        
        const startBtn = document.getElementById('start-assessment');
        const finishBtn = document.getElementById('finish-assessment');
        
        if (startBtn) {
            startBtn.style.display = 'none';
        }
        if (finishBtn) {
            finishBtn.style.display = 'inline-block';
        }
        
        // Focus on the text for reading
        const textElement = document.getElementById('assessment-text');
        if (textElement) {
            textElement.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('Assessment started successfully');
    }

    // Finish assessment and show results
    async finishAssessment() {
        if (!this.isAssessing) return;
        
        const stats = this.session.finish();
        this.isAssessing = false;
        
        // Show impressive results screen first
        await this.showAssessmentResults(stats);
    }

    // Show assessment results with better UX
    async showAssessmentResults(stats) {
        const container = document.querySelector('#assessment-screen .reading-area');
        if (!container) return;
        
        const wpm = stats.wpm;
        const context = this.getSpeedContext(wpm);
        const level = this.getReadingLevel(wpm);
        
        container.innerHTML = `
            <div class="assessment-results">
                <div class="results-header">
                    <h3>🎯 Your Reading Speed Assessment</h3>
                </div>
                
                <div class="speed-reveal">
                    <div class="speed-number-big">${wpm}</div>
                    <div class="speed-unit-big">Words Per Minute</div>
                </div>
                
                <div class="speed-analysis">
                    <div class="reading-level">
                        <span class="level-badge ${level.class}">${level.name}</span>
                    </div>
                    <p class="speed-description">${context}</p>
                </div>
                
                <div class="assessment-stats">
                    <div class="stat-item">
                        <span class="stat-value">${stats.wordCount}</span>
                        <span class="stat-label">words read</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${Math.round(stats.durationMin * 100) / 100}</span>
                        <span class="stat-label">minutes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${wpm}</span>
                        <span class="stat-label">WPM</span>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="primary-btn" onclick="assessmentReader.proceedToQuiz()">
                        Continue to Comprehension Check
                    </button>
                    <button class="text-btn" onclick="assessmentReader.retakeAssessment()">
                        Retake Assessment
                    </button>
                </div>
            </div>
        `;
        
        // Animate the results reveal
        setTimeout(() => {
            const speedNumber = container.querySelector('.speed-number-big');
            if (speedNumber) {
                speedNumber.style.transform = 'scale(1)';
                speedNumber.style.opacity = '1';
            }
        }, 300);
    }

    // Get speed context description
    getSpeedContext(wpm) {
        if (wpm < 200) return `At ${wpm} WPM, you're reading below the average pace. There's tremendous potential to improve your speed with focused training!`;
        if (wpm < 250) return `${wpm} WPM is around average reading speed. With the right techniques, you can easily boost this significantly!`;
        if (wpm < 350) return `Great! ${wpm} WPM is above average. You already have solid reading skills that we can enhance even further.`;
        if (wpm < 500) return `Excellent! ${wpm} WPM puts you in the fast reader category. You have natural speed reading abilities!`;
        return `Outstanding! At ${wpm} WPM, you're reading at championship levels. Let's see how much faster we can push your limits!`;
    }

    // Get reading level classification
    getReadingLevel(wpm) {
        if (wpm < 200) return { name: 'Developing Reader', class: 'level-developing' };
        if (wpm < 250) return { name: 'Average Reader', class: 'level-average' };
        if (wpm < 350) return { name: 'Skilled Reader', class: 'level-skilled' };
        if (wpm < 500) return { name: 'Fast Reader', class: 'level-fast' };
        return { name: 'Speed Reader', class: 'level-expert' };
    }

    // Proceed to comprehension quiz
    proceedToQuiz() {
        const comprehensionQuiz = new ComprehensionQuiz();
        comprehensionQuiz.start(this.session.sessionData.id, this.session.currentText);
    }

    // Retake assessment
    retakeAssessment() {
        // Cycle to next sample text for variety
        this.currentTextIndex = (this.currentTextIndex + 1) % this.sampleTexts.length;
        this.start();
    }
}

// Initialize assessment reader
const assessmentReader = new AssessmentReader();