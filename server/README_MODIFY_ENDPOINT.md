# Code Modification Endpoint

## Overview
The `/generate/modify` endpoint allows you to modify existing React components using AI. This endpoint streams the modified code in real-time, similar to the existing `/generate` endpoint but specifically designed for code modification tasks.

## Endpoint
```
POST /generate/modify
```

## Request Structure
```json
{
  "existing_code": "string",     // The current React component code
  "modification_prompt": "string", // Description of what to change
  "model": "string"              // Optional: AI model to use
}
```

## Example Usage

### Request
```bash
curl -X POST http://localhost:10000/generate/modify \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "existing_code": "function TodoApp({ React, app, hostAPI }) { const [items, setItems] = React.useState([]); return React.createElement(\"div\", null, \"Todo List\"); }",
    "modification_prompt": "Add a button that clears all items and make the background blue",
    "model": "claude-3-5-haiku-20241022"
  }'
```

### Response
The endpoint returns a Server-Sent Events (SSE) stream with:
- Status updates during processing
- Real-time streaming of the modified code tokens
- Usage information (tokens consumed)
- Completion notification

### Stream Events
- `data:` - Status messages and completion notification
- `event: token` - Code tokens as they're generated
- `event: usage` - Token usage statistics

## Features

### Security
- API key validation before processing
- Server-side only Anthropic API calls
- Comprehensive error handling
- Request logging (without sensitive data)

### Modification Capabilities
- **UI Changes**: Modify visual elements, styling, layout
- **Functionality Additions**: Add new features, buttons, forms, interactions
- **State Management**: Add/modify state variables and logic
- **Data Operations**: Modify database operations and API calls
- **Event Handling**: Add/modify event handlers
- **Styling Updates**: Change colors, layouts, responsive behavior
- **Feature Removal**: Remove functionality while maintaining code integrity

### Quality Assurance
- Preserves existing functionality unless explicitly modified
- Maintains React best practices and patterns
- Ensures complete, executable code output
- Handles errors gracefully with proper fallbacks
- Uses the same streaming infrastructure as `/generate`

## Implementation Details

### System Prompt
The endpoint uses a specialized system prompt that:
- Instructs Claude to analyze existing code structure
- Preserves core functionality while applying modifications
- Maintains the same component signature and patterns
- Ensures output is complete and executable
- Follows React and TypeScript best practices

### Error Handling
- Validates API key before starting stream
- Handles network errors and API failures
- Provides detailed error messages via stream
- Graceful degradation on parsing failures
- Comprehensive logging for debugging

### Performance
- Streams responses in real-time for better UX
- Uses keep-alive connections for stability
- Optimized token processing with prefill support
- Efficient memory usage with streaming buffers
- Same performance characteristics as `/generate`

## Model Support
Supports all available Anthropic models:
- `claude-3-haiku-20240307` (default)
- `claude-3-5-haiku-20241022`
- `claude-3-5-sonnet-20241022`
- `claude-sonnet-4-20250514`
- `claude-3-opus-20240229`

## Environment Requirements
- `ANTHROPIC_API_KEY` environment variable must be set
- Server must have internet access to reach Anthropic API
- CORS configured to allow requests from frontend