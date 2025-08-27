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
    
    function setCookie(name, value, days = 30) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }
    
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    function initializeSession() {
        sessionId = getCookie('goaldigger_session_id');
        if (!sessionId) {
            sessionId = generateSessionId();
            setCookie('goaldigger_session_id', sessionId);
        }
        if (config.debug) {
            console.log('Session ID:', sessionId);
        }
    }
    
    // Initialize widget
    function init() {
        addMessage("Hi! I'm your GoalDigger Coach. How can I help you with your savings goals today?", 'assistant');
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
            const container = document.getElementById('gd-messages');
            container.innerHTML = '';
            init(); // Add welcome message
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
        
        // Replace goal updates with placeholder tokens
        let processedText = originalText;
        const tokens = [];
        
        // Sort updates by index in reverse order to maintain positions
        updates.sort((a, b) => b.index - a.index);
        
        updates.forEach((update, i) => {
            const token = `__GOAL_UPDATE_${i}__`;
            tokens.unshift({
                token: token,
                html: `<div class="goal-update">📊 ${update.content}</div>`
            });
            processedText = processedText.substring(0, update.index) + token + processedText.substring(update.index + update.fullMatch.length);
        });
        
        // Process markdown
        let html = typeof marked !== 'undefined' ? marked.parse(processedText) : processedText;
        
        // Replace tokens with goal update HTML
        tokens.forEach(({ token, html: goalHtml }) => {
            html = html.replace(token, goalHtml);
        });
        
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