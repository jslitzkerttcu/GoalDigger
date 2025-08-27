// GoalDigger Widget JavaScript
window.GoalDigger = (function() {
    // Widget state
    let contextVault = {
        goal: null,
        veins: [],
        simulator_state: {},
        plan: null,
        timestamp: new Date().toISOString()
    };
    
    let isMinimized = false;
    
    // Mock API endpoint (replace with your real backend)
    const API_ENDPOINT = 'https://your-backend.herokuapp.com/api/chat';
    // For demo, we'll use mock responses
    const USE_MOCK = true;
    
    // Initialize widget
    function init() {
        addMessage("Hi! I'm your GoalDigger Coach. Set a goal and mine your data to see how I can help you save faster!", 'assistant');
        updateVaultDisplay();
    }
    
    // Public methods
    const publicAPI = {
        // Set a savings goal
        setGoal: function(name, amount, date) {
            contextVault.goal = {
                name: name,
                target_amount: amount,
                target_date: date,
                current_saved: 500,
                days_remaining: Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
            };
            
            addMessage(`Goal set: ${name} - $${amount} by ${date}`, 'system');
            updateVaultDisplay();
            
            // Auto-response
            addMessage(`Great! Your ${name} goal of $${amount} is set. Click "Mine Transaction Data" to find savings opportunities!`, 'assistant');
        },
        
        // Update savings veins
        updateVeins: function() {
            contextVault.veins = [
                { category: 'Dining', monthly_amount: 420, suggested_cut: 20, impact: 84 },
                { category: 'Subscriptions', items: ['Hulu Live: $69', 'Gym: $45', 'Spotify: $15'], total: 129 },
                { category: 'Rideshare', monthly_amount: 180, suggested_cut: 30, impact: 54 },
                { category: 'Shopping', monthly_amount: 340, suggested_cut: 15, impact: 51 },
                { category: 'Entertainment', monthly_amount: 150, suggested_cut: 25, impact: 38 }
            ];
            
            addMessage('💎 Found 5 savings veins! Top opportunity: Cut dining by 20% to save $84/month', 'system');
            updateVaultDisplay();
        },
        
        // Simulate a change
        simulateChange: function(category, percentage) {
            if (!contextVault.simulator_state.changes) {
                contextVault.simulator_state.changes = [];
            }
            
            contextVault.simulator_state.changes.push({
                type: 'percentage_cut',
                category: category,
                percentage: percentage,
                monthly_impact: percentage * 4.2 // Mock calculation
            });
            
            const newDays = Math.max(60, contextVault.goal.days_remaining - 29);
            contextVault.simulator_state.new_timeline_days = newDays;
            
            addMessage(`✅ Cutting ${category} by ${percentage}% → Reach goal ${29} days sooner!`, 'system');
            updateVaultDisplay();
        },
        
        // Toggle subscription
        toggleSubscription: function(service) {
            if (!contextVault.simulator_state.cancelled_subs) {
                contextVault.simulator_state.cancelled_subs = [];
            }
            
            contextVault.simulator_state.cancelled_subs.push(service);
            contextVault.simulator_state.monthly_save_increase = 69;
            
            addMessage(`🚫 Cancelled ${service} → Additional $69/month toward goal!`, 'system');
            updateVaultDisplay();
        },
        
        // Send chat message
        sendMessage: async function() {
            const input = document.getElementById('gd-input');
            const message = input.value.trim();
            if (!message) return;
            
            addMessage(message, 'user');
            input.value = '';
            
            // Check for out-of-scope
            if (message.toLowerCase().includes('weather') || 
                message.toLowerCase().includes('recipe') ||
                message.toLowerCase().includes('news')) {
                addMessage("I can only discuss your current savings plan and goal progress.", 'assistant');
                return;
            }
            
            // Mock responses based on context
            if (USE_MOCK) {
                const response = getMockResponse(message);
                setTimeout(() => addMessage(response, 'assistant'), 500);
            } else {
                // Real API call
                try {
                    const res = await fetch(API_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            context_vault: contextVault,
                            message: message
                        })
                    });
                    const data = await res.json();
                    addMessage(data.response, 'assistant');
                } catch (err) {
                    addMessage("I can only discuss your current savings plan and goal progress.", 'assistant');
                }
            }
        },
        
        // UI Controls
        toggle: function() {
            const widget = document.getElementById('goaldigger-widget');
            isMinimized = !isMinimized;
            widget.classList.toggle('minimized');
        },
        
        showContextVault: function() {
            document.getElementById('gd-vault').style.display = 'block';
        },
        
        hideVault: function() {
            document.getElementById('gd-vault').style.display = 'none';
        }
    };
    
    // Helper functions
    function addMessage(text, sender) {
        const container = document.getElementById('gd-messages');
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        msg.textContent = text;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    }
    
    function updateVaultDisplay() {
        const vaultContent = document.getElementById('vault-content');
        vaultContent.textContent = JSON.stringify(contextVault, null, 2);
    }
    
    function getMockResponse(message) {
        const lower = message.toLowerCase();
        
        if (lower.includes('how much') && lower.includes('save')) {
            return `Based on your current plan, you'll save $${contextVault.simulator_state.monthly_save_increase || 0}/month extra. With these changes, you'll reach your ${contextVault.goal?.name || 'goal'} 29 days sooner!`;
        }
        
        if (lower.includes('dining')) {
            return `Your dining spending is $420/month. Cutting it by 20% would save you $84 monthly, significantly accelerating your Italy Trip timeline.`;
        }
        
        if (lower.includes('subscription')) {
            return `You have 3 subscriptions totaling $129/month. Cancelling Hulu Live alone saves $69 - that's a big vein to mine!`;
        }
        
        return `Looking at your plan, the biggest impact comes from dining cuts (20%) and cancelling Hulu Live. Together, these changes save $153/month toward your ${contextVault.goal?.name || 'goal'}.`;
    }
    
    // Initialize on load
    init();
    
    return publicAPI;
})();