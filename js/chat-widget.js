// GoalDigger Chat Widget - GET Request Integration
window.GoalDigger = (function() {
    let isMinimized = false;
    let isLoading = false;
    let sessionId = null;
    
    // Configuration
    let config = {
        apiEndpoint: 'http://localhost:3000/chat',
        debug: false
    };
    
    // Session management utility functions
    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    function initializeSession() {
        sessionId = localStorage.getItem('goaldigger_session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            localStorage.setItem('goaldigger_session_id', sessionId);
        }
        if (config.debug) {
            console.log('Session ID:', sessionId);
        }
        
        // Display session ID in header (temporary for debugging)
        const sessionDisplay = document.getElementById('gd-session');
        if (sessionDisplay) {
            sessionDisplay.textContent = `Session: ${sessionId.substring(0, 12)}...`;
        }
    }
    
    function saveChatHistory() {
        const messages = [];
        const messageElements = document.querySelectorAll('#gd-messages .message');
        messageElements.forEach(msg => {
            if (!msg.classList.contains('loading')) {
                const sender = msg.classList.contains('user') ? 'user' : 
                              msg.classList.contains('system') ? 'system' : 'assistant';
                const isHTML = sender === 'assistant' && msg.innerHTML !== msg.textContent;
                
                messages.push({
                    content: isHTML ? msg.innerHTML : msg.textContent,
                    sender: sender,
                    isHTML: isHTML
                });
            }
        });
        localStorage.setItem('goaldigger_chat_history', JSON.stringify(messages));
    }
    
    function loadChatHistory() {
        try {
            const history = localStorage.getItem('goaldigger_chat_history');
            if (history) {
                const messages = JSON.parse(history);
                const container = document.getElementById('gd-messages');
                container.innerHTML = ''; // Clear any existing messages
                
                messages.forEach(msg => {
                    const msgElement = document.createElement('div');
                    msgElement.className = `message ${msg.sender}`;
                    
                    // Handle both old format (text) and new format (content)
                    const content = msg.content || msg.text;
                    
                    if (msg.isHTML && msg.sender === 'assistant') {
                        msgElement.innerHTML = content;
                    } else {
                        msgElement.textContent = content;
                    }
                    
                    container.appendChild(msgElement);
                });
                container.scrollTop = container.scrollHeight;
                return true; // History was loaded
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
        return false; // No history loaded
    }
    
    // Initialize widget
    function init() {
        const historyLoaded = loadChatHistory();
        if (!historyLoaded) {
            addMessage("Hi! I'm your GoalDigger Coach. How can I help you with your savings goals today?", 'assistant');
        }
    }
    
    // Public API
    const publicAPI = {
        // Configuration
        setConfig: function(newConfig) {
            config = { ...config, ...newConfig };
            if (config.debug) {
                console.log('GoalDigger config updated:', config);
            }
        },
        
        getConfig: function() {
            return { ...config };
        },
        
        // Session management
        getSessionId: function() {
            return sessionId;
        },
        
        // Send chat message
        sendMessage: async function() {
            const input = document.getElementById('gd-input');
            const message = input.value.trim();
            if (!message || isLoading) return;
            
            addMessage(message, 'user');
            input.value = '';
            setLoading(true);
            
            try {
                const response = await sendToBackend(message);
                addMessage(response, 'assistant');
                
            } catch (error) {
                console.error('Chat error:', error);
                addMessage("I'm having trouble connecting right now. Please try again in a moment.", 'assistant');
            } finally {
                setLoading(false);
            }
        },
        
        // UI Controls
        toggle: function() {
            const widget = document.getElementById('goaldigger-widget');
            isMinimized = !isMinimized;
            widget.classList.toggle('minimized');
        },
        
        // Utility methods
        clearChat: function() {
            // Confirm before clearing (optional)
            if (!confirm('Start a new conversation? This will clear your chat history.')) {
                return;
            }
            
            const container = document.getElementById('gd-messages');
            container.innerHTML = '';
            localStorage.removeItem('goaldigger_chat_history');
            
            // Show clearing animation
            addMessage("💫 Starting fresh conversation...", 'system');
            
            // Replace with welcome message after brief delay
            setTimeout(() => {
                container.innerHTML = '';
                addMessage("Hi! I'm your GoalDigger Coach. How can I help you with your savings goals today?", 'assistant');
                saveChatHistory(); // Save the new welcome message
            }, 1000);
        },
        
        addMessage: function(text, sender = 'system') {
            addMessage(text, sender);
        }
    };
    
    // Backend communication
    async function sendToBackend(message) {
        if (!config.apiEndpoint) {
            throw new Error('API endpoint not configured');
        }
        
        // Build GET request URL with parameters
        const url = new URL(config.apiEndpoint);
        url.searchParams.append('sessionId', sessionId);
        url.searchParams.append('query', message);
        
        if (config.debug) {
            console.log('GET request URL:', url.toString());
        }
        
        const response = await fetch(url.toString(), {
            method: 'GET'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.text();
        
        if (config.debug) {
            console.log('Backend response:', data);
        }
        
        // Check if response looks like HTML (error page)
        if (data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html')) {
            throw new Error('Server returned HTML error page instead of text response');
        }
        
        return data;
    }
    
    // Content processing functions
    function processGoalUpdates(text) {
        // Find all {text} patterns
        const goalUpdateRegex = /\{([^}]+)\}/g;
        const updates = [];
        let match;
        
        while ((match = goalUpdateRegex.exec(text)) !== null) {
            updates.push({
                fullMatch: match[0],
                content: match[1],
                index: match.index
            });
        }
        
        return { text, updates };
    }
    
    function renderMarkdownWithGoalUpdates(text) {
        const { text: originalText, updates } = processGoalUpdates(text);
        
        if (updates.length === 0) {
            // No goal updates, just render markdown
            return typeof marked !== 'undefined' ? marked.parse(text) : text;
        }
        
        // Replace goal updates with placeholder tokens that won't be affected by markdown
        let processedText = originalText;
        const tokenMap = new Map();
        
        // Sort updates by index in reverse order to maintain positions when replacing
        updates.sort((a, b) => b.index - a.index);
        
        updates.forEach((update, i) => {
            const token = `GOALUPDATE${i}PLACEHOLDER`;
            const goalHtml = `<div class="goal-update">📊 ${update.content}</div>`;
            tokenMap.set(token, goalHtml);
            
            processedText = processedText.substring(0, update.index) + 
                          token + 
                          processedText.substring(update.index + update.fullMatch.length);
        });
        
        // Process markdown
        let html = typeof marked !== 'undefined' ? marked.parse(processedText) : processedText;
        
        // Replace tokens with goal update HTML (use global replace to catch all instances)
        tokenMap.forEach((goalHtml, token) => {
            if (config.debug) {
                console.log(`Replacing token "${token}" with goal HTML:`, goalHtml);
                console.log('HTML before replacement:', html);
            }
            html = html.replace(new RegExp(token, 'g'), goalHtml);
            if (config.debug) {
                console.log('HTML after replacement:', html);
            }
        });
        
        if (config.debug && tokenMap.size > 0) {
            console.log('Final processed HTML:', html);
        }
        
        return html;
    }
    
    // UI Helper functions
    function addMessage(text, sender) {
        const container = document.getElementById('gd-messages');
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        
        if (sender === 'assistant') {
            // Render markdown and goal updates for assistant messages
            msg.innerHTML = renderMarkdownWithGoalUpdates(text);
        } else {
            // Plain text for user and system messages
            msg.textContent = text;
        }
        
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
        
        // Save chat history to localStorage
        saveChatHistory();
    }
    
    function setLoading(loading) {
        isLoading = loading;
        const button = document.querySelector('.gd-input-area button');
        const input = document.getElementById('gd-input');
        
        if (loading) {
            button.disabled = true;
            button.textContent = '...';
            input.disabled = true;
            addLoadingIndicator();
        } else {
            button.disabled = false;
            button.textContent = 'Send';
            input.disabled = false;
            removeLoadingIndicator();
        }
    }
    
    function addLoadingIndicator() {
        const container = document.getElementById('gd-messages');
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.id = 'loading-indicator';
        loading.innerHTML = `
            <span>GoalDigger is thinking</span>
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        container.appendChild(loading);
        container.scrollTop = container.scrollHeight;
    }
    
    function removeLoadingIndicator() {
        const loading = document.getElementById('loading-indicator');
        if (loading) {
            loading.remove();
        }
    }
    
    // Initialize on load
    initializeSession();
    init();
    
    return publicAPI;
})();