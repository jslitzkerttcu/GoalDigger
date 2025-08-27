# GoalDigger Chat Widget Integration

This document explains how to integrate the standalone GoalDigger chat widget into your application.

## Quick Start

### 1. Embed the Widget

Load the widget in an iframe or embed directly:

```html
<iframe 
    src="https://jslitzkerttcu.github.io/GoalDigger/widget.html"
    width="400" 
    height="600" 
    frameborder="0">
</iframe>
```

### 2. Configure the Backend API

```javascript
// Configure the widget after it loads
GoalDigger.setConfig({
    apiEndpoint: 'https://your-api.com/chat',
    apiKey: 'your-api-key',
    userId: 'user123',
    debug: true
});
```

## API Integration

### Backend Endpoint Requirements

Your backend should accept POST requests with this structure:

```json
{
    "message": "User's chat message",
    "context": {
        "goal": {
            "name": "Italy Trip",
            "target_amount": 3000,
            "target_date": "2025-03-01",
            "current_saved": 500
        },
        "veins": [...],
        "simulator_state": {...},
        "timestamp": "2025-01-27T..."
    },
    "userId": "user123",
    "timestamp": "2025-01-27T..."
}
```

### Expected Response Format

```json
{
    "message": "AI response text",
    "contextUpdate": {
        "goal": {...},
        "veins": [...]
    }
}
```

## Widget Configuration

### Available Config Options

```javascript
GoalDigger.setConfig({
    apiEndpoint: 'https://your-api.com/chat',  // Required
    apiKey: 'bearer-token',                     // Optional
    userId: 'unique-user-id',                   // Recommended
    debug: false                                // Optional
});
```

### Context Management

Set initial user context:

```javascript
GoalDigger.setContext({
    goal: {
        name: "Emergency Fund",
        target_amount: 5000,
        target_date: "2025-12-31",
        current_saved: 1200
    },
    veins: [
        { category: 'Dining', monthly_amount: 420, suggested_cut: 20 }
    ]
});
```

## JavaScript API Reference

### Core Methods

- `GoalDigger.setConfig(config)` - Configure API settings
- `GoalDigger.getConfig()` - Get current configuration  
- `GoalDigger.setContext(context)` - Update context vault
- `GoalDigger.getContext()` - Get current context
- `GoalDigger.sendMessage()` - Send current input (called automatically)
- `GoalDigger.toggle()` - Minimize/maximize widget
- `GoalDigger.clearChat()` - Clear chat history
- `GoalDigger.addMessage(text, sender)` - Add system message

### Usage Example

```html
<script>
// Wait for widget to load
window.addEventListener('load', function() {
    // Configure
    GoalDigger.setConfig({
        apiEndpoint: 'https://api.example.com/goaldigger',
        userId: getCurrentUserId(),
        debug: true
    });
    
    // Set user's financial context
    GoalDigger.setContext({
        goal: getUserGoal(),
        veins: getUserSpendingData()
    });
    
    // Add welcome message
    GoalDigger.addMessage("Welcome back! Let's review your savings progress.", 'system');
});
</script>
```

## Styling & Customization

The widget fills its container completely. Control size via the iframe or container:

```css
.widget-container {
    width: 380px;
    height: 500px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

## Error Handling

The widget handles common errors gracefully:
- Network failures show user-friendly messages
- Missing configuration shows console warnings (debug mode)
- Invalid API responses fall back to error messages

Enable debug mode to see detailed logging:

```javascript
GoalDigger.setConfig({ debug: true });
```