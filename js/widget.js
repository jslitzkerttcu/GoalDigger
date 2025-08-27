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
        if (sender === 'assistant' && (text.match(/\|\|/g) || []).length >= 2) {
            console.log('GoalDigger: Chart delimiters detected in message');
            const parts = parseMessageWithCharts(text);
            console.log('GoalDigger: Parsed charts:', parts.charts.length);
            msg.innerHTML = parts.html;
            container.appendChild(msg);
            
            // Render any charts found
            parts.charts.forEach(chart => {
                console.log('GoalDigger: Rendering chart:', chart.id);
                renderChart(chart.id, chart.config);
            });
        } else {
            msg.textContent = text;
            container.appendChild(msg);
        }
        
        container.scrollTop = container.scrollHeight;
    }
    
    function parseMessageWithCharts(text) {
        console.log('GoalDigger: Parsing message for charts');
        const charts = [];
        let html = text;
        const chartRegex = /\|\|[\s\S]*?\|\|/g;
        let match;
        let matchCount = 0;
        
        while ((match = chartRegex.exec(text)) !== null) {
            matchCount++;
            console.log(`GoalDigger: Found chart match #${matchCount}`);
            try {
                // Extract JSON content between || ||
                const jsonContent = match[0].replace(/^\|\|[\s\n]*/, '').replace(/[\s\n]*\|\|$/, '').trim();
                console.log('GoalDigger: Extracted JSON length:', jsonContent.length);
                console.log('GoalDigger: JSON preview:', jsonContent.substring(0, 100) + '...');
                
                const chartConfig = JSON.parse(jsonContent);
                console.log('GoalDigger: JSON parsed successfully, type:', chartConfig.type);
                
                // Convert Chart.js v2/v3 syntax to v4 if needed
                const v4Config = convertToChartV4(chartConfig);
                
                const chartId = `chart-${++chartCounter}`;
                
                // Store config for modal
                chartConfigs.set(chartId, v4Config);
                charts.push({ id: chartId, config: v4Config });
                
                // Replace JSON with chart container
                const chartHtml = `<div class="chart-container">
                    <canvas id="${chartId}" width="300" height="200" onclick="GoalDigger.openChartModal('${chartId}')" style="cursor: pointer;"></canvas>
                    <div class="chart-expand-hint">Click to expand</div>
                </div>`;
                
                html = html.replace(match[0], chartHtml);
                console.log('GoalDigger: Chart HTML replaced for', chartId);
            } catch (e) {
                console.warn('GoalDigger: Failed to parse chart config:', e.message);
                console.warn('GoalDigger: Raw match was:', match[0]);
                // Leave the original text if JSON parsing fails
            }
        }
        
        console.log('GoalDigger: Total matches found:', matchCount, 'Valid charts:', charts.length);
        return { html, charts };
    }
    
    function convertToChartV4(config) {
        console.log('GoalDigger: Converting chart config to v4 format');
        const v4Config = JSON.parse(JSON.stringify(config)); // Deep clone
        
        // Convert scales from v2/v3 to v4 format
        if (v4Config.options && v4Config.options.scales) {
            const scales = v4Config.options.scales;
            
            // Convert xAxes array to x object
            if (scales.xAxes && Array.isArray(scales.xAxes) && scales.xAxes.length > 0) {
                console.log('GoalDigger: Converting xAxes to v4 format');
                v4Config.options.scales.x = scales.xAxes[0];
                delete v4Config.options.scales.xAxes;
            }
            
            // Convert yAxes array to y object  
            if (scales.yAxes && Array.isArray(scales.yAxes) && scales.yAxes.length > 0) {
                console.log('GoalDigger: Converting yAxes to v4 format');
                v4Config.options.scales.y = scales.yAxes[0];
                delete v4Config.options.scales.yAxes;
            }
        }
        
        // Convert title from v2/v3 to v4 format
        if (v4Config.options && v4Config.options.title && typeof v4Config.options.title === 'object') {
            console.log('GoalDigger: Converting title to v4 format');
            if (!v4Config.options.plugins) v4Config.options.plugins = {};
            v4Config.options.plugins.title = v4Config.options.title;
            delete v4Config.options.title;
        }
        
        // Convert legend from v2/v3 to v4 format  
        if (v4Config.options && v4Config.options.legend && typeof v4Config.options.legend === 'object') {
            console.log('GoalDigger: Converting legend to v4 format');
            if (!v4Config.options.plugins) v4Config.options.plugins = {};
            v4Config.options.plugins.legend = v4Config.options.legend;
            delete v4Config.options.legend;
        }
        
        console.log('GoalDigger: Chart config converted successfully');
        return v4Config;
    }
    
    function renderChart(chartId, config) {
        console.log('GoalDigger: Attempting to render chart:', chartId);
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('GoalDigger: Chart.js library not found');
            return;
        }
        
        // Wait for DOM to be ready
        setTimeout(() => {
            const canvas = document.getElementById(chartId);
            if (!canvas) {
                console.error('GoalDigger: Canvas element not found:', chartId);
                return;
            }
            
            console.log('GoalDigger: Canvas found, creating chart...');
            
            try {
                const ctx = canvas.getContext('2d');
                const chartInstance = new Chart(ctx, {
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
                console.log('GoalDigger: Chart created successfully:', chartId);
            } catch (error) {
                console.error('GoalDigger: Error creating chart:', error);
                console.error('GoalDigger: Chart config was:', config);
                // Show error message in chart container
                const container = canvas.parentNode;
                container.innerHTML = `<div style="padding: 20px; color: #666; text-align: center;">
                    <p>Error rendering chart</p>
                    <small>${error.message}</small>
                </div>`;
            }
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