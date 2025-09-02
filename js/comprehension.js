// FlowRead Comprehension Quiz Module
class ComprehensionQuiz {
    constructor() {
        this.currentSessionId = null;
        this.currentText = null;
        this.questions = [];
        this.answers = [];
        this.currentQuestionIndex = 0;
        this.isActive = false;
    }

    // Start comprehension quiz
    async start(sessionId, text) {
        this.currentSessionId = sessionId;
        this.currentText = text;
        this.questions = this.generateQuestions(text);
        this.answers = [];
        this.currentQuestionIndex = 0;
        this.isActive = true;
        
        this.displayQuiz();
        this.showScreen();
    }

    // Generate comprehension questions
    generateQuestions(text, numQuestions = 5) {
        const questions = [];
        const sentences = textProcessor.extractKeySentences(text);
        const entities = textProcessor.extractEntities(text);
        
        // Ensure we have enough content for questions
        if (sentences.length < 3) {
            return this.generateBasicQuestions(text);
        }
        
        // Generate different types of questions
        const questionTypes = ['fact', 'inference', 'detail', 'main-idea', 'vocabulary'];
        
        for (let i = 0; i < numQuestions && i < sentences.length; i++) {
            const questionType = questionTypes[i % questionTypes.length];
            const sentence = sentences[i];
            
            let question = null;
            
            switch (questionType) {
                case 'fact':
                    question = this.generateFactQuestion(sentence, entities);
                    break;
                case 'inference':
                    question = this.generateInferenceQuestion(sentence, text);
                    break;
                case 'detail':
                    question = this.generateDetailQuestion(sentence);
                    break;
                case 'main-idea':
                    question = this.generateMainIdeaQuestion(text, sentences);
                    break;
                case 'vocabulary':
                    question = this.generateVocabularyQuestion(sentence);
                    break;
            }
            
            if (question && question.options.length === 4) {
                questions.push(question);
            }
        }
        
        // Fill remaining slots with basic questions if needed
        while (questions.length < numQuestions && questions.length < sentences.length) {
            const sentence = sentences[questions.length];
            const basicQuestion = this.generateBasicQuestion(sentence);
            if (basicQuestion) {
                questions.push(basicQuestion);
            }
        }
        
        return questions.slice(0, numQuestions);
    }

    // Generate fact-based question
    generateFactQuestion(sentence, entities) {
        const words = textProcessor.getWords(sentence.text);
        
        // Look for entities to question about
        const names = entities.names.filter(name => sentence.text.includes(name));
        const numbers = entities.numbers.filter(num => sentence.text.includes(num));
        const places = entities.places.filter(place => sentence.text.includes(place));
        
        if (names.length > 0) {
            const name = names[0];
            return {
                type: 'fact',
                question: `According to the text, what is mentioned about ${name}?`,
                correct: this.extractContext(sentence.text, name),
                options: this.generateFactOptions(sentence.text, name),
                correctIndex: 0
            };
        }
        
        if (numbers.length > 0) {
            const number = numbers[0];
            return {
                type: 'fact',
                question: `What significance does the number ${number} have in the text?`,
                correct: this.extractContext(sentence.text, number),
                options: this.generateNumberOptions(sentence.text, number),
                correctIndex: 0
            };
        }
        
        return this.generateBasicQuestion(sentence);
    }

    // Generate inference question
    generateInferenceQuestion(sentence, fullText) {
        const context = this.findRelatedSentences(sentence.text, fullText);
        
        return {
            type: 'inference',
            question: `Based on the text, what can you infer about the situation described?`,
            correct: this.createInferenceAnswer(sentence.text, context),
            options: this.generateInferenceOptions(sentence.text, context),
            correctIndex: 0
        };
    }

    // Generate detail question
    generateDetailQuestion(sentence) {
        const words = textProcessor.getWords(sentence.text);
        const keyWords = words.filter(word => 
            word.length > 4 && 
            !['that', 'this', 'with', 'from', 'they', 'were', 'been', 'have'].includes(word.toLowerCase())
        );
        
        if (keyWords.length > 0) {
            const keyWord = keyWords[0];
            const maskedSentence = sentence.text.replace(new RegExp(`\\b${keyWord}\\b`, 'gi'), '_____');
            
            return {
                type: 'detail',
                question: `Complete this sentence from the text: "${maskedSentence}"`,
                correct: keyWord,
                options: this.generateWordOptions(keyWord),
                correctIndex: 0
            };
        }
        
        return this.generateBasicQuestion(sentence);
    }

    // Generate main idea question
    generateMainIdeaQuestion(text, sentences) {
        const topSentences = sentences.slice(0, 3);
        const themes = this.extractThemes(topSentences.map(s => s.text));
        
        return {
            type: 'main-idea',
            question: 'What is the main theme of this text?',
            correct: themes[0] || 'The central topic discussed',
            options: this.generateThemeOptions(themes),
            correctIndex: 0
        };
    }

    // Generate vocabulary question
    generateVocabularyQuestion(sentence) {
        const words = textProcessor.getWords(sentence.text);
        const complexWords = words.filter(word => 
            word.length > 6 && 
            /^[a-zA-Z]+$/.test(word) &&
            !['through', 'because', 'without', 'between'].includes(word.toLowerCase())
        );
        
        if (complexWords.length > 0) {
            const word = complexWords[0];
            const context = this.extractContext(sentence.text, word);
            
            return {
                type: 'vocabulary',
                question: `In the context "${context}", what does "${word}" most likely mean?`,
                correct: this.generateDefinition(word, context),
                options: this.generateDefinitionOptions(word),
                correctIndex: 0
            };
        }
        
        return this.generateBasicQuestion(sentence);
    }

    // Generate basic fallback question
    generateBasicQuestion(sentence) {
        const text = sentence.text;
        const words = textProcessor.getWords(text);
        
        if (words.length < 5) return null;
        
        // Simple true/false style question
        const maskedText = this.maskImportantWord(text);
        
        return {
            type: 'basic',
            question: `Which statement about the text is accurate?`,
            correct: text,
            options: [
                text,
                this.generateAlternativeStatement(text),
                this.generateAlternativeStatement(text, 'opposite'),
                this.generateAlternativeStatement(text, 'partial')
            ],
            correctIndex: 0
        };
    }

    // Generate basic questions for short texts
    generateBasicQuestions(text) {
        const sentences = textProcessor.getSentences(text);
        const questions = [];
        
        sentences.slice(0, 3).forEach((sentence, index) => {
            const question = {
                type: 'basic',
                question: `What does the text say about ${this.extractSubject(sentence)}?`,
                correct: sentence,
                options: [
                    sentence,
                    this.generateAlternativeStatement(sentence),
                    this.generateAlternativeStatement(sentence, 'opposite'),
                    'This is not mentioned in the text'
                ],
                correctIndex: 0
            };
            questions.push(question);
        });
        
        return questions;
    }

    // Helper methods for question generation
    extractContext(sentence, target) {
        const words = sentence.split(/\s+/);
        const targetIndex = words.findIndex(word => 
            word.toLowerCase().includes(target.toLowerCase())
        );
        
        if (targetIndex === -1) return sentence;
        
        const start = Math.max(0, targetIndex - 3);
        const end = Math.min(words.length, targetIndex + 4);
        
        return words.slice(start, end).join(' ');
    }

    extractSubject(sentence) {
        const words = textProcessor.getWords(sentence);
        const subjects = words.filter(word => 
            /^[A-Z]/.test(word) && word.length > 2
        );
        return subjects[0] || 'the topic';
    }

    maskImportantWord(sentence) {
        const words = textProcessor.getWords(sentence);
        const importantWords = words.filter(word => 
            word.length > 4 && !/^(the|and|but|for|with)$/i.test(word)
        );
        
        if (importantWords.length > 0) {
            return sentence.replace(importantWords[0], '_____');
        }
        
        return sentence;
    }

    generateAlternativeStatement(original, type = 'similar') {
        const words = textProcessor.getWords(original);
        
        switch (type) {
            case 'opposite':
                return original.replace(/\bis\b/g, 'is not')
                              .replace(/\bwas\b/g, 'was not')
                              .replace(/\bcan\b/g, 'cannot')
                              .replace(/\bwill\b/g, 'will not');
            
            case 'partial':
                const midpoint = Math.floor(words.length / 2);
                return words.slice(0, midpoint).join(' ') + '...';
            
            default:
                // Synonym replacement or word order change
                return words.map(word => {
                    const synonyms = this.getSimpleSynonyms(word);
                    return synonyms[Math.floor(Math.random() * synonyms.length)];
                }).join(' ');
        }
    }

    getSimpleSynonyms(word) {
        const synonymMap = {
            'big': ['large', 'huge', 'massive', 'enormous'],
            'small': ['little', 'tiny', 'miniature', 'compact'],
            'good': ['excellent', 'great', 'wonderful', 'positive'],
            'bad': ['poor', 'terrible', 'awful', 'negative'],
            'fast': ['quick', 'rapid', 'speedy', 'swift'],
            'slow': ['gradual', 'leisurely', 'unhurried', 'delayed']
        };
        
        return synonymMap[word.toLowerCase()] || [word];
    }

    generateFactOptions(sentence, target) {
        const correctAnswer = this.extractContext(sentence, target);
        return [
            correctAnswer,
            this.generateAlternativeStatement(correctAnswer),
            this.generateAlternativeStatement(correctAnswer, 'opposite'),
            'This information is not provided in the text'
        ];
    }

    generateWordOptions(correctWord) {
        const alternatives = this.generateSimilarWords(correctWord);
        return [correctWord, ...alternatives.slice(0, 3)];
    }

    generateSimilarWords(word) {
        // Generate plausible alternatives
        const variations = [
            word.slice(0, -2) + 'ed',
            word.slice(0, -1) + 'ing',
            word + 's',
            word.slice(1) + word[0]
        ].filter(v => v !== word);
        
        // Add some common words as distractors
        const distractors = ['important', 'significant', 'relevant', 'apparent', 'obvious', 'clear'];
        
        return [...variations, ...distractors].slice(0, 3);
    }

    extractThemes(sentences) {
        const commonWords = {};
        
        sentences.forEach(sentence => {
            const words = textProcessor.getWords(sentence.toLowerCase());
            words.filter(word => word.length > 4).forEach(word => {
                commonWords[word] = (commonWords[word] || 0) + 1;
            });
        });
        
        return Object.entries(commonWords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([word]) => `The ${word} aspect`);
    }

    generateThemeOptions(themes) {
        const options = themes.slice(0, 1);
        const alternatives = [
            'The historical context',
            'The technical details', 
            'The personal opinions',
            'The statistical data'
        ];
        
        return [...options, ...alternatives.slice(0, 3)];
    }

    // Display quiz interface
    displayQuiz() {
        const container = document.getElementById('question-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.questions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.style.display = index === 0 ? 'block' : 'none';
            
            questionDiv.innerHTML = `
                <h4>Question ${index + 1} of ${this.questions.length}</h4>
                <p>${question.question}</p>
                <div class="answer-options">
                    ${question.options.map((option, optIndex) => `
                        <label class="answer-option">
                            <input type="radio" name="question-${index}" value="${optIndex}">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="question-nav">
                    ${index > 0 ? `<button onclick="comprehensionQuiz.previousQuestion()" class="secondary-btn">Previous</button>` : ''}
                    ${index < this.questions.length - 1 ? 
                        `<button onclick="comprehensionQuiz.nextQuestion()" class="primary-btn">Next</button>` :
                        `<button onclick="comprehensionQuiz.submitQuiz()" class="primary-btn">Submit Quiz</button>`
                    }
                </div>
            `;
            
            container.appendChild(questionDiv);
        });
    }

    // Show quiz screen
    showScreen() {
        // Hide other screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show quiz screen
        const quizScreen = document.getElementById('quiz-screen');
        if (quizScreen) {
            quizScreen.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // Navigation methods
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.saveCurrentAnswer();
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.saveCurrentAnswer();
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    }

    showQuestion(index) {
        const questions = document.querySelectorAll('.question');
        questions.forEach((q, i) => {
            q.style.display = i === index ? 'block' : 'none';
        });
        
        this.currentQuestionIndex = index;
        this.restoreAnswer(index);
    }

    saveCurrentAnswer() {
        const questionElement = document.querySelector('.question:nth-child(' + (this.currentQuestionIndex + 1) + ')');
        const selectedOption = questionElement.querySelector('input[type="radio"]:checked');
        
        if (selectedOption) {
            this.answers[this.currentQuestionIndex] = parseInt(selectedOption.value);
        }
    }

    restoreAnswer(index) {
        if (this.answers[index] !== undefined) {
            const questionElement = document.querySelector('.question:nth-child(' + (index + 1) + ')');
            const option = questionElement.querySelector(`input[value="${this.answers[index]}"]`);
            if (option) {
                option.checked = true;
            }
        }
    }

    // Submit quiz and calculate results
    async submitQuiz() {
        this.saveCurrentAnswer();
        
        let correctCount = 0;
        
        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            if (userAnswer === question.correctIndex) {
                correctCount++;
            }
        });
        
        const comprehensionScore = {
            sessionId: this.currentSessionId,
            questions: this.questions.length,
            correct: correctCount,
            percentage: Math.round((correctCount / this.questions.length) * 100)
        };
        
        // Save results
        await storage.saveComprehension(
            this.currentSessionId,
            this.questions.length,
            correctCount
        );
        
        // Show results
        this.showResults(comprehensionScore);
    }

    // Show quiz results
    showResults(score) {
        const container = document.getElementById('question-container');
        if (!container) return;
        
        const percentage = score.percentage;
        let feedback = '';
        
        if (percentage >= 80) {
            feedback = 'Excellent comprehension! Try faster next time.';
        } else if (percentage >= 60) {
            feedback = 'Good understanding. Consider your reading speed.';
        } else {
            feedback = 'Focus on accuracy. Slow down if needed.';
        }
        
        container.innerHTML = `
            <div class="quiz-results">
                <h3>Comprehension Results</h3>
                <div class="score-display">
                    <div class="score-number">${percentage}%</div>
                    <div class="score-fraction">${score.correct}/${score.questions} correct</div>
                </div>
                <div class="feedback">${feedback}</div>
                <div class="results-actions">
                    <button onclick="app.showProgress()" class="primary-btn">View Progress</button>
                    <button onclick="app.showHome()" class="secondary-btn">Home</button>
                </div>
            </div>
        `;
        
        // Update adaptive suggestions
        this.updateAdaptiveSuggestions(score);
    }

    // Update adaptive reading suggestions
    async updateAdaptiveSuggestions(comprehensionScore) {
        const stats = await storage.getStats();
        const suggestionsElement = document.getElementById('adaptive-suggestions');
        
        if (!suggestionsElement) return;
        
        let suggestion = '';
        
        if (comprehensionScore.percentage >= 80 && stats.avgSpeed < 300) {
            suggestion = 'Great comprehension! Try increasing your speed by 20-30 WPM.';
        } else if (comprehensionScore.percentage < 60) {
            suggestion = 'Focus on understanding. Try slowing down by 10-20 WPM.';
        } else if (stats.totalSessions > 5) {
            const trend = stats.improvements.effective;
            if (trend > 10) {
                suggestion = 'Excellent progress! Keep up the balanced approach.';
            } else if (trend < -5) {
                suggestion = 'Consider mixing different reading techniques.';
            }
        }
        
        if (suggestion) {
            suggestionsElement.innerHTML = `<p><strong>Suggestion:</strong> ${suggestion}</p>`;
        }
    }
}

// Initialize comprehension quiz
const comprehensionQuiz = new ComprehensionQuiz();