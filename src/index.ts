export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  error?: string;
}

interface ApiClientConfig {
  baseUrl?: string | null; // Optional base URL
  toast?: any;
  globalHeaders?: Record<string, string>;
  showGlobalToast?: boolean;
  parseErrorResponse?: (error: any) => string; // Custom error parsing function
  credentials?: RequestCredentials; // Global credentials setting (e.g., 'include', 'same-origin')
}

class ApiClient {
  private baseUrl: string | null = null;
  private authToken: string | null = null;
  private globalHeaders: Record<string, string> = {};
  private showGlobalToast: boolean = true;
  private toast: any;
  private isNodeEnvironment: boolean;
  private parseErrorResponse: (error: any) => string;
  private credentials: RequestCredentials;

  constructor({
    baseUrl = null,
    toast = null,
    globalHeaders = {},
    showGlobalToast = true,
    parseErrorResponse = (error) => {
      if (typeof error === "string") return error;
      if (error.message) return error.message;
      if (error.error?.message) return error.error.message;
      return "An unexpected error occurred";
    },
    credentials = "same-origin", // Default credentials setting
  }: ApiClientConfig = {}) {
    this.baseUrl = baseUrl;
    this.toast = toast;
    this.globalHeaders = globalHeaders;
    this.showGlobalToast = showGlobalToast;
    this.isNodeEnvironment = typeof window === "undefined";
    this.parseErrorResponse = parseErrorResponse;
    this.credentials = credentials;
    console.log("hmm-api by babyo7_");
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  setGlobalHeaders(headers: Record<string, string>): void {
    this.globalHeaders = { ...this.globalHeaders, ...headers };
  }

  setShowGlobalToast(show: boolean): void {
    this.showGlobalToast = show;
  }

  private async handleResponse<T>(
    response: Response,
    showErrorToast: boolean
  ): Promise<ApiResponse<T>> {
    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");

    if (response.status === 404) {
      if (showErrorToast) {
        this.toast.error("Not Found");
      }
      return {
        success: false,
        status: response.status,
        error: "Page not found",
      };
    }

    if (!response.ok) {
      const error = isJsonResponse
        ? await response.json()
        : await response.text();
      const errorMessage = this.parseErrorResponse(error);

      if (showErrorToast) {
        this.toast.error(errorMessage);
      }

      return {
        success: false,
        status: response.status,
        error: errorMessage,
      };
    }

    const data = isJsonResponse ? await response.json() : await response.text();

    return {
      success: true,
      status: response.status,
      data,
    };
  }

  private handleError(error: any, showErrorToast: boolean): ApiResponse<never> {
    const errorMessage = this.parseErrorResponse(error);
    if (error.name !== "AbortError" && showErrorToast) {
      this.toast.error(errorMessage, {
        style: { background: "#e94625" },
      });
    }

    return {
      success: false,
      status: 0, // Indicate that this is a client-side error without a response status
      error: error.name === "AbortError" ? "" : errorMessage,
    };
  }

  async request<T>(
    url: string,
    method: string,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void; // Callback to run after success or failure
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      showErrorToast = this.showGlobalToast,
      finally: finallyCallback,
      ...fetchOptions
    } = options;

    if (!this.toast && showErrorToast) {
      return {
        success: false,
        status: 0,
        error: "Toast not configured",
      };
    }

    if (showErrorToast && this.isNodeEnvironment) {
      // Disable toasts in Node.js environment
      return {
        success: false,
        status: 0,
        error: "Toasts are disabled in Node.js environment",
      };
    }

    try {
      const headers = new Headers({
        ...this.globalHeaders,
        ...fetchOptions.headers,
      });

      if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
        fetchOptions.body = JSON.stringify(fetchOptions.body);
      }

      if (this.authToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${this.authToken}`);
      }

      const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;

      const response = await fetch(fullUrl, {
        method,
        ...fetchOptions,
        headers,
        credentials: this.credentials, // Include credentials setting in the request
      });

      const result = await this.handleResponse<T>(response, showErrorToast);
      finallyCallback?.(); // Execute finally callback
      return result;
    } catch (error: any) {
      const result = this.handleError(error, showErrorToast);
      finallyCallback?.(); // Execute finally callback
      return result;
    }
  }

  async get<T>(
    url: string,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "GET", options);
  }

  async post<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "POST", {
      ...options,
      body: data,
    });
  }

  async put<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "PUT", {
      ...options,
      body: data,
    });
  }

  async patch<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "PATCH", {
      ...options,
      body: data,
    });
  }

  async delete<T>(
    url: string,
    options: RequestInit & {
      showErrorToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "DELETE", options);
  }
}

export default ApiClient;
