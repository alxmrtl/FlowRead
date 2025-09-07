// FlowRead Test Module - Streamlined Reading Speed Test
class SpeedTest {
    constructor() {
        this.session = null;
        this.currentTextIndex = -1;
        this.sampleTexts = storage.getSampleTexts();
        this.isTestActive = false;
        this.currentText = '';
        this.testResults = [];
    }

    // Initialize the test system
    async init() {
        console.log('Initializing Speed Test system...');
        await this.loadTestResults();
        this.updateDashboard();
        this.setupEventListeners();
    }

    // Load previous test results from storage
    async loadTestResults() {
        try {
            const sessions = await storage.getRecentSessions(50);
            this.testResults = sessions
                .filter(s => s.mode === 'test')
                .sort((a, b) => b.date - a.date)
                .map(s => ({
                    id: s.id,
                    wpm: s.actualWpm || s.wpmTarget || 0,
                    date: s.date
                }));
            console.log('Loaded', this.testResults.length, 'test results');
        } catch (error) {
            console.error('Error loading test results:', error);
            this.testResults = [];
        }
    }

    // Update the dashboard with current stats
    updateDashboard() {
        const latestWpmEl = document.getElementById('latest-wpm');
        const bestWpmEl = document.getElementById('best-wpm');

        if (this.testResults.length > 0) {
            const latest = this.testResults[0];
            const best = Math.max(...this.testResults.map(r => r.wpm));

            if (latestWpmEl) latestWpmEl.textContent = latest.wpm;
            if (bestWpmEl) bestWpmEl.textContent = best;

            this.drawProgressChart();
        } else {
            if (latestWpmEl) latestWpmEl.textContent = '--';
            if (bestWpmEl) bestWpmEl.textContent = '--';
        }
    }

    // Draw mini progress chart
    drawProgressChart() {
        const canvas = document.getElementById('progress-mini-chart');
        if (!canvas || this.testResults.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get last 10 results for the chart
        const chartData = this.testResults.slice(0, 10).reverse();
        if (chartData.length < 2) return;

        const maxWpm = Math.max(...chartData.map(r => r.wpm));
        const minWpm = Math.min(...chartData.map(r => r.wpm));
        const range = maxWpm - minWpm || 100;

        // Draw line
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.beginPath();

        chartData.forEach((result, index) => {
            const x = (index / (chartData.length - 1)) * width;
            const y = height - ((result.wpm - minWpm) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = '#4CAF50';
        chartData.forEach((result, index) => {
            const x = (index / (chartData.length - 1)) * width;
            const y = height - ((result.wpm - minWpm) / range) * height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Setup event listeners
    setupEventListeners() {
        const beginBtn = document.getElementById('begin-test');
        const doneBtn = document.getElementById('done-test');
        const completeBtn = document.getElementById('complete-test');

        if (beginBtn) {
            beginBtn.onclick = () => {
                this.startTest();
                // Auto-collapse test instructions when starting test
                if (typeof collapseTestInstructions === 'function') {
                    collapseTestInstructions();
                }
            };
        }

        if (doneBtn) {
            doneBtn.onclick = () => this.finishTest();
        }

        if (completeBtn) {
            completeBtn.onclick = () => this.completeTest();
        }
    }

    // Start a new test
    async startTest() {
        if (this.isTestActive) return;

        console.log('Starting speed test...');
        
        // Randomly select a text
        this.currentTextIndex = Math.floor(Math.random() * this.sampleTexts.length);
        this.currentText = this.sampleTexts[this.currentTextIndex].content;

        console.log('Selected text:', this.sampleTexts[this.currentTextIndex].title);

        // Initialize session
        this.session = new ReadingSession();
        await this.session.init(this.currentText, 'test', {
            title: this.sampleTexts[this.currentTextIndex].title
        });

        console.log('Session initialized');

        // Update UI first (so timer element is visible)
        this.showTestInProgress();

        // Display text
        this.displayTestText();

        console.log('UI updated, starting session timer...');

        // Start the session (this should start the timer)
        this.session.start();
        this.isTestActive = true;

        console.log('Test started with text:', this.sampleTexts[this.currentTextIndex].title);
        console.log('Timer element check:', document.getElementById('test-timer'));
    }

    // Display the test text
    displayTestText() {
        const contentEl = document.getElementById('test-content');
        if (contentEl) {
            const formattedText = textProcessor.formatForDisplay(this.currentText).replace(/\n/g, '<br>');
            contentEl.innerHTML = `<div class="test-passage">${formattedText}</div>`;
        }
    }

    // Show test in progress UI
    showTestInProgress() {
        const beginBtn = document.getElementById('begin-test');
        const doneBtn = document.getElementById('done-test');
        const timerEl = document.querySelector('.test-timer');

        if (beginBtn) beginBtn.style.display = 'none';
        if (doneBtn) doneBtn.style.display = 'inline-block';
        if (timerEl) timerEl.style.display = 'inline-block';
    }

    // Finish the test
    async finishTest() {
        if (!this.isTestActive || !this.session) return;

        console.log('Finishing speed test...');

        const stats = this.session.finish();
        this.isTestActive = false;

        // Show results
        this.showTestResults(stats);

        console.log('Test completed. WPM:', stats.wpm);
    }

    // Show test results
    showTestResults(stats) {
        const testArea = document.getElementById('test-area');
        const resultsArea = document.getElementById('test-results');
        const resultWpmEl = document.getElementById('result-wpm');
        
        if (testArea) testArea.style.display = 'none';
        if (resultsArea) resultsArea.style.display = 'block';
        if (resultWpmEl) resultWpmEl.textContent = stats.wpm;

        // Position user on WPM scale
        this.showWpmScale(stats.wpm);

        // Add to results for dashboard update
        this.testResults.unshift({
            wpm: stats.wpm,
            date: Date.now()
        });

        // Update dashboard
        this.updateDashboard();
    }

    // Show WPM scale with user position
    showWpmScale(wpm) {
        const marker = document.getElementById('user-marker');
        if (!marker) return;

        // Calculate position on scale (0-1000)
        const minWpm = 0;
        const maxWpm = 1000;
        const position = Math.max(0, Math.min(1, (wpm - minWpm) / (maxWpm - minWpm)));
        
        marker.style.left = `${position * 100}%`;
        marker.textContent = wpm;

        // Update category highlighting
        this.highlightCategory(wpm);
    }

    // Highlight the appropriate reading category
    highlightCategory(wpm) {
        const categories = document.querySelectorAll('.category');
        categories.forEach(cat => cat.classList.remove('active'));

        let categoryClass = 'beginner';
        if (wpm >= 150 && wpm < 300) categoryClass = 'cruiser';
        else if (wpm >= 300 && wpm < 500) categoryClass = 'speedster';
        else if (wpm >= 500 && wpm < 750) categoryClass = 'champion';
        else if (wpm >= 750) categoryClass = 'legendary';

        const activeCategory = document.querySelector(`.category.${categoryClass}`);
        if (activeCategory) activeCategory.classList.add('active');
    }

    // Complete test and reset
    completeTest() {
        console.log('Completing test, resetting to default view...');

        const testArea = document.getElementById('test-area');
        const resultsArea = document.getElementById('test-results');
        const beginBtn = document.getElementById('begin-test');
        const doneBtn = document.getElementById('done-test');
        const timerEl = document.querySelector('.test-timer');
        const contentEl = document.getElementById('test-content');

        // Reset UI
        if (testArea) testArea.style.display = 'block';
        if (resultsArea) resultsArea.style.display = 'none';
        if (beginBtn) beginBtn.style.display = 'inline-block';
        if (doneBtn) doneBtn.style.display = 'none';
        if (timerEl) timerEl.style.display = 'none';
        if (contentEl) contentEl.innerHTML = '';

        // Reset state
        this.currentTextIndex = -1;
        this.currentText = '';
        this.session = null;
        this.isTestActive = false;

        console.log('Test system reset, ready for next test');
    }

    // Populate the test history list
    populateTestHistory() {
        const historyList = document.getElementById('test-history-list');
        if (!historyList || this.testResults.length === 0) {
            if (historyList) {
                historyList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-style: italic;">No test history available</div>';
            }
            return;
        }

        historyList.innerHTML = '';
        
        this.testResults.forEach((result, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            
            const date = new Date(result.date);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            historyItem.innerHTML = `
                <div class="history-date">${formattedDate}</div>
                <div class="history-speed">${result.wpm} WPM</div>
                <div class="history-actions">
                    <button class="delete-test-btn" onclick="speedTest.deleteTestResult(${index})" title="Delete this test">×</button>
                </div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    // Delete a specific test result
    async deleteTestResult(index) {
        if (index < 0 || index >= this.testResults.length) return;
        
        if (!confirm('Are you sure you want to delete this test result?')) return;
        
        try {
            const result = this.testResults[index];
            
            // Delete from persistent storage
            if (result.id) {
                await storage.delete('session', result.id);
                console.log('Test result deleted from storage:', result.id);
            }
            
            // Remove from local array
            this.testResults.splice(index, 1);
            
            // Update the display
            this.populateTestHistory();
            this.updateDashboard();
            
            console.log('Test result deleted successfully');
        } catch (error) {
            console.error('Error deleting test result:', error);
        }
    }
}

// Initialize speed test system
const speedTest = new SpeedTest();