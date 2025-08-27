// GoalDigger Chat Widget - Backend Integration
window.GoalDigger = (function() {
    // Widget state - simplified for chat-only mode
    let contextVault = {
        goal: null,
        veins: [],
        simulator_state: {},
        plan: null,
        timestamp: new Date().toISOString()
    };
    
    let isMinimized = false;
    let isLoading = false;
    
    // Configuration - should be set by parent application
    let config = {
        apiEndpoint: 'https://your-backend-api.com/chat',
        apiKey: null, // Set this via GoalDigger.setConfig()
        userId: null, // Set this via GoalDigger.setConfig()
        debug: false
    };
    
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
        
        // Context management
        setContext: function(newContext) {
            contextVault = { ...contextVault, ...newContext };
            if (config.debug) {
                console.log('Context vault updated:', contextVault);
            }
        },
        
        getContext: function() {
            return { ...contextVault };
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
                addMessage(response.message, 'assistant');
                
                // Update context if backend provides updates
                if (response.contextUpdate) {
                    contextVault = { ...contextVault, ...response.contextUpdate };
                }
                
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
        
        const payload = {
            message: message,
            context: contextVault,
            userId: config.userId,
            timestamp: new Date().toISOString()
        };
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }
        
        if (config.debug) {
            console.log('Sending to backend:', payload);
        }
        
        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (config.debug) {
            console.log('Backend response:', data);
        }
        
        return data;
    }
    
    // UI Helper functions
    function addMessage(text, sender) {
        const container = document.getElementById('gd-messages');
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.textContent = text;
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
    init();
    
    return publicAPI;
})();