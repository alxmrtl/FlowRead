// FlowRead Text Processing Module
class TextProcessor {
    constructor() {
        this.sentenceEnders = /[.!?]+/;
        this.wordBoundary = /\s+/;
        this.punctuation = /[.,;:!?()[\]{}""''—–-]/g;
    }

    // Clean and prepare text for reading
    cleanText(text) {
        if (!text) return '';
        const textStr = String(text);
        return textStr
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '\n')
            .replace(/\t+/g, ' ');
    }

    // Split text into words
    getWords(text) {
        return this.cleanText(text)
            .split(this.wordBoundary)
            .filter(word => word.length > 0);
    }

    // Count words in text
    countWords(text) {
        return this.getWords(text).length;
    }

    // Split text into sentences
    getSentences(text) {
        return text
            .split(this.sentenceEnders)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 0);
    }

    // Create word chunks for phrase reading
    createChunks(text, chunkSize = 3) {
        const words = this.getWords(text);
        const chunks = [];
        
        for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize);
            chunks.push({
                text: chunk.join(' '),
                words: chunk,
                start: i,
                end: Math.min(i + chunkSize - 1, words.length - 1)
            });
        }
        
        return chunks;
    }

    // Create phrase-aware chunks (better for comprehension)
    createSmartChunks(text, targetChunkSize = 3) {
        const words = this.getWords(text);
        const chunks = [];
        let currentChunk = [];
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            currentChunk.push(word);
            
            // Check if we should end the chunk
            const shouldEnd = 
                currentChunk.length >= targetChunkSize && 
                (this.isPhraseEnder(word) || 
                 (i < words.length - 1 && this.isPhraseStarter(words[i + 1])));
            
            if (shouldEnd || currentChunk.length >= targetChunkSize * 1.5) {
                chunks.push({
                    text: currentChunk.join(' '),
                    words: [...currentChunk],
                    start: i - currentChunk.length + 1,
                    end: i
                });
                currentChunk = [];
            }
        }
        
        // Add remaining words
        if (currentChunk.length > 0) {
            chunks.push({
                text: currentChunk.join(' '),
                words: currentChunk,
                start: words.length - currentChunk.length,
                end: words.length - 1
            });
        }
        
        return chunks;
    }

    // Check if word typically ends a phrase
    isPhraseEnder(word) {
        const cleanWord = word.toLowerCase().replace(this.punctuation, '');
        const phraseEnders = [
            'and', 'but', 'or', 'so', 'yet', 'for', 'nor',
            'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by'
        ];
        return word.includes(',') || word.includes(';') || phraseEnders.includes(cleanWord);
    }

    // Check if word typically starts a phrase
    isPhraseStarter(word) {
        const cleanWord = word.toLowerCase().replace(this.punctuation, '');
        const phraseStarters = [
            'the', 'a', 'an', 'that', 'this', 'these', 'those',
            'when', 'where', 'why', 'how', 'what', 'who', 'which',
            'after', 'before', 'during', 'while', 'since', 'until',
            'because', 'although', 'though', 'unless', 'if', 'when'
        ];
        return phraseStarters.includes(cleanWord) || word.match(/^[A-Z]/);
    }

    // Extract key sentences for comprehension questions
    extractKeySentences(text, minLength = 10) {
        const sentences = this.getSentences(text);
        
        return sentences
            .map((sentence, index) => ({
                text: sentence,
                index: index,
                words: this.getWords(sentence),
                score: this.calculateSentenceImportance(sentence, sentences)
            }))
            .filter(s => s.words.length >= minLength)
            .sort((a, b) => b.score - a.score);
    }

    // Calculate sentence importance for quiz generation
    calculateSentenceImportance(sentence, allSentences) {
        let score = 0;
        const words = this.getWords(sentence.toLowerCase());
        
        // Length factor (moderate length preferred)
        const idealLength = 15;
        const lengthScore = 1 - Math.abs(words.length - idealLength) / idealLength;
        score += lengthScore * 0.3;
        
        // Position factor (middle sentences often more important)
        const position = allSentences.indexOf(sentence) / allSentences.length;
        const positionScore = 1 - Math.abs(position - 0.5) * 2;
        score += positionScore * 0.2;
        
        // Content factors
        const hasNumbers = /\d/.test(sentence);
        const hasProperNouns = /[A-Z][a-z]+/.test(sentence);
        const hasConnectives = /\b(because|therefore|however|although|since|while)\b/i.test(sentence);
        
        if (hasNumbers) score += 0.2;
        if (hasProperNouns) score += 0.15;
        if (hasConnectives) score += 0.25;
        
        // Avoid questions and very short/long sentences
        if (sentence.includes('?')) score -= 0.3;
        if (words.length < 8 || words.length > 25) score -= 0.2;
        
        return Math.max(0, Math.min(1, score));
    }

    // Extract entities (names, places, etc.) for quiz generation
    extractEntities(text) {
        const entities = {
            names: [],
            places: [],
            numbers: [],
            dates: []
        };
        
        // Simple pattern-based entity extraction
        const words = this.getWords(text);
        
        words.forEach((word, index) => {
            const cleanWord = word.replace(this.punctuation, '');
            
            // Proper nouns (basic detection)
            if (/^[A-Z][a-z]+$/.test(cleanWord) && cleanWord.length > 2) {
                // Context clues for classification
                const prevWord = index > 0 ? words[index - 1].toLowerCase() : '';
                const nextWord = index < words.length - 1 ? words[index + 1].toLowerCase() : '';
                
                if (['mr', 'mrs', 'dr', 'prof'].includes(prevWord) || 
                    ['said', 'told', 'asked', 'replied'].includes(nextWord)) {
                    entities.names.push(cleanWord);
                } else if (['in', 'at', 'to', 'from', 'near'].includes(prevWord)) {
                    entities.places.push(cleanWord);
                }
            }
            
            // Numbers
            if (/^\d+$/.test(cleanWord) || /^\d+[.,]\d+$/.test(cleanWord)) {
                entities.numbers.push(cleanWord);
            }
            
            // Simple date patterns
            if (/^\d{4}$/.test(cleanWord) && parseInt(cleanWord) > 1900 && parseInt(cleanWord) < 2100) {
                entities.dates.push(cleanWord);
            }
        });
        
        return entities;
    }

    // Calculate reading time estimate
    calculateReadingTime(text, wpm = 250) {
        const wordCount = this.countWords(text);
        return Math.ceil(wordCount / wpm);
    }

    // Format text for display with line length control
    formatForDisplay(text, maxLineLength = 80) {
        const words = this.getWords(text);
        const lines = [];
        let currentLine = [];
        let currentLength = 0;
        
        words.forEach(word => {
            if (currentLength + word.length + 1 > maxLineLength && currentLine.length > 0) {
                lines.push(currentLine.join(' '));
                currentLine = [word];
                currentLength = word.length;
            } else {
                currentLine.push(word);
                currentLength += word.length + (currentLine.length > 1 ? 1 : 0);
            }
        });
        
        if (currentLine.length > 0) {
            lines.push(currentLine.join(' '));
        }
        
        return lines.join('\n');
    }

    // Create word position map for visual techniques
    createWordPositions(text, containerWidth = 800, fontSize = 16) {
        const words = this.getWords(text);
        const positions = [];
        
        // Estimate character width (rough approximation)
        const charWidth = fontSize * 0.6;
        const spaceWidth = charWidth * 0.4;
        const lineHeight = fontSize * 1.4;
        
        let x = 0;
        let y = lineHeight;
        let lineWords = [];
        
        words.forEach((word, index) => {
            const wordWidth = word.length * charWidth;
            
            // Check if word fits on current line
            if (x + wordWidth > containerWidth && lineWords.length > 0) {
                y += lineHeight;
                x = 0;
                lineWords = [];
            }
            
            positions.push({
                word: word,
                index: index,
                x: x,
                y: y,
                width: wordWidth,
                line: Math.floor(y / lineHeight)
            });
            
            lineWords.push(word);
            x += wordWidth + spaceWidth;
        });
        
        return positions;
    }

    // Generate reading pace markers for pacer band
    generatePaceMarkers(text, wpm = 250, containerHeight = 400) {
        const words = this.getWords(text);
        const wordsPerSecond = wpm / 60;
        const totalTime = words.length / wordsPerSecond;
        const markers = [];
        
        // Create markers for each second
        for (let i = 0; i <= totalTime; i++) {
            const wordIndex = Math.floor(i * wordsPerSecond);
            const progress = i / totalTime;
            
            markers.push({
                time: i,
                wordIndex: Math.min(wordIndex, words.length - 1),
                y: progress * containerHeight,
                percentage: progress * 100
            });
        }
        
        return markers;
    }
}

// Initialize text processor
const textProcessor = new TextProcessor();