# Introducing HMM-API: The Seamless Solution for API Calls in React, Next.js, and Node.js

![HMM-API Banner](https://us-east-1.tixte.net/uploads/tanmay111-files.tixte.co/hmm_api.png)

Tired of manually handling errors and showing toast notifications for every API call in your React, Next.js, or Node.js application? Simplify your API interaction with **HMM-API**, a powerful package that automates error handling, toast notifications, and much more!

With **HMM-API**, you can focus on building your application while it handles the repetitive tasks for you. Whether you're working on a frontend React app or a backend Node.js server, **HMM-API** provides a consistent, easy-to-use solution for API management.

##  What it does:

- **Automates error handling** — no more try-catch headaches.
Displays toast notifications for you (frontend).

- **Lets you customize error parsing for relevant messages** 
Works on both frontend (React/Next.js) and backend (Node.js) seamlessly.

- **Centralizes global settings** for consistency across your app.
Focus on building, not boilerplate! 🚀 Start using HMM-API and make API management effortless.



## Key Features:

- **Automatic Error Handling:** No more wrapping your API calls in `try-catch` blocks! **HMM-API** automatically catches and processes errors.
- **Integrated Toast Notifications (for frontend apps):** Say goodbye to manually triggering toast messages for every failure. **HMM-API** handles error notifications for you on the frontend.
- **Custom Error Parsing:** Customize how errors are parsed with your own function to display the most relevant information.
- **Global Configurations:** Set global headers, credentials, and even control whether to show global toast messages across all API calls.
- **Node.js Support:** **HMM-API** now fully supports backend integration with Node.js. Use the same package on both frontend and backend for seamless development.

## Why HMM-API?

- **Simplified API Integration:** No need to manually wrap each API call in error handling code.
- **Cross-Platform Compatibility:** Use **HMM-API** seamlessly in both React/Next.js frontend applications and Node.js backend environments.
- **Centralized Configuration:** Easily configure global settings, ensuring consistency across your entire application stack.
- **Enhanced Developer Experience:** By abstracting away common API tasks, developers can focus more on core functionality.

Start using **HMM-API** today and streamline your API management across both the frontend and backend. With automated error handling, intuitive configurations, and seamless integration in React, Next.js, and Node.js, you can build your app faster and with fewer headaches.

## Installation

If you're using npm:

```bash
npm install hmm-api
```

Or with yarn:

```bash
yarn add hmm-api
```

## Usage

### 1. Create an Instance of `ApiClient`

You can create an instance of `ApiClient` and configure it with options like toast notifications, global headers, and custom error handling.

```typescript
import ApiClient from 'hmm-api';

// Initialize ApiClient with optional configuration
const api = new ApiClient({
  toast: yourToastInstance,  // Pass your toast instance (if using one eg. sonner, react-toast etc...)
  showGlobalToast: true,     // Optionally show global error toasts (default true)
});
```

### 2. Making Requests

The `request` method can be used for all HTTP methods. Here's an example of how to use it:

```typescript
// Example POST request
const response = await api.request("https://example.com/api", "POST", {
  body: {
    key: "value",  // Your request payload (can be a JSON object)
  },
  headers: {
    "Content-Type": "application/json",  // Specify the content type
  },
  showErrorToast: true,  // Whether to show toast on error (optional)
  finally: () => {
    console.log("Request finished");
  }
});

// Check the response
if (response.success) {
  console.log("Request succeeded:", response.data);
} else {
  console.error("Request failed:", response.error);
}
```

### 3. HTTP Methods

You can use `request` for any HTTP method like `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`:

#### GET Request
```typescript
const response = await api.get("https://example.com/api");
```

#### POST Request
```typescript
const response = await api.post("https://example.com/api", {
  key: "value",
});
```

#### PUT Request
```typescript
const response = await api.put("https://example.com/api", {
  key: "new_value",
});
```

#### PATCH Request
```typescript
const response = await api.patch("https://example.com/api", {
  key: "updated_value",
});
```

#### DELETE Request
```typescript
const response = await api.delete("https://example.com/api");
```

### 4. Error Handling

If an error occurs, the `ApiClient` class will parse the error response and can optionally show a toast message. You can also provide a custom error parsing function during initialization.

```typescript
const api = new ApiClient({
  parseErrorResponse: (error) => {
    return `Custom error: ${error.message || "Unknown error"}`;
  },
});
```

### 5. Customization Options

You can configure the `ApiClient` with the following options:

- **toast**: The toast instance for error notifications (optional).
- **globalHeaders**: Global HTTP headers to include in every request (optional).
- **showGlobalToast**: Whether to show toast notifications for errors (default: `true`).
- **parseErrorResponse**: A custom error parsing function to customize error messages (optional).
- **setAuthToken**: A method to set the authorization token that will be included in the `Authorization` header of requests (optional).

```typescript
const api = new ApiClient({
  toast: yourToastInstance,
  globalHeaders: {
    "Authorization": "Bearer your-token",
  },
  showGlobalToast: true,
  parseErrorResponse: (error) => {
    if (error.error?.message) return error.error.message;
    return "Custom error message";
  },
});
```

## Example Error Handling

```typescript
const response = await api.post("https://example.com/api", { key: "value" }, {
  headers: {
    "Authorization": "Bearer your-token",
  },
});
if (response.success) {
  console.log("Data received:", response.data);
} else {
  console.error("Error:", response.error);
}
```


If the `toast` is not configured, the error response will contain `"Toast not configured"`.

### [see example](https://github.com/babyo77/hmm-api/blob/main/__tests__/web/lib/api.ts)

## License

This project is licensed under the MIT License.
