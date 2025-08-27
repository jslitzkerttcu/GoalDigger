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
        console.log('GoalDigger: Initializing widget');
        
        // Browser environment validation
        validateBrowserEnvironment();
        
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
        
        console.log('GoalDigger: Initialization complete');
    }
    
    function validateBrowserEnvironment() {
        console.log('GoalDigger: *** BROWSER ENVIRONMENT VALIDATION ***');
        
        // Check basic browser features
        console.log('GoalDigger: User Agent:', navigator.userAgent);
        console.log('GoalDigger: Document ready state:', document.readyState);
        console.log('GoalDigger: Window loaded:', document.readyState === 'complete');
        
        // Check Chart.js availability
        const chartJsLoaded = typeof Chart !== 'undefined';
        console.log('GoalDigger: Chart.js loaded:', chartJsLoaded);
        if (chartJsLoaded) {
            console.log('GoalDigger: Chart.js version:', Chart.version || 'unknown');
        } else {
            console.error('GoalDigger: ⚠️ Chart.js not available! Charts will not render.');
        }
        
        // Check DOM elements
        const messagesContainer = document.getElementById('gd-messages');
        const modal = document.getElementById('chart-modal');
        console.log('GoalDigger: Messages container found:', !!messagesContainer);
        console.log('GoalDigger: Chart modal found:', !!modal);
        
        // Test regex functionality
        const testText = '||{"test": "data"}||';
        const regexTest = /\|\|[\s\S]*?\|\|/g.test(testText);
        console.log('GoalDigger: Regex functionality working:', regexTest);
        
        // Test JSON parsing
        try {
            JSON.parse('{"test": "value"}');
            console.log('GoalDigger: JSON parsing working: ✓');
        } catch (e) {
            console.error('GoalDigger: JSON parsing broken:', e);
        }
        
        // Test string methods
        const stringTest = 'test||data||end';
        const includesTest = stringTest.includes('||');
        const matchTest = (stringTest.match(/\|\|/g) || []).length === 2;
        console.log('GoalDigger: String includes() working:', includesTest);
        console.log('GoalDigger: String match() working:', matchTest);
        
        console.log('GoalDigger: *** VALIDATION COMPLETE ***');
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
                console.log('GoalDigger: Making API call to:', API_ENDPOINT);
                console.log('GoalDigger: Request payload:', { context_vault: contextVault, message: message });
                
                const res = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        context_vault: contextVault,
                        message: message
                    })
                });
                
                console.log('GoalDigger: API response status:', res.status);
                console.log('GoalDigger: API response headers:', res.headers.get('content-type'));
                
                // Server uses res.end() which sends plain text, not JSON
                const assistantMessage = await res.text();
                console.log('GoalDigger: Received plain text response');
                console.log('GoalDigger: Response length:', assistantMessage ? assistantMessage.length : 0);
                console.log('GoalDigger: Message preview:', assistantMessage ? assistantMessage.substring(0, 200) + '...' : 'null');
                
                if (assistantMessage && assistantMessage.trim()) {
                    addMessage(assistantMessage.trim(), 'assistant');
                } else {
                    addMessage("I received an empty response from the server.", 'assistant');
                }
            } catch (err) {
                console.error('GoalDigger: API call failed:', err);
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
        },
        
        // Direct testing methods using correct server format
        testServerBarChart: function() {
            console.log('GoalDigger: Testing server-format bar chart');
            const serverMessage = `<special>Inquiry - Monthly Spending Breakdown for Car Savings Goal</special>
Here's a breakdown of your major spending categories from the past month to help you visualize where you can cut back:

- **Amazon Purchases**: $448.81 (Jul 2) + $362.54 (Jul 12) + $13.08 (Jul 15) = **$824.43**
- **Target Purchases**: $111.26 (Jul 23) + $310.80 (Jul 27) = **$422.06**
- **Dining (Olive Garden)**: $239.61 (Jul 25)
- **Subscriptions**: Netflix $23.85 (Aug 1), Gym $49.45 (Jun 30) = **$73.30**
- **Other (Starbucks, Uber Eats)**: $41.65 (Jul 10) + $6.77 (Jul 15) = **$48.42**
- **Utilities (Water Bill)**: $122.81 (Jun 29) + $14.41 (Jul 30) + $6.78 (Aug 3) = **$144.00**

**Total discretionary spending last month:**
Amazon + Target + Dining + Subscriptions + Other = **$1,607.82**

If you cut discretionary spending by 50%, you could save about **$800/month**—almost enough to meet your monthly car savings target.

<chartjs>
{
  "type": "bar",
  "data": {
    "labels": ["Amazon", "Target", "Dining", "Subscriptions", "Other", "Utilities"],
    "datasets": [{
      "label": "Monthly Spending ($)",
      "data": [824.43, 422.06, 239.61, 73.30, 48.42, 144.00],
      "backgroundColor": ["#0074D9", "#FF4136", "#2ECC40", "#FFDC00", "#B10DC9", "#AAAAAA"]
    }]
  },
  "options": {
    "title": {
      "display": true,
      "text": "Your Spending Breakdown (Past Month)"
    },
    "scales": {
      "yAxes": [{
        "ticks": {
          "beginAtZero": true
        }
      }]
    }
  }
}
</chartjs>

Would you like help setting up a monthly savings transfer or more ideas on cutting specific expenses?`;
            
            console.log('GoalDigger: Calling addMessage with server format');
            addMessage(serverMessage, 'assistant');
        },
        
        testServerLineChart: function() {
            console.log('GoalDigger: Testing server-format line chart');
            const serverMessage = `<special>Inquiry - Savings Progress Visualization</special>
Here's a chart showing your projected savings over 6 months if you save $833.33 per month, plus estimated interest from a High-Yield Savings Account at 4.5% APY.

This assumes you follow the suggested spending cuts and auto-transfer strategy:

<chartjs>
{
  "type": "line",
  "data": {
    "labels": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"],
    "datasets": [
      {
        "label": "Monthly Savings Balance",
        "data": [833, 1667, 2501, 3335, 4169, 5003],
        "borderColor": "#4CAF50",
        "backgroundColor": "rgba(76, 175, 80, 0.2)",
        "fill": true
      },
      {
        "label": "With Interest (4.5% APY)",
        "data": [834, 1671, 2510, 3352, 4197, 5045],
        "borderColor": "#2196F3",
        "backgroundColor": "rgba(33, 150, 243, 0.2)",
        "fill": false,
        "borderDash": [5, 5]
      }
    ]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "Projected 6-Month Car Savings Progress"
      },
      "legend": {
        "display": true
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "title": {
          "display": true,
          "text": "Savings Balance ($)"
        }
      },
      "x": {
        "title": {
          "display": true,
          "text": "Month"
        }
      }
    }
  }
}
</chartjs>

You'll reach your **$5,000 goal** in 6 months with disciplined monthly saving and some interest boost if you use a High-Yield Savings Account. 

If you want to see how different spending cuts or account types affect your progress, let me know!`;
            
            console.log('GoalDigger: Calling addMessage with server format');
            addMessage(serverMessage, 'assistant');
        }
    };
    
    // Helper functions
    function addMessage(text, sender) {
        console.log('=== GoalDigger: addMessage() called ===');
        console.log('GoalDigger: Sender:', sender);
        console.log('GoalDigger: Text length:', text ? text.length : 0);
        console.log('GoalDigger: Text preview:', text ? text.substring(0, 150) + '...' : 'null');
        console.log('GoalDigger: Contains ||:', text ? text.includes('||') : false);
        console.log('GoalDigger: || count:', text ? (text.match(/\|\|/g) || []).length : 0);
        
        const container = document.getElementById('gd-messages');
        if (!container) {
            console.error('GoalDigger: Messages container not found!');
            return;
        }
        
        const msg = document.createElement('div');
        msg.className = `message ${sender}`;
        
        // Check for special segments in assistant messages
        const isAssistant = sender === 'assistant';
        const hasSpecialSegments = isAssistant && (
            text.includes('<chartjs>') || 
            text.includes('<special>') || 
            text.includes('**') || 
            text.includes('*')
        );
        
        console.log('GoalDigger: Special segments check - isAssistant:', isAssistant, 'hasSpecialSegments:', hasSpecialSegments);
        
        if (hasSpecialSegments) {
            console.log('GoalDigger: *** PROCESSING MESSAGE WITH SPECIAL SEGMENTS ***');
            const parts = parseMessageWithSpecialSegments(text);
            console.log('GoalDigger: Special segment processing complete');
            console.log('GoalDigger: Found', parts.charts.length, 'charts, special segments:', parts.hasSpecial);
            
            msg.innerHTML = parts.html;
            container.appendChild(msg);
            
            // Render any charts found
            parts.charts.forEach((chart, index) => {
                console.log(`GoalDigger: Rendering chart ${index + 1}/${parts.charts.length}:`, chart.id);
                renderChart(chart.id, chart.config);
            });
        } else {
            console.log('GoalDigger: Regular text message (no special segments)');
            msg.textContent = text;
            container.appendChild(msg);
        }
        
        container.scrollTop = container.scrollHeight;
        console.log('GoalDigger: Message added to DOM, scrolled to bottom');
    }
    
    function parseMessageWithSpecialSegments(text) {
        console.log('GoalDigger: *** STARTING SPECIAL SEGMENT PARSING ***');
        console.log('GoalDigger: Input text length:', text.length);
        
        const charts = [];
        let html = text;
        let hasSpecial = false;
        
        // 1. Process <special></special> tags first
        console.log('GoalDigger: Processing <special> tags');
        const specialRegex = /<special>(.*?)<\/special>/gs;
        html = html.replace(specialRegex, (match, content) => {
            hasSpecial = true;
            console.log('GoalDigger: Found special segment:', content.trim());
            return `<div class="special-segment">${content.trim()}</div>`;
        });
        
        // 2. Process <chartjs></chartjs> tags
        console.log('GoalDigger: Processing <chartjs> tags');
        const chartRegex = /<chartjs>(.*?)<\/chartjs>/gs;
        let match;
        let chartCount = 0;
        
        while ((match = chartRegex.exec(text)) !== null) {
            chartCount++;
            console.log(`GoalDigger: Found chart #${chartCount}`);
            
            try {
                const jsonContent = match[1].trim();
                console.log('GoalDigger: Chart JSON length:', jsonContent.length);
                console.log('GoalDigger: Chart JSON preview:', jsonContent.substring(0, 100) + '...');
                
                const chartConfig = JSON.parse(jsonContent);
                console.log('GoalDigger: ✓ Chart JSON parsed successfully, type:', chartConfig.type);
                
                // Convert Chart.js v2/v3 syntax to v4 if needed
                const v4Config = convertToChartV4(chartConfig);
                const chartId = `chart-${++chartCounter}`;
                
                // Store config for modal
                chartConfigs.set(chartId, v4Config);
                charts.push({ id: chartId, config: v4Config });
                
                // Create chart HTML
                const chartHtml = `<div class="chart-container">
                    <canvas id="${chartId}" width="300" height="200" onclick="GoalDigger.openChartModal('${chartId}')" style="cursor: pointer;"></canvas>
                    <div class="chart-expand-hint">Click to expand</div>
                </div>`;
                
                // Replace the chartjs tag with chart container
                html = html.replace(match[0], chartHtml);
                console.log('GoalDigger: Chart HTML replaced for:', chartId);
                
            } catch (e) {
                console.warn('GoalDigger: ✗ Failed to parse chart:', e.message);
                console.warn('GoalDigger: Raw chart content:', match[1].substring(0, 200) + '...');
                // Leave the original tag if parsing fails
            }
        }
        
        // 3. Process basic markdown
        console.log('GoalDigger: Processing basic markdown');
        html = processBasicMarkdown(html);
        
        console.log('GoalDigger: *** SPECIAL SEGMENT PARSING COMPLETE ***');
        console.log('GoalDigger: Charts found:', charts.length, 'Special segments:', hasSpecial);
        
        return { html, charts, hasSpecial };
    }
    
    function processBasicMarkdown(text) {
        console.log('GoalDigger: Converting basic markdown to HTML');
        
        let html = text;
        
        // Bold text: **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Italic text: *text* -> <em>text</em> (but avoid matching ** pairs)
        html = html.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
        
        // Line breaks: convert \n to <br> but preserve paragraph structure
        html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        
        // Wrap in paragraph if it doesn't start with a div or paragraph
        if (!html.trim().startsWith('<div') && !html.trim().startsWith('<p>')) {
            html = '<p>' + html + '</p>';
        }
        
        // Bullet points: - item -> <ul><li>item</li></ul>
        const bulletRegex = /^[\s]*-[\s]+(.*?)$/gm;
        if (bulletRegex.test(text)) {
            html = html.replace(bulletRegex, '<li>$1</li>');
            html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        }
        
        return html;
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