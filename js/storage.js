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
        return [
            {
                title: "The Future of Reading",
                content: `Reading has evolved dramatically over the centuries, from ancient scrolls to digital screens. Today, we face new challenges in how we process information in an increasingly connected world.

The average person now encounters more text in a single day than previous generations might have seen in weeks. Social media posts, emails, articles, and notifications compete for our attention. This information overload has created a need for more efficient reading strategies.

Speed reading techniques have gained popularity as a response to this challenge. These methods focus on reducing subvocalization, expanding peripheral vision, and eliminating regression. However, comprehension must remain the primary goal. There is little value in reading quickly if the material is not understood or retained.

Modern research in cognitive science reveals that reading is a complex process involving multiple brain regions. Visual processing, language comprehension, and memory formation all work together to create meaning from text. Understanding these mechanisms can help us develop better reading strategies.

Technology also plays a crucial role in modern reading habits. E-readers and tablets offer features like adjustable font sizes and backlighting. Some applications use rapid serial visual presentation to train reading speed. Others employ eye-tracking to analyze reading patterns and suggest improvements.

The key to effective reading lies in adaptability. Different types of content require different approaches. Skimming works well for emails and social media, while technical documents demand careful, deliberate reading. The skilled reader learns when to accelerate and when to slow down, matching their reading speed to their comprehension goals.`,
                wordCount: 250,
                difficulty: 0.6
            },
            {
                title: "Morning Coffee Ritual",
                content: `The aroma of freshly ground coffee beans fills the kitchen as Sarah begins her morning ritual. This daily ceremony has remained unchanged for years, providing structure and comfort to the start of each day.

First, she selects her favorite mug from the cabinet. It's nothing fancy—a simple white ceramic cup with a small chip on the handle that makes it uniquely hers. The coffee maker, an old but reliable machine, begins its familiar gurgling as hot water meets the grounds.

While waiting, Sarah opens the window to let in fresh air. The sounds of the neighborhood awakening drift in: dogs barking, cars starting, the distant hum of traffic. These sounds don't disturb her; instead, they create a soundtrack that signals the world coming to life.

The coffee finishes brewing with a final hiss. She pours it slowly, watching the dark liquid fill the cup. No sugar or cream—she prefers it black, strong, and honest. The first sip is always the best, warming her from the inside out.

With her coffee in hand, Sarah sits at the kitchen table and looks out at her small garden. The plants are thriving despite her occasional forgetfulness with watering. A robin lands on the fence, pecks at something invisible, then flies away.

This quiet moment before the day's responsibilities take over is precious to her. No phone, no notifications, no urgent tasks. Just coffee, silence, and the gentle transition from sleep to wakefulness. Some might call it simple, but Sarah knows that the best things in life often are.`,
                wordCount: 260,
                difficulty: 0.4
            },
            {
                title: "The Science of Memory",
                content: `Human memory is one of the most fascinating and complex aspects of cognition. Unlike a computer's storage system, our memories are not simply filed away in discrete locations. Instead, they are distributed across networks of neurons that work together to encode, store, and retrieve information.

The process begins with encoding, where sensory information is converted into a form that can be stored in the brain. This involves attention and perception—we cannot remember what we do not first notice. The hippocampus plays a crucial role in this initial processing, acting as a temporary holding area for new memories.

Short-term memory has limited capacity and duration. Miller's famous paper suggested we can hold about seven items in working memory, though recent research suggests the number may be closer to four. Without rehearsal or transfer to long-term memory, this information quickly fades.

Long-term memory storage involves structural changes in neural connections. Repeated activation of specific neural pathways strengthens synaptic connections through a process called long-term potentiation. This is why repetition and practice are so important for learning and retention.

Memory retrieval is not like playing back a recording. Each time we recall a memory, we reconstruct it from various neural networks. This reconstruction can be influenced by our current state, emotions, and other memories. As a result, our recollections can change over time, sometimes becoming distorted or incorporating false elements.

Understanding these processes has practical implications for learning and studying. Techniques like spaced repetition, elaborative encoding, and the use of multiple sensory modalities can significantly improve memory formation and retention. The key is working with our brain's natural processes rather than against them.`,
                wordCount: 280,
                difficulty: 0.8
            },
            {
                title: "Ocean Exploration",
                content: `The ocean covers more than seventy percent of Earth's surface, yet humans have explored less than five percent of this vast underwater realm. This mysterious frontier holds countless secrets about our planet's history, climate, and the origins of life itself.

Deep-sea exploration began in earnest during the twentieth century with the development of advanced submersibles and diving equipment. Early pioneers like Jacques Cousteau brought the underwater world to public attention through films and documentaries. Their work inspired a new generation of marine scientists and explorers.

Modern technology has revolutionized our ability to study the ocean depths. Remotely operated vehicles can descend to crushing depths where humans cannot survive. These robotic explorers are equipped with high-definition cameras, sampling equipment, and powerful lights that illuminate the eternal darkness of the deep sea.

Recent discoveries have been nothing short of extraordinary. Scientists have found entire ecosystems thriving around hydrothermal vents, where superheated water rich in minerals creates oases of life in the ocean desert. Bizarre creatures adapted to extreme pressure and temperature conditions challenge our understanding of life's limits.

The ocean plays a crucial role in regulating Earth's climate system. Ocean currents transport heat around the globe, while the water itself absorbs massive amounts of carbon dioxide from the atmosphere. Understanding these processes is essential for predicting future climate changes and their impacts on human civilization.

Conservation efforts have become increasingly important as human activities threaten marine ecosystems. Overfishing, pollution, and climate change pose significant challenges to ocean health. Protecting these underwater environments requires international cooperation and continued scientific research to understand the complex relationships between marine life and ocean systems.`,
                wordCount: 275,
                difficulty: 0.7
            },
            {
                title: "The Art of Cooking",
                content: `Cooking is both an art and a science, combining creativity with precise techniques to transform raw ingredients into nourishing and delicious meals. Throughout history, culinary traditions have evolved alongside human civilization, reflecting cultural values, available resources, and technological advances.

The foundation of good cooking lies in understanding ingredients and how they interact with heat, time, and other elements. A skilled chef knows that onions become sweet when caramelized slowly, that proteins coagulate at specific temperatures, and that acids can brighten flavors while balancing richness.

Preparation is often more important than the actual cooking process. Professional chefs spend hours preparing ingredients before service begins. This mise en place philosophy ensures that everything is ready when needed, allowing the cook to focus on timing and execution during the critical cooking phase.

Different cooking methods produce dramatically different results from the same ingredients. Roasting concentrates flavors through caramelization, while steaming preserves delicate textures and nutrients. Braising combines dry and moist heat to tenderize tough cuts of meat, creating complex layers of flavor through patient, slow cooking.

Seasoning is perhaps the most crucial skill in cooking. Salt enhances natural flavors rather than masking them, while herbs and spices add complexity and cultural identity to dishes. The timing of when seasonings are added can dramatically affect the final result.

Modern cooking has embraced both traditional techniques and innovative approaches. Molecular gastronomy explores the science behind cooking, while farm-to-table movements emphasize local, seasonal ingredients. Despite these trends, the fundamental principles of good cooking remain unchanged: respect for ingredients, attention to detail, and a passion for creating memorable dining experiences.`,
                wordCount: 270,
                difficulty: 0.6
            },
            {
                title: "Urban Wildlife",
                content: `Cities might seem like concrete jungles, but they actually support a surprising diversity of wildlife. Urban environments create unique ecosystems where animals and plants adapt to life alongside millions of humans. These adaptations often lead to fascinating behavioral changes and evolutionary developments.

Birds are perhaps the most visible urban wildlife. Pigeons have become so synonymous with city life that many people forget they were originally rock doves that nested on cliffs. Their ability to navigate using landmarks and magnetic fields makes them perfect urban residents. Hawks and falcons nest on skyscrapers, hunting the abundant pigeon population from great heights.

Mammals have also found ways to thrive in urban settings. Raccoons have become expert problem-solvers, learning to open garbage cans and even washing their food in fountains. Coyotes have expanded their range into many cities, adapting their hunting strategies and becoming more nocturnal to avoid human contact.

Urban waterways support their own communities of wildlife. Storm drains and concrete channels may seem inhospitable, but they often teem with life during rainy seasons. Ducks, geese, and other waterfowl make their homes in city parks and artificial ponds, while fish populations adapt to altered water conditions.

Plant life in cities creates vital green corridors for wildlife movement. Parks, gardens, and even weedy vacant lots provide food, shelter, and nesting sites. Native plants support local insect populations, which in turn feed birds and other small animals, creating interconnected food webs within urban environments.

Understanding urban wildlife helps us design better cities that support both human needs and biodiversity. Green roofs, wildlife corridors, and native plant landscaping can create more sustainable urban environments that benefit all residents, both human and non-human alike.`,
                wordCount: 285,
                difficulty: 0.7
            },
            {
                title: "The Power of Music",
                content: `Music possesses a unique ability to transcend cultural boundaries and speak directly to human emotions. This universal language has accompanied humanity throughout history, serving as a means of communication, celebration, mourning, and creative expression across every known civilization.

The psychological effects of music are both immediate and profound. Research shows that listening to music releases dopamine in the brain, the same neurotransmitter associated with pleasure from food, relationships, and other rewarding experiences. Different types of music can lower stress hormones, reduce anxiety, and even boost immune system function.

Music therapy has emerged as a legitimate medical treatment for various conditions. Stroke patients often recover speech abilities more quickly when working with music therapists. Alzheimer's patients may remember song lyrics long after other memories have faded, suggesting that musical memories are stored differently in the brain than other types of information.

The structure of music reflects mathematical principles found throughout nature. The relationships between musical intervals correspond to mathematical ratios, while rhythm patterns mirror biological cycles like heartbeats and breathing. This connection between music and natural patterns may explain why certain musical combinations feel inherently pleasing to human ears.

Technology has transformed how we create, distribute, and experience music. Digital tools allow anyone to compose and record music from their home, while streaming services provide instant access to virtually any song ever recorded. However, live performance remains irreplaceable, creating shared experiences that recorded music cannot fully replicate.

Cultural identity often intertwines closely with musical traditions. Folk songs preserve historical narratives and cultural values across generations. Modern genres continue this tradition, with hip-hop, country, reggae, and other styles reflecting the experiences and perspectives of their originating communities while influencing global culture.`,
                wordCount: 280,
                difficulty: 0.7
            },
            {
                title: "Space Exploration",
                content: `Humanity's desire to explore space represents one of our greatest achievements and most ambitious ongoing endeavors. From the first satellite launches to plans for Mars colonization, space exploration has pushed the boundaries of technology, science, and human endurance while fundamentally changing our perspective on Earth and our place in the universe.

The space race of the twentieth century drove rapid technological advancement. Competition between nations led to remarkable achievements in a relatively short timespan: from first satellite to moon landing in just twelve years. These achievements required unprecedented cooperation between scientists, engineers, and organizations working toward common goals.

Robotic missions have revolutionized our understanding of the solar system. Unmanned spacecraft have visited every planet, photographed distant moons, and sampled alien atmospheres. The Hubble Space Telescope has captured images of galaxies billions of light-years away, while Mars rovers search for signs of past or present life on the Red Planet.

The International Space Station represents the pinnacle of international cooperation in space. Astronauts and cosmonauts from different countries work together in microgravity, conducting experiments that would be impossible on Earth. Their research advances our knowledge of materials science, biology, and physics while preparing for future long-duration missions.

Commercial spaceflight has opened new possibilities for space exploration. Private companies are developing reusable rockets, space tourism, and even plans for space manufacturing. This commercialization could make space more accessible while reducing costs for scientific missions and exploration.

Future space exploration faces both technical and ethical challenges. Long-duration missions to Mars will test human psychological and physical limits. Questions about planetary protection, resource utilization, and the rights of potential extraterrestrial life require careful consideration as we expand our presence beyond Earth.`,
                wordCount: 275,
                difficulty: 0.8
            },
            {
                title: "The History of Books",
                content: `Books have been humanity's primary method of preserving and transmitting knowledge for thousands of years. The evolution of books reflects technological advances, cultural changes, and the persistent human desire to record ideas, stories, and information for future generations.

The earliest books were clay tablets used by ancient civilizations to record transactions, laws, and literature. The Epic of Gilgamesh, one of humanity's oldest known stories, was preserved on such tablets. Ancient Egyptians developed papyrus scrolls, while Chinese and Roman cultures created books using various materials including bamboo, silk, and parchment.

The invention of the printing press in the fifteenth century revolutionized book production and distribution. Gutenberg's movable type made books affordable for ordinary people rather than just wealthy elites and religious institutions. This democratization of knowledge accelerated the spread of literacy and enabled the Renaissance, Reformation, and Scientific Revolution.

Book design evolved to improve readability and durability. The codex format, with pages bound together, replaced scrolls because it was more practical for reference and storage. Typography developed into an art form, with different fonts designed for specific purposes. Illustrations, indices, and chapter divisions made books more user-friendly and accessible.

The industrial revolution brought mass production techniques to book manufacturing. Steam-powered printing presses, wood pulp paper, and mechanized binding reduced costs further while improving quality and consistency. Public libraries and educational systems expanded access to books for all social classes.

Digital technology now challenges traditional book formats while creating new possibilities. E-books offer convenience and instant access, while audiobooks cater to different learning preferences. However, physical books remain popular, suggesting that the tactile experience of reading will continue alongside digital innovations in publishing and distribution.`,
                wordCount: 270,
                difficulty: 0.6
            },
            {
                title: "The Science of Sleep",
                content: `Sleep remains one of the most mysterious and essential aspects of human biology. Despite spending roughly one-third of our lives asleep, scientists are still uncovering the complex mechanisms and purposes of this daily phenomenon that appears universal among animal species.

The sleep cycle consists of distinct stages, each serving different functions. Non-REM sleep includes light sleep, deep sleep, and the deepest stage where physical restoration occurs. During deep sleep, the body repairs tissues, consolidates immune function, and releases growth hormones. REM sleep, characterized by rapid eye movements and vivid dreams, appears crucial for memory consolidation and emotional processing.

Sleep architecture changes throughout our lifespans. Infants spend most of their time sleeping, with a higher proportion of REM sleep that supports rapid brain development. Adolescents experience shifts in circadian rhythms that make them naturally stay up later, while older adults often experience fragmented sleep and changes in sleep quality.

Modern life poses significant challenges to healthy sleep patterns. Artificial lighting, particularly blue light from screens, can disrupt the production of melatonin, the hormone that regulates sleep-wake cycles. Shift work, jet lag, and constant connectivity create additional obstacles to maintaining consistent, restorative sleep schedules.

Sleep deprivation has serious consequences for physical and mental health. Chronic sleep loss increases risks of obesity, diabetes, heart disease, and depression. Cognitive function suffers dramatically with insufficient sleep, affecting attention, decision-making, and memory formation. Even moderate sleep restriction can impair performance similar to alcohol intoxication.

Understanding sleep science has led to better treatments for sleep disorders and improved sleep hygiene recommendations. Sleep medicine now recognizes conditions like sleep apnea, restless leg syndrome, and various parasomnias. Simple changes in environment, routine, and lifestyle can significantly improve sleep quality for most people.`,
                wordCount: 285,
                difficulty: 0.8
            }
        ];
    }
}

// Initialize storage
const storage = new FlowReadStorage();