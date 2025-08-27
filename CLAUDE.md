# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is a static HTML/CSS/JavaScript project with no build process or dependencies:

```bash
# Run local development server
python -m http.server 8000
# Then visit http://localhost:8000

# Or open directly in browser
open index.html
```

## Architecture Overview

This is a standalone savings coach widget demo that runs entirely in the browser. The project demonstrates a conversational AI widget that could be embedded in banking applications.

### Core Architecture

**Widget Pattern**: The main JavaScript uses an IIFE (Immediately Invoked Function Expression) pattern that exposes a global `window.GoalDigger` object with public methods.

**Context Vault System**: Central to the architecture is the `contextVault` object that maintains all application state:
- `goal`: User's savings goal with target amount, date, and progress
- `veins`: Array of identified savings opportunities (spending categories)
- `simulator_state`: Tracks user's "what-if" changes and their financial impact
- `plan`: Reserved for future savings plan storage
- `timestamp`: State creation timestamp

**Mock vs Real API**: The widget has dual modes controlled by `USE_MOCK` flag:
- Mock mode: Uses `getMockResponse()` for demonstration
- Real mode: Would POST to `API_ENDPOINT` with full context vault

### Key Components

**Demo Integration**: The `index.html` simulates a banking app with demo control buttons that directly call widget methods to show functionality.

**Message System**: Three message types in the chat:
- `user`: User input messages
- `assistant`: AI coach responses  
- `system`: Automated notifications about goal/simulation changes

**Scope Boundaries**: The widget intentionally refuses off-topic queries (weather, recipes, news) to demonstrate bounded AI behavior.

### State Management Flow

1. User sets goal → Updates `contextVault.goal` → Shows system message
2. "Mine data" → Populates `contextVault.veins` with mock spending data
3. Simulate changes → Updates `contextVault.simulator_state` → Recalculates timeline impact
4. Chat interactions → Use context vault to generate contextual responses

The Context Vault can be inspected via the "Inspect Context Vault" button, showing the JSON state that would be sent to a real AI backend.