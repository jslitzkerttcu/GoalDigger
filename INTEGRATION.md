# GoalDigger Chat Widget Integration

This document explains how to integrate the standalone GoalDigger chat widget with GET request API and markdown rendering.

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

### 2. Configure the Backend API (Optional)

```javascript
// Configure the widget after it loads (defaults to localhost:3000)
GoalDigger.setConfig({
    apiEndpoint: 'http://your-domain.com/chat',
    debug: true
});
```

## API Integration

### Backend Endpoint Requirements

Your backend should accept GET requests to:
```
http://localhost:3000/chat?sessionId={sessionId}&query={query}
```

**Parameters:**
- `sessionId`: Auto-generated persistent session identifier (stored in cookies)
- `query`: User's chat message (URL encoded)

**Example Request:**
```
GET http://localhost:3000/chat?sessionId=session_abc123_1706123456&query=How%20much%20should%20I%20save%20monthly?
```

### Expected Response Format

Return plain text or markdown content. The widget will automatically:
- Render markdown formatting (headers, lists, code, etc.)
- Highlight goal updates in `{...}` brackets

**Example Responses:**

**Plain Text:**
```
You should aim to save $500 monthly to reach your goal.
```

**Markdown with Goal Update:**
```markdown
## Savings Recommendation

Based on your current progress, I recommend:

- **Monthly savings**: $450
- **Timeline**: 8 months
- **Total goal**: $3,600

{Goal updated: Monthly target increased to $450}

This will help you reach your **Italy Trip** goal by March 2025!
```

## Widget Configuration

### Available Config Options

```javascript
GoalDigger.setConfig({
    apiEndpoint: 'http://localhost:3000/chat',  // Default endpoint
    debug: false                                 // Enable console logging
});
```

### Session Management

The widget automatically:
- Generates a unique `sessionId` on first visit
- Stores `sessionId` in cookies (30-day expiration)
- Sends `sessionId` with every request for conversation continuity

## JavaScript API Reference

### Core Methods

- `GoalDigger.setConfig(config)` - Configure API settings
- `GoalDigger.getConfig()` - Get current configuration  
- `GoalDigger.getSessionId()` - Get current session ID
- `GoalDigger.sendMessage()` - Send current input (called automatically)
- `GoalDigger.toggle()` - Minimize/maximize widget
- `GoalDigger.clearChat()` - Clear chat history
- `GoalDigger.addMessage(text, sender)` - Add system message

### Usage Example

```html
<script>
// Configure for production endpoint
window.addEventListener('load', function() {
    GoalDigger.setConfig({
        apiEndpoint: 'https://api.yourbank.com/goaldigger/chat',
        debug: false
    });
    
    // Add welcome message
    GoalDigger.addMessage("Welcome! I'm connected to your savings data.", 'system');
});
</script>
```

## Features

### Markdown Rendering
- **Headers**: `# ## ### ####`
- **Lists**: `- item` or `1. item`
- **Emphasis**: `**bold**` and `*italic*`
- **Code**: `` `inline` `` and ``` blocks ```
- **Links**: `[text](url)`
- **Quotes**: `> blockquote`

### Goal Update Highlighting
Any text wrapped in `{...}` gets special styling:
- Green background with animation
- Prominent visual indicator
- Stands out from regular text

### Session Management
- Persistent conversations across page reloads
- Automatic session ID generation and storage
- Cookie-based session persistence

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
- Invalid responses fall back to error messages
- Debug mode provides detailed console logging

Enable debug mode to see detailed logging:

```javascript
GoalDigger.setConfig({ debug: true });
```