export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  response?: Response;
  error?: any;
}
type GlobalMessage = {
  message: string;
  title?: string;
};

type ParseSuccessResponse = (response: any) => GlobalMessage;
type ParseErrorResponse = (error: any) => GlobalMessage;

interface ApiClientConfig {
  baseUrl?: string | null; // Optional base URL
  toast?: any;
  returnParsedError?: boolean;
  globalHeaders?: Record<string, string>;
  showGlobalErrorToast?: boolean;
  showGlobalSuccessToast?: boolean; // New global success toast setting
  parseErrorResponse?: ParseSuccessResponse; // Custom error parsing function
  parseSuccessResponse?: ParseErrorResponse; // Custom success parsing function
  credentials?: RequestCredentials; // Global credentials setting (e.g., 'include', 'same-origin')
}

class ApiClient {
  private baseUrl: string | null = null;
  private authToken: string | null = null;
  private globalHeaders: Record<string, string> = {};
  private showGlobalErrorToast: boolean = true;
  private showGlobalSuccessToast: boolean = false; // Default to false
  private toast: any;
  private isNodeEnvironment: boolean;
  private parseErrorResponse: ParseSuccessResponse;
  private parseSuccessResponse: ParseErrorResponse;
  private credentials: RequestCredentials;
  private returnParsedError: boolean;

  constructor({
    baseUrl = null,
    toast = null,
    globalHeaders = {},
    showGlobalErrorToast = typeof window !== "undefined",
    showGlobalSuccessToast = false,
    parseErrorResponse = (error) => {
      if (typeof error === "string") return { message: error };
      if (error.message) return { message: error.message };
      if (error.error?.message) return { message: error.error.message };
      return { message: "An unexpected error occurred" };
    },
    parseSuccessResponse = (response) => {
      if (typeof response === "string") return { message: response };
      if (response.message) return { message: response.message };
      return { message: "Request succeeded" };
    },
    credentials = "same-origin", // Default credentials setting
    returnParsedError = false,
  }: ApiClientConfig = {}) {
    this.baseUrl = baseUrl;
    this.toast = toast;
    this.returnParsedError = returnParsedError;
    this.globalHeaders = globalHeaders;
    this.showGlobalErrorToast = showGlobalErrorToast;
    this.showGlobalSuccessToast = showGlobalSuccessToast;
    this.isNodeEnvironment = typeof window === "undefined";
    this.parseErrorResponse = parseErrorResponse;
    this.parseSuccessResponse = parseSuccessResponse;
    this.credentials = credentials;
    console.log("using hmm-api by tanmay7_");
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  setGlobalHeaders(headers: Record<string, string>): void {
    this.globalHeaders = { ...this.globalHeaders, ...headers };
  }

  setShowGlobalErrorToast(show: boolean): void {
    this.showGlobalErrorToast = show;
  }

  setShowGlobalSuccessToast(show: boolean): void {
    this.showGlobalSuccessToast = show;
  }

  private async handleResponse<T>(
    response: Response,
    showErrorToast: boolean,
    showSuccessToast: boolean
  ): Promise<ApiResponse<T>> {
    const isJsonResponse = response.headers
      .get("content-type")
      ?.includes("application/json");

    if (!response.ok) {
      const error = isJsonResponse
        ? await response.json()
        : await response.text();
      const errorMessage = this.parseErrorResponse(error);

      if (showErrorToast) {
        if (this.toast?.error) {
          this.toast.error(
            errorMessage?.message || "An unexpected error occurred"
          );
        } else {
          this.toast?.({
            variant: "destructive",
            title: errorMessage?.title || "Error",
            description:
              errorMessage?.message || "An unexpected error occurred",
          });
        }
      }

      return {
        success: false,
        response,
        status: response.status,
        error: this.returnParsedError
          ? errorMessage?.message || "An unexpected error occurred"
          : error,
      };
    }

    const data = isJsonResponse ? await response.json() : await response.text();

    if (showSuccessToast) {
      const successMessage = this.parseSuccessResponse(data);
      if (this.toast?.success) {
        this.toast.success(successMessage?.message || "Request succeeded");
      } else {
        this.toast?.({
          variant: "default",
          title: successMessage?.title || "Success",
          description: successMessage?.message || "Request succeeded",
        });
      }
    }

    return {
      success: true,
      status: response.status,
      response,
      data,
    };
  }

  private handleError(error: any, showErrorToast: boolean): ApiResponse<never> {
    const errorMessage = this.parseErrorResponse(error);
    if (error.name !== "AbortError" && showErrorToast) {
      if (this.toast?.error) {
        this.toast.error(
          errorMessage?.message || "An unexpected error occurred"
        );
      } else {
        this.toast?.({
          variant: "destructive",
          title: errorMessage?.title || "Error",
          description: errorMessage?.message || "An unexpected error occurred",
        });
      }
    }

    return {
      success: false,
      status: 0, // Indicate that this is a client-side error without a response status
      error: this.returnParsedError
        ? errorMessage?.message || "An unexpected error occurred"
        : error,
    };
  }

  async request<T>(
    url: string,
    method: string,
    options: RequestInit & {
      showErrorToast?: boolean;
      showSuccessToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void; // Callback to run after success or failure
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      showErrorToast = this.showGlobalErrorToast,
      showSuccessToast = this.showGlobalSuccessToast,
      finally: finallyCallback,
      ...fetchOptions
    } = options;

    if (!this.toast && (showErrorToast || showSuccessToast)) {
      console.error("Toast not configured");
      return {
        success: false,
        status: 0,
        error: "Toast not configured",
      };
    }

    if ((showErrorToast || showSuccessToast) && this.isNodeEnvironment) {
      console.warn(
        "Toasts are not usable in Node.js environment, turn it false"
      );
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
        headers.set("Authorization", `${this.authToken}`);
      }

      const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;

      const response = await fetch(fullUrl, {
        method,
        credentials: this.credentials, // Include credentials setting in the request
        ...fetchOptions,
        headers,
      });

      const result = await this.handleResponse<T>(
        response,
        showErrorToast,
        showSuccessToast
      );
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
      showSuccessToast?: boolean;
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
      showSuccessToast?: boolean;
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
      showSuccessToast?: boolean;
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
      showSuccessToast?: boolean;
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
      showSuccessToast?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
    } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, "DELETE", options);
  }
}

export default ApiClient;
