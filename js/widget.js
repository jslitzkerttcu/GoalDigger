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
    
    const API_ENDPOINT = 'http://localhost:3000/chat';
    
    // Initialize widget
    function init() {
        console.log('GoalDigger: Initializing widget');
        
        // Browser environment validation
        validateBrowserEnvironment();
        
        // Add initial message immediately without animations
        addMessage("Hi! I'm your GoalDigger Coach ⚡", 'assistant');
        addMessage("Set a goal and mine your data to see how I can help you save faster! 💎", 'assistant');
        
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
        
        // Check Chart.js availability and version
        const chartJsLoaded = typeof Chart !== 'undefined';
        console.log('GoalDigger: Chart.js loaded:', chartJsLoaded);
        
        if (chartJsLoaded) {
            const version = Chart.version || 'unknown';
            console.log('GoalDigger: Chart.js version:', version);
            
            // Determine Chart.js version
            let majorVersion = 'unknown';
            if (version !== 'unknown') {
                majorVersion = parseInt(version.split('.')[0]);
                console.log('GoalDigger: Chart.js major version:', majorVersion);
                
                if (majorVersion < 3) {
                    console.warn('GoalDigger: ⚠️ Chart.js v' + majorVersion + ' detected - some features may not work optimally');
                } else if (majorVersion >= 4) {
                    console.log('GoalDigger: ✓ Chart.js v' + majorVersion + ' - full compatibility');
                } else {
                    console.log('GoalDigger: ✓ Chart.js v' + majorVersion + ' - good compatibility');
                }
            }
            
            // Store version for later use
            window.GoalDiggerChartVersion = { full: version, major: majorVersion };
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
                
                // Encode data as query parameters for GET request
                const params = new URLSearchParams({
                    query: message,
                    sessionId: 'widget-session-' + Date.now()
                });
                
                const res = await fetch(`${API_ENDPOINT}?${params}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
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
            console.log('GoalDigger: openChartModal called with:', chartId);
            
            const config = chartConfigs.get(chartId);
            if (!config) {
                console.error('GoalDigger: Chart config not found for:', chartId);
                console.log('GoalDigger: Available chart configs:', Array.from(chartConfigs.keys()));
                return;
            }
            
            console.log('GoalDigger: Found chart config:', config);
            
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                console.error('GoalDigger: Chart.js not available for modal');
                alert('Chart.js library not loaded. Cannot expand chart.');
                return;
            }
            
            const modal = document.getElementById('chart-modal');
            const canvas = document.getElementById('modal-chart-canvas');
            
            if (!modal) {
                console.error('GoalDigger: Chart modal element not found');
                return;
            }
            
            if (!canvas) {
                console.error('GoalDigger: Modal canvas element not found');
                return;
            }
            
            console.log('GoalDigger: Modal elements found, creating chart...');
            
            // Destroy existing chart if any
            if (window.modalChart) {
                console.log('GoalDigger: Destroying existing modal chart');
                window.modalChart.destroy();
            }
            
            try {
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
                
                console.log('GoalDigger: Modal chart created successfully');
                modal.style.display = 'block';
                
            } catch (error) {
                console.error('GoalDigger: Error creating modal chart:', error);
                alert('Error expanding chart: ' + error.message);
            }
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
        },
        
        testProblematicChart: function() {
            console.log('GoalDigger: Testing user\'s problematic chart with detailed debugging');
            const problematicMessage = `<special>Inquiry - New Savings Chart</special>
Here's a fresh chart showing your monthly savings progress based on your actual recent transfers to savings. In July, you moved $133.10 and $83.32, totaling $216.42. If you continue saving $216.42 each month, here's how your balance would grow over 24 months in a High-Yield Savings Account (4.5% APY):
<chartjs>
{
  "type": "line",
  "data": {
    "labels": [
      "Month 1","Month 2","Month 3","Month 4","Month 5","Month 6","Month 7","Month 8","Month 9","Month 10","Month 11","Month 12",
      "Month 13","Month 14","Month 15","Month 16","Month 17","Month 18","Month 19","Month 20","Month 21","Month 22","Month 23","Month 24"
    ],
    "datasets": [
      {
        "label": "Projected Savings (Actual Transfers)",
        "data": [
          216, 436, 661, 891, 1126, 1366, 1611, 1861, 2116, 2376, 2641, 2911,
          3186, 3466, 3751, 4041, 4336, 4636, 4941, 5251, 5566, 5886, 6211, 6541
        ],
        "borderColor": "#4BC0C0",
        "backgroundColor": "rgba(75,192,192,0.2)",
        "fill": true
      }
    ]
  },
  "options": {
    "title": {
      "display": true,
      "text": "Savings Growth (Current Monthly Transfers, 4.5% APY)"
    },
    "scales": {
      "yAxes": [{
        "ticks": {
          "beginAtZero": true
        },
        "scaleLabel": {
          "display": true,
          "labelString": "Balance"
        }
      }],
      "xAxes": [{
        "scaleLabel": {
          "display": true,
          "labelString": "Month"
        }
      }]
    }
  }
}
</chartjs>

**Key Takeaway:**
At your current savings rate, you'd reach about $6,541 in 2 years—less than half your $15,000 goal.

**Actionable Tip:**
To hit $15,000, consider increasing your monthly transfer, or cutting back on larger expenses like Target, Amazon, and dining out. Want a breakdown of where you can save more each month?`;
            
            console.log('GoalDigger: Calling addMessage with problematic chart format');
            addMessage(problematicMessage, 'assistant');
        },
        
        testCleanChart: function() {
            console.log('GoalDigger: Testing clean chart without issues');
            const cleanMessage = `<special>Test - Clean Chart</special>
Here's a clean chart configuration without any syntax issues:
<chartjs>
{
  "type": "line",
  "data": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "datasets": [
      {
        "label": "Clean Test Data",
        "data": [100, 200, 300, 400, 500, 600],
        "borderColor": "#4BC0C0",
        "backgroundColor": "rgba(75,192,192,0.2)",
        "fill": true
      }
    ]
  },
  "options": {
    "responsive": true,
    "plugins": {
      "title": {
        "display": true,
        "text": "Clean Test Chart"
      }
    },
    "scales": {
      "y": {
        "beginAtZero": true,
        "title": {
          "display": true,
          "text": "Value"
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

This should render perfectly with proper Chart.js v4 syntax.`;
            
            console.log('GoalDigger: Calling addMessage with clean chart format');
            addMessage(cleanMessage, 'assistant');
        },
        
        // Clear chat conversation
        clearChat: function() {
            console.log('GoalDigger: Clearing chat conversation');
            const messagesContainer = document.getElementById('gd-messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';
                console.log('GoalDigger: Chat messages cleared');
                
                // Add welcome message back
                setTimeout(() => {
                    addMessage("Hi! I'm your GoalDigger Coach ⚡", 'assistant', { typewriter: true });
                }, 300);
                
                setTimeout(() => {
                    addMessage("Set a goal and mine your data to see how I can help you save faster! 💎", 'assistant');
                }, 3000);
            } else {
                console.error('GoalDigger: Messages container not found');
            }
        }
    };
    
    // Helper functions
    function addMessage(text, sender, options = {}) {
        console.log('=== GoalDigger: addMessage() called ===');
        console.log('GoalDigger: Sender:', sender);
        console.log('GoalDigger: Text length:', text ? text.length : 0);
        
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
            parts.charts.forEach((chart) => {
                console.log(`GoalDigger: Rendering chart:`, chart.id);
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
    
    function addLoadingMessage() {
        const container = document.getElementById('gd-messages');
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'message assistant loading-message';
        loadingMsg.innerHTML = '<span class="loading-dots">GoalDigger Coach is thinking</span>';
        loadingMsg.id = 'loading-message';
        container.appendChild(loadingMsg);
        container.scrollTop = container.scrollHeight;
    }
    
    function removeLoadingMessage() {
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
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
            console.log('GoalDigger: Raw match length:', match[0].length);
            console.log('GoalDigger: Match start/end:', match.index, match.index + match[0].length);
            
            const result = parseAndValidateChart(match[1], chartCount);
            if (result.success) {
                const chartId = `chart-${++chartCounter}`;
                
                // Store config for modal
                chartConfigs.set(chartId, result.config);
                charts.push({ id: chartId, config: result.config });
                
                // Create chart HTML
                const chartHtml = `<div class="chart-container">
                    <canvas id="${chartId}" width="300" height="200" onclick="GoalDigger.openChartModal('${chartId}')" style="cursor: pointer;"></canvas>
                    <div class="chart-expand-hint">Click to expand</div>
                </div>`;
                
                // Replace the chartjs tag with chart container
                html = html.replace(match[0], chartHtml);
                console.log('GoalDigger: Chart HTML replaced for:', chartId);
                
            } else {
                console.error('GoalDigger: ✗ Chart parsing failed:', result.error);
                
                // Create error display instead of chart
                const errorHtml = `<div class="chart-error">
                    <div class="chart-error-title">⚠️ Chart Could Not Be Rendered</div>
                    <div class="chart-error-details">${result.error}</div>
                    <details class="chart-error-debug">
                        <summary>Debug Info</summary>
                        <pre>${result.debugInfo}</pre>
                    </details>
                </div>`;
                
                html = html.replace(match[0], errorHtml);
                console.log('GoalDigger: Chart error HTML inserted');
            }
        }
        
        function parseAndValidateChart(rawJson, chartNumber) {
            console.log(`GoalDigger: === PARSING CHART #${chartNumber} ===`);
            
            try {
                const jsonContent = rawJson.trim();
                console.log('GoalDigger: Raw JSON length:', jsonContent.length);
                console.log('GoalDigger: JSON starts with:', JSON.stringify(jsonContent.substring(0, 50)));
                console.log('GoalDigger: JSON ends with:', JSON.stringify(jsonContent.substring(jsonContent.length - 50)));
                
                // Pre-validate JSON structure
                if (!jsonContent.startsWith('{') || !jsonContent.endsWith('}')) {
                    return {
                        success: false,
                        error: 'Invalid JSON format - must start with { and end with }',
                        debugInfo: `Content: ${jsonContent.substring(0, 200)}...`
                    };
                }
                
                // Check for common JSON syntax issues
                const commonIssues = validateJsonSyntax(jsonContent);
                if (commonIssues.length > 0) {
                    return {
                        success: false,
                        error: `JSON syntax issues: ${commonIssues.join(', ')}`,
                        debugInfo: jsonContent.substring(0, 500)
                    };
                }
                
                // Attempt to parse JSON
                let chartConfig;
                try {
                    chartConfig = JSON.parse(jsonContent);
                } catch (parseError) {
                    return {
                        success: false,
                        error: `JSON parsing failed: ${parseError.message}`,
                        debugInfo: `${parseError.message}\nContent: ${jsonContent.substring(0, 300)}...`
                    };
                }
                
                // Validate Chart.js structure
                if (!chartConfig.type) {
                    return {
                        success: false,
                        error: 'Missing required "type" property in chart config',
                        debugInfo: JSON.stringify(chartConfig, null, 2)
                    };
                }
                
                if (!chartConfig.data) {
                    return {
                        success: false,
                        error: 'Missing required "data" property in chart config',
                        debugInfo: JSON.stringify(chartConfig, null, 2)
                    };
                }
                
                console.log('GoalDigger: ✓ Basic validation passed, type:', chartConfig.type);
                
                // Convert Chart.js v2/v3 syntax to v4 if needed
                const v4Config = convertToChartV4(chartConfig);
                console.log('GoalDigger: ✓ Chart converted to v4 format');
                
                return {
                    success: true,
                    config: v4Config,
                    error: null,
                    debugInfo: null
                };
                
            } catch (e) {
                return {
                    success: false,
                    error: `Unexpected error: ${e.message}`,
                    debugInfo: `${e.stack}\nRaw content: ${rawJson.substring(0, 300)}...`
                };
            }
        }
        
        function validateJsonSyntax(jsonString) {
            const issues = [];
            
            // Check for unescaped quotes in strings
            if (jsonString.match(/[^\\]'[^']*[^\\]'/)) {
                issues.push('Single quotes detected (use double quotes)');
            }
            
            // Check for JavaScript function syntax
            if (jsonString.includes('function(')) {
                issues.push('JavaScript functions not allowed in JSON');
            }
            
            // Check for unmatched braces
            const openBraces = (jsonString.match(/\{/g) || []).length;
            const closeBraces = (jsonString.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                issues.push(`Unmatched braces (${openBraces} open, ${closeBraces} close)`);
            }
            
            // Check for trailing commas
            if (jsonString.match(/,[\s\n]*[}\]]/)) {
                issues.push('Trailing commas detected');
            }
            
            return issues;
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
        console.log('GoalDigger: Converting chart config for compatibility');
        
        // Get Chart.js version info
        const versionInfo = window.GoalDiggerChartVersion || { major: 'unknown' };
        const targetVersion = versionInfo.major;
        console.log('GoalDigger: Target Chart.js version:', targetVersion);
        
        const compatibleConfig = JSON.parse(JSON.stringify(config)); // Deep clone
        
        // Version-specific conversions
        if (targetVersion >= 4 || targetVersion === 'unknown') {
            // Convert to v4 format
            convertToV4Format(compatibleConfig);
        } else if (targetVersion === 3) {
            // Convert to v3 format
            convertToV3Format(compatibleConfig);
        } else if (targetVersion === 2) {
            // Convert to v2 format
            convertToV2Format(compatibleConfig);
        }
        
        // Universal cleanup
        cleanInvalidProperties(compatibleConfig);
        
        console.log('GoalDigger: Chart config converted for v' + targetVersion);
        return compatibleConfig;
    }
    
    function convertToV4Format(config) {
        console.log('GoalDigger: Converting to Chart.js v4 format');
        
        // Convert scales from v2/v3 to v4 format
        if (config.options && config.options.scales) {
            const scales = config.options.scales;
            
            // Convert xAxes array to x object
            if (scales.xAxes && Array.isArray(scales.xAxes) && scales.xAxes.length > 0) {
                console.log('GoalDigger: Converting xAxes to v4 format');
                const xAxis = scales.xAxes[0];
                
                // Convert scaleLabel to title
                if (xAxis.scaleLabel) {
                    xAxis.title = {
                        display: xAxis.scaleLabel.display || false,
                        text: xAxis.scaleLabel.labelString || ''
                    };
                    delete xAxis.scaleLabel;
                }
                
                config.options.scales.x = xAxis;
                delete config.options.scales.xAxes;
            }
            
            // Convert yAxes array to y object  
            if (scales.yAxes && Array.isArray(scales.yAxes) && scales.yAxes.length > 0) {
                console.log('GoalDigger: Converting yAxes to v4 format');
                const yAxis = scales.yAxes[0];
                
                // Convert scaleLabel to title
                if (yAxis.scaleLabel) {
                    yAxis.title = {
                        display: yAxis.scaleLabel.display || false,
                        text: yAxis.scaleLabel.labelString || ''
                    };
                    delete yAxis.scaleLabel;
                }
                
                config.options.scales.y = yAxis;
                delete config.options.scales.yAxes;
            }
        }
        
        // Convert title and legend to plugins
        if (config.options) {
            if (!config.options.plugins) config.options.plugins = {};
            
            // Move title to plugins
            if (config.options.title) {
                config.options.plugins.title = config.options.title;
                delete config.options.title;
            }
            
            // Move legend to plugins
            if (config.options.legend) {
                config.options.plugins.legend = config.options.legend;
                delete config.options.legend;
            }
        }
    }
    
    function convertToV3Format(config) {
        console.log('GoalDigger: Converting to Chart.js v3 format');
        
        // v3 is similar to v4 but some plugin structure differences
        convertToV4Format(config); // Start with v4 conversion
        
        // v3-specific adjustments would go here if needed
    }
    
    function convertToV2Format(config) {
        console.log('GoalDigger: Converting to Chart.js v2 format');
        
        // Convert v4/v3 format back to v2 if needed
        if (config.options && config.options.scales) {
            const scales = config.options.scales;
            
            // Convert x object back to xAxes array
            if (scales.x && !scales.xAxes) {
                config.options.scales.xAxes = [scales.x];
                delete config.options.scales.x;
            }
            
            // Convert y object back to yAxes array
            if (scales.y && !scales.yAxes) {
                config.options.scales.yAxes = [scales.y];
                delete config.options.scales.y;
            }
        }
        
        // Move plugins back to root level
        if (config.options && config.options.plugins) {
            if (config.options.plugins.title) {
                config.options.title = config.options.plugins.title;
            }
            if (config.options.plugins.legend) {
                config.options.legend = config.options.plugins.legend;
            }
            // Keep plugins for any v2-compatible plugins
        }
    }
    
    function cleanInvalidProperties(config) {
        console.log('GoalDigger: Cleaning invalid properties');
        
        // Remove any JavaScript functions or invalid callbacks
        function removeInvalidCallbacks(obj) {
            if (!obj || typeof obj !== 'object') return;
            
            Object.keys(obj).forEach(key => {
                if (typeof obj[key] === 'function') {
                    console.log('GoalDigger: Removing function property:', key);
                    delete obj[key];
                } else if (key === 'callback' && typeof obj[key] === 'string') {
                    console.log('GoalDigger: Removing invalid callback string');
                    delete obj[key];
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    removeInvalidCallbacks(obj[key]);
                }
            });
        }
        
        removeInvalidCallbacks(config);
        
        // Ensure basic required structure
        if (!config.options) config.options = {};
        if (!config.options.scales) config.options.scales = {};
        
        // Set safe defaults
        config.options.responsive = config.options.responsive !== false;
        config.options.maintainAspectRatio = config.options.maintainAspectRatio !== false;
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