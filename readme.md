# hmm-api

`hmm-api` is a TypeScript-based class that simplifies making API requests with built-in error handling and optional toast notifications for error feedback. It supports all HTTP methods (GET, POST, PUT, PATCH, DELETE) and is highly configurable.

## Features

- Make HTTP requests (GET, POST, PUT, PATCH, DELETE)
- Handle API responses with built-in error handling
- Display error messages via toast notifications (optional)
- Configurable global headers and authentication tokens
- Custom error parsing logic

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

## License

This project is licensed under the MIT License.
