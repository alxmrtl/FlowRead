// FlowRead Data Storage Module
class FlowReadStorage {
    constructor() {
        this.dbName = 'FlowReadDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // User store
                if (!db.objectStoreNames.contains('user')) {
                    const userStore = db.createObjectStore('user', { keyPath: 'id' });
                    userStore.createIndex('preferences', 'preferences', { unique: false });
                }

                // Text store
                if (!db.objectStoreNames.contains('text')) {
                    const textStore = db.createObjectStore('text', { keyPath: 'id' });
                    textStore.createIndex('title', 'title', { unique: false });
                    textStore.createIndex('wordCount', 'wordCount', { unique: false });
                    textStore.createIndex('difficulty', 'difficulty', { unique: false });
                    textStore.createIndex('hash', 'hash', { unique: true });
                }

                // Session store
                if (!db.objectStoreNames.contains('session')) {
                    const sessionStore = db.createObjectStore('session', { keyPath: 'id' });
                    sessionStore.createIndex('date', 'date', { unique: false });
                    sessionStore.createIndex('mode', 'mode', { unique: false });
                    sessionStore.createIndex('textId', 'textId', { unique: false });
                }

                // Comprehension store
                if (!db.objectStoreNames.contains('comprehension')) {
                    const comprehensionStore = db.createObjectStore('comprehension', { keyPath: 'sessionId' });
                    comprehensionStore.createIndex('questions', 'questions', { unique: false });
                    comprehensionStore.createIndex('correct', 'correct', { unique: false });
                }

                // Drills store
                if (!db.objectStoreNames.contains('drills')) {
                    const drillsStore = db.createObjectStore('drills', { keyPath: 'sessionId' });
                    drillsStore.createIndex('schulteSize', 'schulteSize', { unique: false });
                    drillsStore.createIndex('timeMs', 'timeMs', { unique: false });
                }

                // Retention store
                if (!db.objectStoreNames.contains('retention')) {
                    const retentionStore = db.createObjectStore('retention', { keyPath: 'id', autoIncrement: true });
                    retentionStore.createIndex('textId', 'textId', { unique: false });
                    retentionStore.createIndex('dayOffset', 'dayOffset', { unique: false });
                }
            };
        });
    }

    // Utility methods
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateHash(text) {
        let hash = 0;
        if (text.length === 0) return hash.toString();
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    // Generic CRUD operations
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // User operations
    async getUser() {
        const users = await this.getAll('user');
        if (users.length > 0) {
            return users[0];
        }
        
        // Create default user
        const defaultUser = {
            id: this.generateId(),
            preferences: {
                defaultMode: 'balanced',
                fontSize: 16,
                lineLength: 80,
                dyslexicFont: false,
                highContrast: false,
                motionSensitive: false
            },
            createdAt: Date.now()
        };
        
        await this.add('user', defaultUser);
        return defaultUser;
    }

    async updateUserPreferences(preferences) {
        const user = await this.getUser();
        user.preferences = { ...user.preferences, ...preferences };
        return this.update('user', user);
    }

    // Text operations
    async saveText(title, content, source = 'paste') {
        const wordCount = content.trim().split(/\s+/).length;
        const hash = this.generateHash(content);
        
        // Check if text already exists
        const existingTexts = await this.getAll('text');
        const existing = existingTexts.find(t => t.hash === hash);
        if (existing) return existing;

        const textData = {
            id: this.generateId(),
            title: title,
            content: content,
            source: source,
            wordCount: wordCount,
            difficulty: this.calculateDifficulty(content),
            hash: hash,
            createdAt: Date.now()
        };

        await this.add('text', textData);
        return textData;
    }

    calculateDifficulty(text) {
        const words = text.split(/\s+/);
        const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
        const sentences = text.split(/[.!?]+/).length;
        const avgSentenceLength = words.length / sentences;
        
        // Simple difficulty score (0-1)
        return Math.min(1, (avgWordLength * 0.1 + avgSentenceLength * 0.05) / 10);
    }

    // Session operations
    async saveSession(sessionData) {
        const session = {
            id: this.generateId(),
            date: Date.now(),
            ...sessionData
        };
        
        await this.add('session', session);
        return session;
    }

    async getRecentSessions(limit = 20) {
        const sessions = await this.getAll('session');
        return sessions
            .sort((a, b) => b.date - a.date)
            .slice(0, limit);
    }

    async getSessionsByMode(mode) {
        const sessions = await this.getAll('session');
        return sessions.filter(s => s.mode === mode);
    }

    // Comprehension operations
    async saveComprehension(sessionId, questions, correct) {
        const comprehensionData = {
            sessionId: sessionId,
            questions: questions,
            correct: correct,
            percentage: Math.round((correct / questions) * 100),
            date: Date.now()
        };
        
        return this.add('comprehension', comprehensionData);
    }

    async getComprehension(sessionId) {
        return this.get('comprehension', sessionId);
    }

    // Drill operations
    async saveDrill(sessionId, drillType, data) {
        const drillData = {
            sessionId: sessionId,
            type: drillType,
            date: Date.now(),
            ...data
        };
        
        return this.add('drills', drillData);
    }

    // Analytics operations
    async getStats() {
        const sessions = await this.getRecentSessions();
        const comprehensionData = await this.getAll('comprehension');
        
        if (sessions.length === 0) {
            return {
                avgSpeed: 0,
                avgComprehension: 0,
                effectiveSpeed: 0,
                totalSessions: 0,
                improvements: {
                    speed: 0,
                    comprehension: 0,
                    effective: 0
                }
            };
        }

        // Calculate averages
        const validSessions = sessions.filter(s => s.wpmTarget && s.durationMs);
        const avgSpeed = validSessions.reduce((sum, s) => sum + s.wpmTarget, 0) / validSessions.length;
        
        const sessionIds = sessions.map(s => s.id);
        const relevantComprehension = comprehensionData.filter(c => sessionIds.includes(c.sessionId));
        const avgComprehension = relevantComprehension.length > 0 
            ? relevantComprehension.reduce((sum, c) => sum + c.percentage, 0) / relevantComprehension.length
            : 0;
        
        const effectiveSpeed = (avgSpeed * avgComprehension) / 100;

        // Calculate trends (last 5 vs previous 5)
        const recent = sessions.slice(0, 5);
        const previous = sessions.slice(5, 10);
        
        let improvements = { speed: 0, comprehension: 0, effective: 0 };
        
        if (recent.length >= 3 && previous.length >= 3) {
            const recentSpeed = recent.reduce((sum, s) => sum + (s.wpmTarget || 0), 0) / recent.length;
            const previousSpeed = previous.reduce((sum, s) => sum + (s.wpmTarget || 0), 0) / previous.length;
            improvements.speed = ((recentSpeed - previousSpeed) / previousSpeed) * 100;

            const recentCompIds = recent.map(s => s.id);
            const previousCompIds = previous.map(s => s.id);
            
            const recentComp = comprehensionData.filter(c => recentCompIds.includes(c.sessionId));
            const previousComp = comprehensionData.filter(c => previousCompIds.includes(c.sessionId));
            
            if (recentComp.length > 0 && previousComp.length > 0) {
                const recentCompAvg = recentComp.reduce((sum, c) => sum + c.percentage, 0) / recentComp.length;
                const previousCompAvg = previousComp.reduce((sum, c) => sum + c.percentage, 0) / previousComp.length;
                improvements.comprehension = ((recentCompAvg - previousCompAvg) / previousCompAvg) * 100;
                
                const recentEff = (recentSpeed * recentCompAvg) / 100;
                const previousEff = (previousSpeed * previousCompAvg) / 100;
                improvements.effective = ((recentEff - previousEff) / previousEff) * 100;
            }
        }

        return {
            avgSpeed: Math.round(avgSpeed),
            avgComprehension: Math.round(avgComprehension),
            effectiveSpeed: Math.round(effectiveSpeed),
            totalSessions: sessions.length,
            improvements
        };
    }

    async getProgressData(limit = 20) {
        const sessions = await this.getRecentSessions(limit);
        const comprehensionData = await this.getAll('comprehension');
        
        return sessions.map(session => {
            const comprehension = comprehensionData.find(c => c.sessionId === session.id);
            return {
                date: session.date,
                speed: session.wpmTarget || 0,
                comprehension: comprehension ? comprehension.percentage : 0,
                effectiveSpeed: session.wpmTarget && comprehension 
                    ? Math.round((session.wpmTarget * comprehension.percentage) / 100)
                    : 0,
                mode: session.mode
            };
        }).reverse();
    }

    // Sample texts for speed reading tests
    getSampleTexts() {
        // Check if custom sample texts exist in localStorage
        const customSamples = localStorage.getItem('flowread_sample_texts');
        if (customSamples) {
            try {
                return JSON.parse(customSamples);
            } catch (e) {
                console.warn('Failed to parse custom sample texts, using defaults');
            }
        }
        
        // Default sample texts about speed reading and flow states
        // Save them to localStorage on first load so they become deletable
        const defaultSamples = this.getDefaultSampleTexts();
        this.saveSampleTexts(defaultSamples);
        return defaultSamples;
    }

    // Get the default sample texts
    getDefaultSampleTexts() {
        return [
            {
                title: "The Science of Speed Reading",
                content: `Speed reading is more than just moving your eyes faster across a page—it's a fundamental rewiring of how your brain processes text. Traditional reading habits, developed in childhood, often become obstacles to efficient comprehension as adults.

The first barrier to overcome is subvocalization, the inner voice that "speaks" every word as you read. While helpful for learning, this mental speech limits your reading speed to the pace of spoken language—roughly 200-250 words per minute. Advanced readers train themselves to process text directly through visual recognition, bypassing this auditory bottleneck entirely.

Eye movement patterns reveal another opportunity for improvement. Untrained readers make frequent regressions, unconsciously re-reading words and phrases they've already processed. This habit, born from uncertainty and poor focus, can reduce reading efficiency by 30-40%. Speed reading training teaches deliberate forward momentum, trusting your brain's remarkable ability to fill in gaps and maintain comprehension.

Peripheral vision expansion allows readers to capture multiple words—even entire phrases—in a single fixation. Instead of the typical word-by-word progression, skilled readers develop chunk reading abilities, processing 3-5 words simultaneously. This technique dramatically increases throughput while reducing eye strain and mental fatigue.

Perhaps most importantly, speed reading is adaptive. Different materials demand different approaches: emails require rapid scanning, technical documents need careful analysis, and fiction benefits from immersive pacing. The goal isn't maximum speed—it's optimal speed for your purpose, maintaining comprehension while eliminating inefficiencies that slow you down unnecessarily.`,
                wordCount: 245,
                difficulty: 0.7
            },
            {
                title: "Reading and Flow States",
                content: `The concept of flow—that state of effortless concentration where time seems to disappear—applies powerfully to reading. When readers achieve flow, comprehension increases while mental effort decreases, creating an optimal learning experience that feels both engaging and sustainable.

Flow occurs when challenge and skill levels align perfectly. If text is too easy, boredom sets in; too difficult, and anxiety disrupts focus. Speed reading training creates this balance by gradually increasing your processing capacity while providing appropriately challenging material. As your skills develop, you can tackle more complex texts while maintaining that sweet spot of engaged concentration.

The flow state requires clear goals and immediate feedback—exactly what structured reading practice provides. Unlike passive reading, speed training gives you measurable targets: words per minute, comprehension scores, and completion times. This constant feedback loop keeps your mind fully engaged, preventing the wandering attention that disrupts flow.

Eliminating distractions is crucial for achieving reading flow. This means more than just silencing notifications—it involves training your internal focus. Advanced readers develop what psychologists call "selective attention," the ability to maintain concentration despite environmental interruptions. Regular practice builds this mental muscle, making deep focus a skill rather than an accident.

The neurological benefits of reading flow extend beyond the session itself. When your brain operates in this optimal state, it forms stronger memory connections and processes information more efficiently. The result is not just faster reading, but better retention and deeper understanding—the compound effect that makes speed reading training so powerful.`,
                wordCount: 238,
                difficulty: 0.6
            },
            {
                title: "Breaking Mental Speed Limits",
                content: `The human brain processes visual information at extraordinary speeds—up to 13 milliseconds for basic recognition. Yet most people read at a fraction of their potential, trapped by mental barriers that have nothing to do with biological limitations. Breaking these psychological speed limits requires understanding the difference between what you can process and what you allow yourself to process.

Fear of missing information creates the biggest obstacle to faster reading. This anxiety manifests as regression—constantly looking back to "check" that you understood. But research shows that comprehension actually improves when you trust forward momentum. Your brain's parallel processing capabilities fill in gaps automatically, creating understanding from context and patterns rather than word-by-word analysis.

Traditional education creates artificial speed limits by emphasizing perfection over progress. Students learn to read every word carefully, treating text like a legal document requiring forensic analysis. This hypercautious approach becomes deeply ingrained, making adult readers feel guilty about "skipping" words, even when those words add no meaningful content.

The flow state dissolves these mental barriers entirely. When challenge matches skill level perfectly, self-consciousness disappears and performance skyrockets. Speed reading training creates this optimal zone by gradually increasing demands while building confidence. Each successful session proves that faster doesn't mean worse—it often means better, as increased engagement improves focus and retention.

Mental speed limits exist only in your head. Professional speed readers routinely achieve 1000+ words per minute with excellent comprehension, not because they have superhuman brains, but because they've eliminated the psychological obstacles that constrain most readers. The question isn't whether you can read faster—it's whether you'll give yourself permission to break through the artificial limits holding you back.`,
                wordCount: 252,
                difficulty: 0.7
            }
        ];
    }

    // Methods for managing custom sample texts
    saveSampleTexts(sampleTexts) {
        try {
            localStorage.setItem('flowread_sample_texts', JSON.stringify(sampleTexts));
        } catch (error) {
            console.error('Failed to save sample texts:', error);
        }
    }

    deleteSampleText(index) {
        try {
            const currentSamples = this.getSampleTexts();
            if (index >= 0 && index < currentSamples.length) {
                currentSamples.splice(index, 1);
                this.saveSampleTexts(currentSamples);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to delete sample text:', error);
            return false;
        }
    }
}

// Initialize storage
const storage = new FlowReadStorage();