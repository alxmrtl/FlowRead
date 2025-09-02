// FlowRead Drill Module
class WarmUpDrills {
    constructor() {
        this.currentDrill = 'schulte';
        this.drillSession = null;
        this.drillStartTime = null;
        this.isActive = false;
        this.drillData = {};
    }

    // Initialize warm-up drills
    init() {
        this.setupDrillSelector();
        this.showDrill(this.currentDrill);
    }

    // Setup drill selection buttons
    setupDrillSelector() {
        const drillButtons = document.querySelectorAll('.drill-btn');
        
        drillButtons.forEach(btn => {
            btn.onclick = () => {
                // Stop current drill if active
                if (this.isActive) {
                    this.stopDrill();
                }
                
                // Update active button
                drillButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Switch drill
                this.currentDrill = btn.dataset.drill;
                this.showDrill(this.currentDrill);
            };
        });
    }

    // Show selected drill
    showDrill(drillType) {
        const drillContent = document.getElementById('drill-content');
        if (!drillContent) return;
        
        switch (drillType) {
            case 'schulte':
                this.showSchulteDrill(drillContent);
                break;
            case 'pacing':
                this.showPacingDrill(drillContent);
                break;
            case 'memory':
                this.showMemoryDrill(drillContent);
                break;
        }
    }

    // Schulte table drill (visual span training)
    showSchulteDrill(container) {
        container.innerHTML = `
            <div class="drill-header">
                <h3>Visual Span Training</h3>
                <p>Find numbers in order from 1 to 25. Use peripheral vision.</p>
            </div>
            <div class="drill-controls">
                <div class="drill-settings">
                    <label>Grid Size: 
                        <select id="schulte-size">
                            <option value="5">5×5 (Beginner)</option>
                            <option value="6">6×6 (Advanced)</option>
                            <option value="7">7×7 (Expert)</option>
                        </select>
                    </label>
                </div>
                <div class="drill-status">
                    <div class="next-number">Find: <span id="target-number">1</span></div>
                    <div class="drill-timer">Time: <span id="drill-time">0:00</span></div>
                </div>
            </div>
            <div id="schulte-grid"></div>
            <div class="drill-actions">
                <button id="start-schulte" class="primary-btn">Start Drill</button>
                <button id="reset-schulte" class="secondary-btn">Reset</button>
            </div>
            <div class="drill-results" id="schulte-results"></div>
        `;
        
        this.setupSchulteControls();
        this.generateSchulteGrid();
    }

    // Setup Schulte table controls
    setupSchulteControls() {
        const startBtn = document.getElementById('start-schulte');
        const resetBtn = document.getElementById('reset-schulte');
        const sizeSelect = document.getElementById('schulte-size');
        
        if (startBtn) {
            startBtn.onclick = () => this.startSchulteDrill();
        }
        
        if (resetBtn) {
            resetBtn.onclick = () => this.resetSchulteDrill();
        }
        
        if (sizeSelect) {
            sizeSelect.onchange = () => {
                this.generateSchulteGrid();
            };
        }
    }

    // Generate Schulte grid
    generateSchulteGrid() {
        const gridContainer = document.getElementById('schulte-grid');
        const sizeSelect = document.getElementById('schulte-size');
        
        if (!gridContainer || !sizeSelect) return;
        
        const size = parseInt(sizeSelect.value);
        const totalNumbers = size * size;
        
        // Generate random number sequence
        const numbers = Array.from({length: totalNumbers}, (_, i) => i + 1);
        this.shuffleArray(numbers);
        
        // Clear and setup grid
        gridContainer.innerHTML = '';
        gridContainer.className = 'schulte-grid';
        gridContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        
        // Create cells
        this.schulteData = {
            size: size,
            numbers: numbers,
            currentTarget: 1,
            foundNumbers: new Set(),
            startTime: null,
            errors: 0
        };
        
        numbers.forEach((number, index) => {
            const cell = document.createElement('div');
            cell.className = 'schulte-cell';
            cell.textContent = number;
            cell.dataset.number = number;
            cell.onclick = () => this.handleSchulteClick(number, cell);
            
            gridContainer.appendChild(cell);
        });
    }

    // Handle Schulte cell click
    handleSchulteClick(number, cell) {
        if (!this.isActive) return;
        
        const targetNumber = this.schulteData.currentTarget;
        const targetElement = document.getElementById('target-number');
        
        if (number === targetNumber) {
            // Correct number found
            cell.classList.add('found');
            this.schulteData.foundNumbers.add(number);
            this.schulteData.currentTarget++;
            
            if (targetElement) {
                targetElement.textContent = this.schulteData.currentTarget;
            }
            
            // Check if completed
            if (this.schulteData.currentTarget > this.schulteData.size * this.schulteData.size) {
                this.completeSchulteDrill();
            }
        } else {
            // Wrong number - highlight briefly
            cell.classList.add('error');
            this.schulteData.errors++;
            
            setTimeout(() => {
                cell.classList.remove('error');
            }, 500);
        }
    }

    // Start Schulte drill
    startSchulteDrill() {
        this.isActive = true;
        this.schulteData.startTime = Date.now();
        this.drillStartTime = Date.now();
        
        const startBtn = document.getElementById('start-schulte');
        if (startBtn) {
            startBtn.textContent = 'In Progress...';
            startBtn.disabled = true;
        }
        
        this.startDrillTimer();
    }

    // Complete Schulte drill
    completeSchulteDrill() {
        this.isActive = false;
        const endTime = Date.now();
        const duration = endTime - this.schulteData.startTime;
        
        const results = {
            drillType: 'schulte',
            size: this.schulteData.size,
            duration: duration,
            errors: this.schulteData.errors,
            score: this.calculateSchulteScore(duration, this.schulteData.errors, this.schulteData.size)
        };
        
        this.showSchulteResults(results);
        this.saveDrillResults(results);
    }

    // Calculate Schulte score
    calculateSchulteScore(duration, errors, size) {
        const baseTime = size * size * 1000; // 1 second per number baseline
        const timeScore = Math.max(0, 100 - ((duration - baseTime) / baseTime) * 50);
        const errorPenalty = errors * 5;
        
        return Math.max(0, Math.round(timeScore - errorPenalty));
    }

    // Show Schulte results
    showSchulteResults(results) {
        const resultsContainer = document.getElementById('schulte-results');
        if (!resultsContainer) return;
        
        const timeInSeconds = (results.duration / 1000).toFixed(1);
        const gridSize = `${results.size}×${results.size}`;
        
        let rating = 'Good';
        if (results.score >= 80) rating = 'Excellent';
        else if (results.score >= 60) rating = 'Good';
        else if (results.score >= 40) rating = 'Fair';
        else rating = 'Needs Practice';
        
        resultsContainer.innerHTML = `
            <div class="drill-score">
                <h4>Drill Complete!</h4>
                <div class="score-grid">
                    <div class="score-item">
                        <span class="score-label">Time</span>
                        <span class="score-value">${timeInSeconds}s</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Errors</span>
                        <span class="score-value">${results.errors}</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Score</span>
                        <span class="score-value">${results.score}/100</span>
                    </div>
                    <div class="score-item">
                        <span class="score-label">Rating</span>
                        <span class="score-value">${rating}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Reset button
        const startBtn = document.getElementById('start-schulte');
        if (startBtn) {
            startBtn.textContent = 'Start Drill';
            startBtn.disabled = false;
        }
    }

    // Reset Schulte drill
    resetSchulteDrill() {
        this.isActive = false;
        this.generateSchulteGrid();
        
        const targetElement = document.getElementById('target-number');
        const timerElement = document.getElementById('drill-time');
        const resultsContainer = document.getElementById('schulte-results');
        const startBtn = document.getElementById('start-schulte');
        
        if (targetElement) targetElement.textContent = '1';
        if (timerElement) timerElement.textContent = '0:00';
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (startBtn) {
            startBtn.textContent = 'Start Drill';
            startBtn.disabled = false;
        }
    }

    // Quick pacing drill
    showPacingDrill(container) {
        container.innerHTML = `
            <div class="drill-header">
                <h3>Quick Pacing Band</h3>
                <p>Follow the highlight band. Train your eyes to move smoothly.</p>
            </div>
            <div class="pacing-controls">
                <div class="pacing-settings">
                    <label>Speed: <span id="pacing-speed">200</span> WPM
                        <input type="range" id="pacing-slider" min="100" max="400" value="200">
                    </label>
                </div>
                <div class="pacing-timer">Time: <span id="pacing-time">0:00</span></div>
            </div>
            <div class="pacing-text" id="pacing-text">
                <div class="pacing-highlight"></div>
                <div class="text-lines" id="pacing-lines"></div>
            </div>
            <div class="drill-actions">
                <button id="start-pacing" class="primary-btn">Start Pacing</button>
                <button id="stop-pacing" class="secondary-btn">Stop</button>
            </div>
        `;
        
        this.setupPacingControls();
        this.loadPacingText();
    }

    // Setup pacing controls
    setupPacingControls() {
        const speedSlider = document.getElementById('pacing-slider');
        const speedDisplay = document.getElementById('pacing-speed');
        const startBtn = document.getElementById('start-pacing');
        const stopBtn = document.getElementById('stop-pacing');
        
        if (speedSlider && speedDisplay) {
            speedSlider.oninput = () => {
                speedDisplay.textContent = speedSlider.value;
            };
        }
        
        if (startBtn) {
            startBtn.onclick = () => this.startPacingDrill();
        }
        
        if (stopBtn) {
            stopBtn.onclick = () => this.stopPacingDrill();
        }
    }

    // Load text for pacing drill
    loadPacingText() {
        const sampleText = `Reading efficiently requires training your eyes to move smoothly across text. 
        The pacing band helps you maintain consistent reading speed while reducing unnecessary eye movements. 
        Focus on following the highlight without rushing ahead or falling behind. 
        This technique improves reading fluency and reduces fatigue during longer reading sessions. 
        Practice regularly to develop natural rhythm and flow in your reading pattern.`;
        
        const linesContainer = document.getElementById('pacing-lines');
        if (linesContainer) {
            linesContainer.innerHTML = textProcessor.formatForDisplay(sampleText, 60)
                .split('\n')
                .map(line => `<div class="text-line">${line}</div>`)
                .join('');
        }
    }

    // Start pacing drill
    startPacingDrill() {
        const speedSlider = document.getElementById('pacing-slider');
        const wpm = parseInt(speedSlider.value);
        
        this.isActive = true;
        this.drillStartTime = Date.now();
        this.startDrillTimer();
        
        this.runPacingAnimation(wpm);
        
        const startBtn = document.getElementById('start-pacing');
        if (startBtn) {
            startBtn.textContent = 'Running...';
            startBtn.disabled = true;
        }
    }

    // Run pacing animation
    runPacingAnimation(wpm) {
        const textLines = document.querySelectorAll('.text-line');
        const highlight = document.querySelector('.pacing-highlight');
        
        if (!textLines.length || !highlight) return;
        
        const totalLines = textLines.length;
        const wordsPerLine = 12; // Average
        const totalDuration = (totalLines * wordsPerLine / wpm) * 60000;
        
        let currentLine = 0;
        const lineHeight = 30; // Estimated line height
        
        const animateHighlight = () => {
            if (!this.isActive || currentLine >= totalLines) {
                this.completePacingDrill();
                return;
            }
            
            highlight.style.top = `${currentLine * lineHeight}px`;
            highlight.style.height = `${lineHeight}px`;
            highlight.style.opacity = '0.3';
            
            setTimeout(() => {
                currentLine++;
                animateHighlight();
            }, totalDuration / totalLines);
        };
        
        animateHighlight();
    }

    // Complete pacing drill
    completePacingDrill() {
        this.stopPacingDrill();
        
        const duration = Date.now() - this.drillStartTime;
        const results = {
            drillType: 'pacing',
            duration: duration,
            wpm: parseInt(document.getElementById('pacing-speed').textContent),
            completed: true
        };
        
        this.saveDrillResults(results);
        this.showCompletionMessage('Pacing drill completed! Your eyes are warmed up.');
    }

    // Stop pacing drill
    stopPacingDrill() {
        this.isActive = false;
        
        const highlight = document.querySelector('.pacing-highlight');
        if (highlight) {
            highlight.style.opacity = '0';
        }
        
        const startBtn = document.getElementById('start-pacing');
        if (startBtn) {
            startBtn.textContent = 'Start Pacing';
            startBtn.disabled = false;
        }
    }

    // Memory recall drill
    showMemoryDrill(container) {
        container.innerHTML = `
            <div class="drill-header">
                <h3>Memory Recall</h3>
                <p>Read the text, then answer questions from memory.</p>
            </div>
            <div class="memory-phase" id="memory-phase">
                <div class="phase-indicator">
                    <span id="phase-title">Get Ready</span>
                    <span id="phase-timer">3</span>
                </div>
                <div class="memory-content" id="memory-content">
                    <p>You will see a short passage. Read it carefully, then it will disappear and you'll answer questions.</p>
                </div>
                <div class="drill-actions">
                    <button id="start-memory" class="primary-btn">Start Memory Drill</button>
                </div>
            </div>
        `;
        
        this.setupMemoryControls();
    }

    // Setup memory drill controls
    setupMemoryControls() {
        const startBtn = document.getElementById('start-memory');
        
        if (startBtn) {
            startBtn.onclick = () => this.startMemoryDrill();
        }
    }

    // Start memory drill
    startMemoryDrill() {
        this.isActive = true;
        this.drillStartTime = Date.now();
        
        const memoryText = this.generateMemoryText();
        this.memoryData = {
            text: memoryText,
            questions: this.generateMemoryQuestions(memoryText),
            answers: [],
            phase: 'countdown'
        };
        
        this.runMemoryPhases();
    }

    // Run memory drill phases
    runMemoryPhases() {
        this.countdown(3, () => {
            this.showMemoryText();
        });
    }

    // Countdown phase
    countdown(seconds, callback) {
        const phaseTitle = document.getElementById('phase-title');
        const phaseTimer = document.getElementById('phase-timer');
        
        if (phaseTitle) phaseTitle.textContent = 'Get Ready';
        
        let count = seconds;
        const countInterval = setInterval(() => {
            if (phaseTimer) phaseTimer.textContent = count;
            
            count--;
            if (count < 0) {
                clearInterval(countInterval);
                callback();
            }
        }, 1000);
    }

    // Show memory text phase
    showMemoryText() {
        const phaseTitle = document.getElementById('phase-title');
        const phaseTimer = document.getElementById('phase-timer');
        const content = document.getElementById('memory-content');
        
        if (phaseTitle) phaseTitle.textContent = 'Read Carefully';
        if (phaseTimer) phaseTimer.textContent = '15';
        
        if (content) {
            content.innerHTML = `<div class="memory-text">${this.memoryData.text}</div>`;
        }
        
        // Show text for 15 seconds
        let timeLeft = 15;
        const readTimer = setInterval(() => {
            timeLeft--;
            if (phaseTimer) phaseTimer.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(readTimer);
                this.showMemoryQuestions();
            }
        }, 1000);
    }

    // Show memory questions phase
    showMemoryQuestions() {
        const phaseTitle = document.getElementById('phase-title');
        const phaseTimer = document.getElementById('phase-timer');
        const content = document.getElementById('memory-content');
        
        if (phaseTitle) phaseTitle.textContent = 'Answer Questions';
        if (phaseTimer) phaseTimer.textContent = '';
        
        if (content) {
            let questionsHtml = '<div class="memory-questions">';
            
            this.memoryData.questions.forEach((question, index) => {
                questionsHtml += `
                    <div class="memory-question">
                        <p><strong>Q${index + 1}:</strong> ${question.question}</p>
                        ${question.options.map((option, optIndex) => `
                            <label class="memory-option">
                                <input type="radio" name="memory-q${index}" value="${optIndex}">
                                ${option}
                            </label>
                        `).join('')}
                    </div>
                `;
            });
            
            questionsHtml += `
                <button onclick="warmUpDrills.submitMemoryAnswers()" class="primary-btn">Submit Answers</button>
                </div>
            `;
            
            content.innerHTML = questionsHtml;
        }
    }

    // Generate memory text
    generateMemoryText() {
        const memoryTexts = [
            "Sarah visited three cities last summer: Paris, Rome, and Barcelona. In Paris, she climbed the Eiffel Tower and visited the Louvre Museum. Rome impressed her with the Colosseum and Vatican City. Barcelona's Park Güell and Sagrada Familia were architectural marvels. She spent five days in each city, trying local cuisine and meeting new people.",
            
            "The new smartphone features a 6.5-inch display, 128GB storage, and a 48-megapixel camera. Its battery lasts 24 hours with normal use. The device supports wireless charging and is water-resistant. Available in three colors: black, silver, and blue. The price starts at $599 for the basic model.",
            
            "Climate change affects global weather patterns significantly. Average temperatures have risen by 1.2 degrees Celsius since 1880. Arctic ice melts faster each decade, raising sea levels. Extreme weather events occur more frequently. Scientists recommend reducing carbon emissions by 45% before 2030 to limit damage."
        ];
        
        return memoryTexts[Math.floor(Math.random() * memoryTexts.length)];
    }

    // Generate memory questions
    generateMemoryQuestions(text) {
        // Simple pattern-based question generation for memory drill
        const questions = [
            {
                question: "How many main topics or items were mentioned in the text?",
                options: ["2", "3", "4", "5"],
                correct: 1
            },
            {
                question: "What was the primary subject of the passage?",
                options: ["Travel", "Technology", "Environment", "Education"],
                correct: 0
            },
            {
                question: "Were specific numbers or quantities mentioned in the text?",
                options: ["Yes, several", "Yes, one or two", "No numbers mentioned", "Only dates"],
                correct: 0
            }
        ];
        
        return questions.slice(0, 3);
    }

    // Submit memory answers
    submitMemoryAnswers() {
        const questions = document.querySelectorAll('.memory-question');
        let correctCount = 0;
        
        questions.forEach((questionEl, index) => {
            const selectedOption = questionEl.querySelector('input:checked');
            if (selectedOption) {
                const answer = parseInt(selectedOption.value);
                this.memoryData.answers[index] = answer;
                
                if (answer === this.memoryData.questions[index].correct) {
                    correctCount++;
                }
            }
        });
        
        const results = {
            drillType: 'memory',
            duration: Date.now() - this.drillStartTime,
            questions: this.memoryData.questions.length,
            correct: correctCount,
            score: Math.round((correctCount / this.memoryData.questions.length) * 100)
        };
        
        this.showMemoryResults(results);
        this.saveDrillResults(results);
    }

    // Show memory results
    showMemoryResults(results) {
        const content = document.getElementById('memory-content');
        if (!content) return;
        
        const percentage = results.score;
        let feedback = '';
        
        if (percentage >= 80) {
            feedback = 'Excellent memory retention!';
        } else if (percentage >= 60) {
            feedback = 'Good recall ability.';
        } else {
            feedback = 'Practice focusing while reading.';
        }
        
        content.innerHTML = `
            <div class="memory-results">
                <h4>Memory Drill Results</h4>
                <div class="score-display">
                    <div class="score-number">${percentage}%</div>
                    <div class="score-details">${results.correct}/${results.questions} correct</div>
                </div>
                <div class="feedback">${feedback}</div>
                <button onclick="warmUpDrills.showMemoryDrill(document.getElementById('drill-content'))" class="secondary-btn">Try Again</button>
            </div>
        `;
    }

    // General drill timer
    startDrillTimer() {
        const timerElement = document.getElementById('drill-time') || document.getElementById('pacing-time');
        if (!timerElement) return;
        
        this.drillTimer = setInterval(() => {
            if (!this.isActive) return;
            
            const elapsed = Date.now() - this.drillStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            
            timerElement.textContent = 
                `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }, 100);
    }

    // Stop drill
    stopDrill() {
        this.isActive = false;
        
        if (this.drillTimer) {
            clearInterval(this.drillTimer);
        }
    }

    // Save drill results
    async saveDrillResults(results) {
        try {
            const sessionId = storage.generateId();
            await storage.saveDrill(sessionId, results.drillType, results);
        } catch (error) {
            console.error('Failed to save drill results:', error);
        }
    }

    // Show completion message
    showCompletionMessage(message) {
        const content = document.getElementById('drill-content');
        if (content && content.querySelector('.completion-message')) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'completion-message';
        messageEl.innerHTML = `
            <div class="success-message">
                <p>${message}</p>
            </div>
        `;
        
        if (content) {
            content.appendChild(messageEl);
            
            setTimeout(() => {
                messageEl.remove();
            }, 3000);
        }
    }

    // Utility: Shuffle array
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

// Initialize warm-up drills
const warmUpDrills = new WarmUpDrills();