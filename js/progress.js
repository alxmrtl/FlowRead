// FlowRead Progress Module
class ProgressTracker {
    constructor() {
        this.chart = null;
        this.chartData = [];
        this.adaptiveEngine = new AdaptiveProgressionEngine();
    }

    // Initialize progress tracking
    async init() {
        await this.loadProgressData();
        this.setupChart();
        this.updateStats();
        this.updateSuggestions();
    }

    // Load progress data from storage
    async loadProgressData() {
        try {
            this.chartData = await storage.getProgressData(20);
            this.currentStats = await storage.getStats();
        } catch (error) {
            console.error('Failed to load progress data:', error);
            this.chartData = [];
            this.currentStats = {
                avgSpeed: 0,
                avgComprehension: 0,
                effectiveSpeed: 0,
                totalSessions: 0,
                improvements: { speed: 0, comprehension: 0, effective: 0 }
            };
        }
    }

    // Setup progress chart
    setupChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.chartData.length === 0) {
            this.showNoDataMessage(ctx);
            return;
        }
        
        this.drawChart(ctx, canvas);
    }

    // Draw progress chart
    drawChart(ctx, canvas) {
        const padding = 60;
        const width = canvas.width - (padding * 2);
        const height = canvas.height - (padding * 2);
        
        // Prepare data
        const dataPoints = this.chartData.map((point, index) => ({
            x: padding + (index / (this.chartData.length - 1)) * width,
            speed: padding + height - (point.speed / 600) * height,
            comprehension: padding + height - (point.comprehension / 100) * height,
            effective: padding + height - (point.effectiveSpeed / 500) * height,
            date: point.date
        }));
        
        // Draw grid
        this.drawGrid(ctx, canvas, padding);
        
        // Draw lines
        this.drawLine(ctx, dataPoints, 'speed', '#2563eb', 2);
        this.drawLine(ctx, dataPoints, 'comprehension', '#059669', 2);
        this.drawLine(ctx, dataPoints, 'effective', '#d97706', 2);
        
        // Draw points
        this.drawPoints(ctx, dataPoints);
        
        // Draw legend
        this.drawLegend(ctx, canvas);
        
        // Draw axes labels
        this.drawAxesLabels(ctx, canvas, padding);
    }

    // Draw chart grid
    drawGrid(ctx, canvas, padding) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        const width = canvas.width - (padding * 2);
        const height = canvas.height - (padding * 2);
        
        // Horizontal lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();
        }
        
        // Vertical lines
        const dataCount = Math.max(this.chartData.length - 1, 1);
        for (let i = 0; i <= dataCount; i++) {
            const x = padding + (width / dataCount) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, padding + height);
            ctx.stroke();
        }
    }

    // Draw chart line
    drawLine(ctx, dataPoints, property, color, lineWidth) {
        if (dataPoints.length < 2) return;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        
        dataPoints.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point[property]);
            } else {
                ctx.lineTo(point.x, point[property]);
            }
        });
        
        ctx.stroke();
    }

    // Draw data points
    drawPoints(ctx, dataPoints) {
        dataPoints.forEach(point => {
            // Speed points (blue)
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.arc(point.x, point.speed, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Comprehension points (green)
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(point.x, point.comprehension, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            // Effective points (orange)
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.arc(point.x, point.effective, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    // Draw chart legend
    drawLegend(ctx, canvas) {
        const legendItems = [
            { label: 'Speed (WPM)', color: '#2563eb' },
            { label: 'Understanding (%)', color: '#059669' },
            { label: 'Effective Speed', color: '#d97706' }
        ];
        
        ctx.font = '14px Arial';
        const legendX = 20;
        const legendY = 30;
        
        legendItems.forEach((item, index) => {
            const y = legendY + (index * 20);
            
            // Color indicator
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, y - 6, 12, 12);
            
            // Label
            ctx.fillStyle = '#374151';
            ctx.fillText(item.label, legendX + 20, y + 4);
        });
    }

    // Draw axes labels
    drawAxesLabels(ctx, canvas, padding) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        const width = canvas.width - (padding * 2);
        const height = canvas.height - (padding * 2);
        
        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = padding + (height / 5) * i;
            const value = Math.round(600 - (600 / 5) * i);
            ctx.fillText(value.toString(), padding - 10, y + 4);
        }
        
        // X-axis (sessions)
        ctx.textAlign = 'center';
        const sessionCount = this.chartData.length;
        if (sessionCount > 0) {
            ctx.fillText('Recent Sessions', padding + width / 2, canvas.height - 10);
        }
    }

    // Show no data message
    showNoDataMessage(ctx) {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No reading data yet', 400, 200);
        ctx.fillText('Complete some reading sessions to see your progress', 400, 220);
    }

    // Update statistics display
    updateStats() {
        this.updateStatCard('progress-speed', this.currentStats.avgSpeed, 'WPM', this.currentStats.improvements.speed);
        this.updateStatCard('progress-understanding', this.currentStats.avgComprehension, '%', this.currentStats.improvements.comprehension);
        this.updateStatCard('progress-effective', this.currentStats.effectiveSpeed, 'ERR', this.currentStats.improvements.effective);
        
        // Update home screen stats too
        this.updateHomeStats();
    }

    // Update individual stat card
    updateStatCard(elementId, value, unit, improvement) {
        const statElement = document.getElementById(elementId);
        const trendId = elementId.replace('progress-', '') + '-trend';
        const trendElement = document.getElementById(trendId);
        
        if (statElement) {
            statElement.textContent = value > 0 ? `${value} ${unit}` : '--';
        }
        
        if (trendElement && improvement !== undefined) {
            const absImprovement = Math.abs(improvement);
            const direction = improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'neutral';
            const arrow = improvement > 0 ? '↗' : improvement < 0 ? '↘' : '→';
            
            trendElement.textContent = absImprovement > 1 ? 
                `${arrow} ${absImprovement.toFixed(0)}%` : '';
            trendElement.className = `trend ${direction}`;
        }
    }

    // Update home screen stats
    updateHomeStats() {
        const currentSpeedEl = document.getElementById('current-speed');
        const currentUnderstandingEl = document.getElementById('current-understanding');
        const currentEffectiveEl = document.getElementById('current-effective');
        
        if (currentSpeedEl) {
            currentSpeedEl.textContent = this.currentStats.avgSpeed > 0 ? 
                `${this.currentStats.avgSpeed} WPM` : '--';
        }
        
        if (currentUnderstandingEl) {
            currentUnderstandingEl.textContent = this.currentStats.avgComprehension > 0 ? 
                `${this.currentStats.avgComprehension}%` : '--';
        }
        
        if (currentEffectiveEl) {
            currentEffectiveEl.textContent = this.currentStats.effectiveSpeed > 0 ? 
                `${this.currentStats.effectiveSpeed}` : '--';
        }
    }

    // Update adaptive suggestions
    updateSuggestions() {
        const suggestionsElement = document.getElementById('adaptive-suggestions');
        if (!suggestionsElement) return;
        
        const suggestion = this.adaptiveEngine.generateSuggestion(this.currentStats, this.chartData);
        
        if (suggestion) {
            suggestionsElement.innerHTML = `
                <h4>Personalized Suggestion</h4>
                <p>${suggestion}</p>
            `;
            suggestionsElement.style.display = 'block';
        } else {
            suggestionsElement.style.display = 'none';
        }
    }

    // Refresh progress data
    async refresh() {
        await this.loadProgressData();
        this.setupChart();
        this.updateStats();
        this.updateSuggestions();
    }

    // Get reading level assessment
    getReadingLevel() {
        const speed = this.currentStats.avgSpeed;
        const comprehension = this.currentStats.avgComprehension;
        const effective = this.currentStats.effectiveSpeed;
        
        if (effective >= 300 && comprehension >= 80) {
            return 'Advanced Reader';
        } else if (effective >= 200 && comprehension >= 70) {
            return 'Proficient Reader';
        } else if (effective >= 120 && comprehension >= 60) {
            return 'Developing Reader';
        } else {
            return 'Beginning Reader';
        }
    }

    // Generate progress report
    generateReport() {
        const totalSessions = this.currentStats.totalSessions;
        const level = this.getReadingLevel();
        const improvements = this.currentStats.improvements;
        
        let report = `# FlowRead Progress Report\n\n`;
        report += `**Reading Level:** ${level}\n`;
        report += `**Total Sessions:** ${totalSessions}\n\n`;
        
        if (totalSessions > 0) {
            report += `**Current Performance:**\n`;
            report += `- Reading Speed: ${this.currentStats.avgSpeed} WPM\n`;
            report += `- Comprehension: ${this.currentStats.avgComprehension}%\n`;
            report += `- Effective Speed: ${this.currentStats.effectiveSpeed}\n\n`;
            
            if (totalSessions > 5) {
                report += `**Recent Improvements:**\n`;
                report += `- Speed: ${improvements.speed > 0 ? '+' : ''}${improvements.speed.toFixed(1)}%\n`;
                report += `- Comprehension: ${improvements.comprehension > 0 ? '+' : ''}${improvements.comprehension.toFixed(1)}%\n`;
                report += `- Effective Speed: ${improvements.effective > 0 ? '+' : ''}${improvements.effective.toFixed(1)}%\n\n`;
            }
        }
        
        const suggestion = this.adaptiveEngine.generateSuggestion(this.currentStats, this.chartData);
        if (suggestion) {
            report += `**Recommendation:** ${suggestion}\n`;
        }
        
        return report;
    }
}

// Adaptive Progression Engine
class AdaptiveProgressionEngine {
    constructor() {
        this.baselineWPM = 200;
        this.targetComprehension = 75;
        this.progressionRules = this.initializeRules();
    }

    // Initialize progression rules
    initializeRules() {
        return {
            // Speed increase conditions
            speedIncrease: {
                comprehensionThreshold: 80,
                consistentSessions: 2,
                increaseAmount: 20
            },
            
            // Speed decrease conditions
            speedDecrease: {
                comprehensionThreshold: 60,
                decreaseAmount: 15
            },
            
            // Technique recommendations
            techniques: {
                slowReader: { wpm: 150, technique: 'chunking' },
                averageReader: { wpm: 250, technique: 'pacer' },
                fastReader: { wpm: 350, technique: 'flash' }
            }
        };
    }

    // Generate adaptive WPM recommendation
    calculateAdaptiveWPM(currentStats, recentSessions) {
        const currentWPM = currentStats.avgSpeed;
        const currentComprehension = currentStats.avgComprehension;
        
        if (!currentWPM || currentWPM === 0) {
            return this.baselineWPM;
        }
        
        // Check recent performance
        const recentPerformance = this.analyzeRecentPerformance(recentSessions);
        
        let newWPM = currentWPM;
        
        // Apply speed increase rules
        if (currentComprehension >= this.progressionRules.speedIncrease.comprehensionThreshold &&
            recentPerformance.consistentlyGood >= this.progressionRules.speedIncrease.consistentSessions) {
            newWPM += this.progressionRules.speedIncrease.increaseAmount;
        }
        
        // Apply speed decrease rules
        else if (currentComprehension < this.progressionRules.speedDecrease.comprehensionThreshold) {
            newWPM -= this.progressionRules.speedDecrease.decreaseAmount;
        }
        
        // Ensure reasonable bounds
        return Math.max(100, Math.min(600, Math.round(newWPM)));
    }

    // Analyze recent performance patterns
    analyzeRecentPerformance(sessions) {
        if (!sessions || sessions.length < 3) {
            return { consistentlyGood: 0, declining: false, improving: false };
        }
        
        const recent = sessions.slice(-5);
        let consistentlyGood = 0;
        let improvementTrend = 0;
        
        recent.forEach((session, index) => {
            if (session.comprehension >= 75) {
                consistentlyGood++;
            }
            
            if (index > 0) {
                const prevSession = recent[index - 1];
                if (session.effectiveSpeed > prevSession.effectiveSpeed) {
                    improvementTrend++;
                }
            }
        });
        
        return {
            consistentlyGood,
            improving: improvementTrend >= 2,
            declining: improvementTrend <= -2
        };
    }

    // Recommend optimal technique
    recommendTechnique(stats) {
        const speed = stats.avgSpeed;
        const comprehension = stats.avgComprehension;
        
        if (speed < this.progressionRules.techniques.slowReader.wpm || comprehension < 60) {
            return 'chunking';
        } else if (speed > this.progressionRules.techniques.fastReader.wpm && comprehension > 80) {
            return 'flash';
        } else {
            return 'pacer';
        }
    }

    // Generate personalized suggestion
    generateSuggestion(stats, chartData) {
        if (stats.totalSessions < 3) {
            return "Complete a few more sessions to get personalized recommendations.";
        }
        
        const technique = this.recommendTechnique(stats);
        const newWPM = this.calculateAdaptiveWPM(stats, chartData);
        const currentWPM = stats.avgSpeed;
        
        let suggestion = "";
        
        // Speed suggestions
        if (newWPM > currentWPM) {
            const increase = newWPM - currentWPM;
            suggestion += `Great comprehension! Try increasing your speed to ${newWPM} WPM (+${increase}). `;
        } else if (newWPM < currentWPM) {
            const decrease = currentWPM - newWPM;
            suggestion += `Focus on understanding. Try slowing down to ${newWPM} WPM (-${decrease}). `;
        }
        
        // Technique suggestions
        if (technique === 'chunking' && stats.avgComprehension < 70) {
            suggestion += "Use phrase grouping to improve comprehension.";
        } else if (technique === 'flash' && stats.avgSpeed > 300) {
            suggestion += "Try flash reading for advanced speed training.";
        } else if (technique === 'pacer') {
            suggestion += "Use the guide band to maintain steady reading rhythm.";
        }
        
        // Progress-based suggestions
        const improvements = stats.improvements;
        if (improvements.effective > 15) {
            suggestion += " Excellent progress - keep up the balanced approach!";
        } else if (improvements.effective < -10) {
            suggestion += " Consider trying different reading techniques.";
        }
        
        return suggestion.trim();
    }

    // Calculate session difficulty adjustment
    calculateDifficultyAdjustment(userLevel, textDifficulty) {
        const levelMapping = {
            'Beginning Reader': 0.3,
            'Developing Reader': 0.5,
            'Proficient Reader': 0.7,
            'Advanced Reader': 0.9
        };
        
        const userCapability = levelMapping[userLevel] || 0.5;
        const difficultyGap = textDifficulty - userCapability;
        
        // Suggest WPM adjustment based on difficulty gap
        if (difficultyGap > 0.3) {
            return -30; // Slow down for difficult text
        } else if (difficultyGap < -0.2) {
            return +20; // Speed up for easy text
        }
        
        return 0; // No adjustment needed
    }
}

// Initialize progress tracker
const progressTracker = new ProgressTracker();