# Hmm-api v2.0.0

Tired of juggling error handling and toast notifications for every API call? The new version 2.0.0 brings powerful callback systems, enhanced error handling, and improved developer experience!

## Documentation

For detailed guidance on setting up, using, and contributing to **Hmm-api** , please refer to the official documentation:[ Docs](https://hmm-api.vercel.app/docs/getting-started/introduction)
The documentation includes:

- **Installation** : Step-by-step instructions to get the API up and running quickly.

- **Usage** : In-depth examples and clear instructions for utilizing the API effectively.

- **Contributing** : Guidelines on how you can contribute to improving and expanding the project.

- **API Endpoints** : Complete reference for all available API endpoints, including detailed parameter descriptions.

## What's New in v2.0.0

- **🎯 Callback System**: Global and per-request success/error callbacks
- **✨ Success Toasts**: Optional global success notifications
- **🔧 Enhanced Error Handling**: Parsed error responses and better error messages
- **🔐 Credentials Support**: Global credentials configuration
- **🧹 Finally Callbacks**: Cleanup functions that run after every request
- **⚡ Per-Request Overrides**: Override global settings for individual requests
- **🔄 Advanced Polling**: Multiple independent polling operations with proper cleanup and custom ID management
- **📊 Progress Tracking**: Enhanced upload/download progress with automatic cleanup and error handling
- **⏱️ Timeout Management**: Improved timeout handling with automatic signal combination and safety limits
- **🛡️ Memory Management**: Built-in `destroy()` method and automatic cleanup to prevent memory leaks
- **🎛️ Polling Control**: `stopAllPolling()`, `stopPolling(id)`, `getActivePollingCount()`, and `getActivePollingIds()` for precise resource management
- **🏷️ Custom Poll IDs**: Assign custom IDs to polling operations for better organization and individual control
- **✅ Input Validation**: Comprehensive validation prevents invalid configurations and operations
- **🔒 Safe Execution**: Callback errors won't break the client, with automatic error recovery
- **🌐 Enhanced Compatibility**: Improved browser compatibility with fallbacks for older environments

## Installation

```bash
npm install hmm-api@latest
```

```bash
yarn add hmm-api@latest
```

## License

This project is licensed under the [MIT License](https://chatgpt.com/c/LICENSE) , permitting free use, modification, and distribution of the software under the terms defined in the license.

## Support

If you have any issues, questions, or suggestions, please refer to the [documentation](https://hmm-api.vercel.app/docs/getting-started/introduction) . You can also open an issue in the repository to seek assistance or contribute feedback.
