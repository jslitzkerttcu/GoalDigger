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
    let chartCounter = 0;
    let chartConfigs = new Map(); // Store chart configs for modal display
    
    const API_ENDPOINT = 'https://your-backend.herokuapp.com/api/chat';
    
    // Initialize widget
    function init() {
        addMessage("Hi! I'm your GoalDigger Coach. Set a goal and mine your data to see how I can help you save faster!", 'assistant');
        updateVaultDisplay();
        
        // Setup modal backdrop click handler
        const modal = document.getElementById('chart-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    publicAPI.closeChartModal();
                }
            });
        }
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
            
            // API call
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
        },
        
        openChartModal: function(chartId) {
            const config = chartConfigs.get(chartId);
            if (!config) return;
            
            const modal = document.getElementById('chart-modal');
            const canvas = document.getElementById('modal-chart-canvas');
            
            // Destroy existing chart if any
            if (window.modalChart) {
                window.modalChart.destroy();
            }
            
            // Create new chart with responsive sizing
            const ctx = canvas.getContext('2d');
            window.modalChart = new Chart(ctx, {
                ...config,
                options: {
                    ...config.options,
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            modal.style.display = 'block';
        },
        
        closeChartModal: function() {
            const modal = document.getElementById('chart-modal');
            modal.style.display = 'none';
            
            if (window.modalChart) {
                window.modalChart.destroy();
                window.modalChart = null;
            }
        }
    };
    
    // Helper functions
    function addMessage(text, sender) {
        const container = document.getElementById('gd-messages');
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        
        // Check for chart configuration in assistant messages
        if (sender === 'assistant' && text.includes('||') && text.includes('||')) {
            const parts = parseMessageWithCharts(text);
            msg.innerHTML = parts.html;
            container.appendChild(msg);
            
            // Render any charts found
            parts.charts.forEach(chart => {
                renderChart(chart.id, chart.config);
            });
        } else {
            msg.textContent = text;
            container.appendChild(msg);
        }
        
        container.scrollTop = container.scrollHeight;
    }
    
    function parseMessageWithCharts(text) {
        const charts = [];
        let html = text;
        const chartRegex = /\|\|(.*?)\|\|/gs;
        let match;
        
        while ((match = chartRegex.exec(text)) !== null) {
            try {
                const chartConfig = JSON.parse(match[1].trim());
                const chartId = `chart-${++chartCounter}`;
                
                // Store config for modal
                chartConfigs.set(chartId, chartConfig);
                charts.push({ id: chartId, config: chartConfig });
                
                // Replace JSON with chart container
                const chartHtml = `<div class="chart-container">
                    <canvas id="${chartId}" width="300" height="200" onclick="GoalDigger.openChartModal('${chartId}')" style="cursor: pointer;"></canvas>
                    <div class="chart-expand-hint">Click to expand</div>
                </div>`;
                
                html = html.replace(match[0], chartHtml);
            } catch (e) {
                console.warn('Failed to parse chart config:', e);
                // Leave the original text if JSON parsing fails
            }
        }
        
        return { html, charts };
    }
    
    function renderChart(chartId, config) {
        // Wait for DOM to be ready
        setTimeout(() => {
            const canvas = document.getElementById(chartId);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            new Chart(ctx, {
                ...config,
                options: {
                    ...config.options,
                    responsive: false,
                    maintainAspectRatio: true,
                    plugins: {
                        ...config.options?.plugins,
                        legend: {
                            ...config.options?.plugins?.legend,
                            display: config.options?.plugins?.legend?.display !== false
                        }
                    }
                }
            });
        }, 100);
    }
    
    function updateVaultDisplay() {
        const vaultContent = document.getElementById('vault-content');
        vaultContent.textContent = JSON.stringify(contextVault, null, 2);
    }
    
    
    // Initialize on load
    init();
    
    return publicAPI;
})();