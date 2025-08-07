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

type OnSuccessCallback = (apiResponse: ApiResponse<any>) => void;
type OnErrorCallback = (apiResponse: ApiResponse<never>) => void;

interface ApiClientConfig {
  baseUrl?: string | null;
  returnParsedError?: boolean;
  globalHeaders?: Record<string, string>;
  showGlobalError?: boolean;
  showGlobalSuccess?: boolean;
  onSuccess?: OnSuccessCallback;
  onError?: OnErrorCallback;
  credentials?: RequestCredentials;
  timeout?: number;
}

interface ProgressCallback {
  (progress: { loaded: number; total: number; percentage: number }): void;
}

interface PollingConfig<T = any> {
  interval: number;
  maxAttempts?: number;
  pollId?: string;
  stopCondition?: (response: ApiResponse<T>) => boolean;
  onPollSuccess?: (response: ApiResponse<T>, attempt: number) => void;
  onPollError?: (response: ApiResponse<any>, attempt: number) => void;
}

interface PollingOperation {
  id: string;
  stop: () => void;
  promise: Promise<any>;
  cleanup: () => void;
}

interface PollingResult<T> {
  pollId: string;
  finalResponse: ApiResponse<T>;
  attempts: number;
  stopped: boolean;
  stop: () => void;
}

class ApiClient {
  private baseUrl: string | null = null;
  private authToken: string | null = null;
  private globalHeaders: Record<string, string> = {};
  private showGlobalError: boolean = true;
  private showGlobalSuccess: boolean = false;
  private onSuccess: OnSuccessCallback;
  private onError: OnErrorCallback;
  private credentials: RequestCredentials;
  private returnParsedError: boolean;
  private timeout: number;
  private activePollingOperations: Map<string, PollingOperation> = new Map();
  private isDestroyed: boolean = false;

  constructor({
    baseUrl = null,
    globalHeaders = {},
    showGlobalError = typeof window !== "undefined",
    showGlobalSuccess = false,
    onSuccess = (apiResponse) => {
      if (typeof console !== "undefined") {
        console.log("API call succeeded:", apiResponse);
      }
    },
    onError = (apiResponse) => {
      if (typeof console !== "undefined") {
        console.error("API call failed:", apiResponse);
      }
    },
    credentials = "same-origin",
    returnParsedError = false,
    timeout = 30000,
  }: ApiClientConfig = {}) {
    // Input validation
    if (timeout < 0) {
      throw new Error("Timeout must be a positive number");
    }

    if (baseUrl && typeof baseUrl !== "string") {
      throw new Error("BaseUrl must be a string or null");
    }

    this.baseUrl = baseUrl;
    this.returnParsedError = returnParsedError;
    this.globalHeaders = Object.freeze({ ...globalHeaders }); // Deep freeze to prevent mutation
    this.showGlobalError = showGlobalError;
    this.showGlobalSuccess = showGlobalSuccess;
    this.onSuccess = onSuccess;
    this.onError = onError;
    this.credentials = credentials;
    this.timeout = Math.min(timeout, 300000); // Cap at 5 minutes

    if (typeof console !== "undefined") {
      console.log("using hmm-api by tanmay7_");
    }
  }

  // Cleanup method to prevent memory leaks
  destroy(): void {
    if (this.isDestroyed) {
      return; // Already destroyed
    }

    this.isDestroyed = true;
    this.stopAllPolling();
    this.activePollingOperations.clear();

    // Clear references to prevent memory leaks
    this.globalHeaders = {};
    this.onSuccess = () => {};
    this.onError = () => {};
  }

  private checkDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error("ApiClient has been destroyed and cannot be used");
    }
  }

  private validatePollId(pollId: string): void {
    if (!pollId || typeof pollId !== "string") {
      throw new Error("Poll ID must be a non-empty string");
    }
  }

  setAuthToken(token: string | null): void {
    this.checkDestroyed();
    if (token !== null && typeof token !== "string") {
      throw new Error("Auth token must be a string or null");
    }
    this.authToken = token;
  }

  setGlobalHeaders(headers: Record<string, string>): void {
    this.checkDestroyed();
    if (!headers || typeof headers !== "object") {
      throw new Error("Headers must be an object");
    }

    // Validate header values
    for (const [key, value] of Object.entries(headers)) {
      if (typeof key !== "string" || typeof value !== "string") {
        throw new Error("Header keys and values must be strings");
      }
    }

    this.globalHeaders = Object.freeze({ ...this.globalHeaders, ...headers });
  }

  setShowGlobalError(show: boolean): void {
    this.checkDestroyed();
    if (typeof show !== "boolean") {
      throw new Error("showGlobalError must be a boolean");
    }
    this.showGlobalError = show;
  }

  setShowGlobalSuccess(show: boolean): void {
    this.checkDestroyed();
    if (typeof show !== "boolean") {
      throw new Error("showGlobalSuccess must be a boolean");
    }
    this.showGlobalSuccess = show;
  }

  setOnSuccess(callback: OnSuccessCallback): void {
    this.checkDestroyed();
    if (typeof callback !== "function") {
      throw new Error("onSuccess callback must be a function");
    }
    this.onSuccess = callback;
  }

  setOnError(callback: OnErrorCallback): void {
    this.checkDestroyed();
    if (typeof callback !== "function") {
      throw new Error("onError callback must be a function");
    }
    this.onError = callback;
  }

  // Enhanced polling management with proper cleanup
  stopAllPolling(): void {
    const operations = Array.from(this.activePollingOperations.values());
    this.activePollingOperations.clear();

    operations.forEach((operation) => {
      try {
        operation.cleanup();
        operation.stop();
      } catch (error) {
        if (typeof console !== "undefined") {
          console.warn("Error stopping polling operation:", error);
        }
      }
    });
  }

  stopPolling(pollId: string): boolean {
    this.checkDestroyed();

    if (!pollId || typeof pollId !== "string") {
      return false;
    }

    const operation = this.activePollingOperations.get(pollId);
    if (operation) {
      try {
        operation.cleanup();
        operation.stop();
        this.activePollingOperations.delete(pollId);
        return true;
      } catch (error) {
        if (typeof console !== "undefined") {
          console.warn(`Error stopping polling operation ${pollId}:`, error);
        }
        this.activePollingOperations.delete(pollId); // Remove even if cleanup failed
        return false;
      }
    }
    return false;
  }

  getActivePollingCount(): number {
    return this.activePollingOperations.size;
  }

  getActivePollingIds(): string[] {
    return Array.from(this.activePollingOperations.keys());
  }

  private generatePollingId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `poll_${timestamp}_${random}`;
  }

  public parseResponseMessage(error: any): GlobalMessage {
    if (!error) {
      return { message: "Unknown error occurred" };
    }

    if (typeof error === "string") {
      return { message: error };
    }

    if (error?.message && typeof error.message === "string") {
      return { message: error.message };
    }

    if (error?.error?.message && typeof error.error.message === "string") {
      return { message: error.error.message };
    }

    // Handle different error formats
    if (error?.detail && typeof error.detail === "string") {
      return { message: error.detail };
    }

    if (error?.msg && typeof error.msg === "string") {
      return { message: error.msg };
    }

    try {
      return { message: JSON.stringify(error) };
    } catch {
      return { message: "An unexpected error occurred" };
    }
  }

  private async handleResponse<T>(
    response: Response,
    showError: boolean,
    showSuccess: boolean
  ): Promise<ApiResponse<T>> {
    if (this.isDestroyed) {
      throw new Error("ApiClient has been destroyed");
    }

    let isJsonResponse = false;
    let data: any = null;
    let error: any = null;

    try {
      const contentType = response.headers.get("content-type");
      isJsonResponse = Boolean(contentType?.includes("application/json"));
    } catch (e) {
      isJsonResponse = false;
    }

    if (!response.ok) {
      try {
        error = isJsonResponse ? await response.json() : await response.text();
      } catch (parseError) {
        error = {
          message: "Failed to parse error response",
          originalError: parseError,
          status: response.status,
          statusText: response.statusText,
        };
      }

      const apiResponse: ApiResponse<never> = {
        success: false,
        response,
        status: response.status,
        error: this.returnParsedError
          ? this.parseResponseMessage(error).message
          : error,
      };

      if (showError && !this.isDestroyed) {
        this.safeCallCallback(() => this.onError?.(apiResponse));
      }

      return apiResponse;
    }

    try {
      data = isJsonResponse ? await response.json() : await response.text();
    } catch (parseError) {
      if (typeof console !== "undefined") {
        console.warn("Failed to parse successful response:", parseError);
      }
      data = null;
    }

    const apiResponse: ApiResponse<T> = {
      success: true,
      status: response.status,
      response,
      data,
    };

    if (showSuccess && !this.isDestroyed) {
      this.safeCallCallback(() => this.onSuccess?.(apiResponse));
    }

    return apiResponse;
  }

  private handleError(error: any, showError: boolean): ApiResponse<never> {
    const parsedError = this.parseResponseMessage(error);

    const apiResponse: ApiResponse<never> = {
      success: false,
      status: 0,
      error: this.returnParsedError ? parsedError.message : error,
    };

    if (error?.name !== "AbortError" && showError && !this.isDestroyed) {
      this.safeCallCallback(() => this.onError?.(apiResponse));
    }

    return apiResponse;
  }

  private safeCallCallback(callback: () => void): void {
    if (this.isDestroyed) return;

    try {
      callback();
    } catch (callbackError) {
      if (typeof console !== "undefined") {
        console.error("Error in callback:", callbackError);
      }
    }
  }

  private createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();

    if (timeoutMs <= 0) {
      return controller;
    }

    const timeoutId = setTimeout(() => {
      try {
        controller.abort(new Error(`Request timeout after ${timeoutMs}ms`));
      } catch (error) {
        // Ignore errors when aborting
      }
    }, timeoutMs);

    // Clean up timeout if controller is aborted by other means
    const cleanup = () => {
      clearTimeout(timeoutId);
    };

    try {
      controller.signal.addEventListener("abort", cleanup, { once: true });
    } catch (error) {
      // Fallback for older browsers
      clearTimeout(timeoutId);
    }

    return controller;
  }

  private combineAbortSignals(signals: AbortSignal[]): AbortSignal {
    if (signals.length === 0) {
      return new AbortController().signal;
    }

    if (signals.length === 1) {
      return signals[0];
    }

    // Use AbortSignal.any if available (modern browsers)
    if (typeof AbortSignal !== "undefined" && AbortSignal.any) {
      try {
        return AbortSignal.any(signals);
      } catch (error) {
        // Fallback if AbortSignal.any fails
      }
    }

    // Fallback for older browsers
    const controller = new AbortController();
    const cleanup = () => {
      try {
        controller.abort();
      } catch (error) {
        // Ignore errors when aborting
      }
    };

    signals.forEach((signal) => {
      if (signal.aborted) {
        cleanup();
        return;
      }

      try {
        signal.addEventListener("abort", cleanup, { once: true });
      } catch (error) {
        // Ignore if addEventListener fails
      }
    });

    return controller.signal;
  }

  private async requestWithProgress<T>(
    url: string,
    method: string,
    options: RequestInit & {
      onUploadProgress?: ProgressCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
    } = {}
  ): Promise<{ response: Response; uploadProgress?: any }> {
    const {
      onUploadProgress,
      onDownloadProgress,
      timeout = this.timeout,
      ...fetchOptions
    } = options;

    const timeoutController = this.createTimeoutController(timeout);

    const signals = [timeoutController.signal];
    if (fetchOptions.signal) {
      signals.push(fetchOptions.signal);
    }

    const combinedSignal = this.combineAbortSignals(signals);
    const fullUrl = this.baseUrl ? `${this.baseUrl}${url}` : url;

    // Validate URL
    try {
      new URL(fullUrl);
    } catch (urlError) {
      throw new Error(`Invalid URL: ${fullUrl}`);
    }

    // Upload progress simulation with proper cleanup
    let uploadProgressInterval: NodeJS.Timeout | null = null;
    const cleanupUploadProgress = () => {
      if (uploadProgressInterval) {
        clearInterval(uploadProgressInterval);
        uploadProgressInterval = null;
      }
    };

    if (onUploadProgress && fetchOptions.body) {
      let totalSize = 0;

      try {
        if (fetchOptions.body instanceof FormData) {
          totalSize = 1000000; // Estimate for FormData
        } else if (fetchOptions.body instanceof Blob) {
          totalSize = fetchOptions.body.size;
        } else if (typeof fetchOptions.body === "string") {
          totalSize = new Blob([fetchOptions.body]).size;
        } else {
          totalSize = new Blob([JSON.stringify(fetchOptions.body)]).size;
        }
      } catch (error) {
        totalSize = 1000; // Fallback size
      }

      let loaded = 0;
      uploadProgressInterval = setInterval(() => {
        if (combinedSignal.aborted || this.isDestroyed) {
          cleanupUploadProgress();
          return;
        }

        loaded = Math.min(loaded + totalSize * 0.1, totalSize);

        this.safeCallCallback(() => {
          onUploadProgress({
            loaded,
            total: totalSize,
            percentage: Math.round((loaded / totalSize) * 100),
          });
        });

        if (loaded >= totalSize) {
          cleanupUploadProgress();
        }
      }, 100);

      // Cleanup on abort
      try {
        combinedSignal.addEventListener("abort", cleanupUploadProgress, {
          once: true,
        });
      } catch (error) {
        // Fallback cleanup
        setTimeout(cleanupUploadProgress, timeout);
      }
    }

    try {
      const response = await fetch(fullUrl, {
        ...fetchOptions,
        signal: combinedSignal,
      });

      // Enhanced download progress with proper cleanup
      if (onDownloadProgress && response.body && response.ok) {
        const contentLengthHeader = response.headers.get("content-length");

        if (contentLengthHeader) {
          const total = parseInt(contentLengthHeader, 10);

          if (!isNaN(total) && total > 0) {
            let loaded = 0;

            const reader = response.body.getReader();
            const self = this; // Capture 'this' context

            const stream = new ReadableStream({
              start(controller) {
                function pump(): Promise<void> {
                  return reader
                    .read()
                    .then(({ done, value }) => {
                      if (done || combinedSignal.aborted || self.isDestroyed) {
                        try {
                          controller.close();
                        } catch (error) {
                          // Ignore errors when closing
                        }
                        return;
                      }

                      loaded += value.byteLength;

                      self.safeCallCallback(() => {
                        onDownloadProgress?.({
                          loaded,
                          total,
                          percentage: Math.round((loaded / total) * 100),
                        });
                      });

                      try {
                        controller.enqueue(value);
                      } catch (error) {
                        controller.error(error);
                        return;
                      }

                      return pump();
                    })
                    .catch((error) => {
                      try {
                        controller.error(error);
                      } catch (controllerError) {
                        // Ignore errors when setting controller error
                      }
                      throw error;
                    });
                }
                return pump();
              },
            });

            return {
              response: new Response(stream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
              }),
            };
          }
        }
      }

      return { response };
    } finally {
      cleanupUploadProgress();
    }
  }

  async request<T>(
    url: string,
    method: string,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      onUploadProgress?: ProgressCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    this.checkDestroyed();

    // Input validation
    if (!url || typeof url !== "string") {
      throw new Error("URL must be a non-empty string");
    }

    if (!method || typeof method !== "string") {
      throw new Error("Method must be a non-empty string");
    }

    const {
      showError = this.showGlobalError,
      showSuccess = this.showGlobalSuccess,
      finally: finallyCallback,
      onSuccess: requestOnSuccess,
      onError: requestOnError,
      onUploadProgress,
      onDownloadProgress,
      timeout,
      poll,
      ...fetchOptions
    } = options;

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      if (this.isDestroyed) {
        throw new Error("ApiClient has been destroyed");
      }

      const originalOnSuccess = this.onSuccess;
      const originalOnError = this.onError;

      if (requestOnSuccess) this.onSuccess = requestOnSuccess;
      if (requestOnError) this.onError = requestOnError;

      try {
        const headers = new Headers();

        // Add global headers
        Object.entries(this.globalHeaders).forEach(([key, value]) => {
          headers.set(key, value);
        });

        // Add request-specific headers
        if (fetchOptions.headers) {
          Object.entries(fetchOptions.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });
        }

        // Handle request body
        if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
          }

          if (typeof fetchOptions.body === "object") {
            try {
              fetchOptions.body = JSON.stringify(fetchOptions.body);
            } catch (stringifyError) {
              throw new Error("Failed to stringify request body");
            }
          }
        }

        // Add authorization header
        if (this.authToken && !headers.has("Authorization")) {
          headers.set("Authorization", `${this.authToken}`);
        }

        const { response } = await this.requestWithProgress(url, method, {
          method,
          credentials: this.credentials,
          ...fetchOptions,
          headers,
          onUploadProgress,
          onDownloadProgress,
          timeout,
        });

        const result = await this.handleResponse<T>(
          response,
          poll ? false : showError,
          poll ? false : showSuccess
        );

        if (!poll) {
          this.safeCallCallback(() => finallyCallback?.());
        }

        return result;
      } catch (error: any) {
        const result = this.handleError(error, poll ? false : showError);

        if (!poll) {
          this.safeCallCallback(() => finallyCallback?.());
        }

        return result;
      } finally {
        this.onSuccess = originalOnSuccess;
        this.onError = originalOnError;
      }
    };

    if (poll) {
      const pollResult = await this.executeWithPolling(makeRequest, poll);
      this.safeCallCallback(() => finallyCallback?.());
      return pollResult;
    }

    return makeRequest();
  }

  private async executeWithPolling<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    pollConfig: PollingConfig<T>
  ): Promise<PollingResult<T>> {
    // Validate polling configuration
    if (pollConfig.interval <= 0) {
      throw new Error("Polling interval must be greater than 0");
    }

    if (pollConfig.maxAttempts !== undefined && pollConfig.maxAttempts <= 0) {
      throw new Error("Max attempts must be greater than 0");
    }

    const pollingId = pollConfig.pollId || this.generatePollingId();

    // Validate custom poll ID
    if (pollConfig.pollId) {
      this.validatePollId(pollConfig.pollId);
    }

    // Check if custom pollId already exists
    if (this.activePollingOperations.has(pollingId)) {
      throw new Error(
        `Polling operation with ID '${pollingId}' already exists`
      );
    }

    const {
      interval,
      maxAttempts = Infinity,
      stopCondition,
      onPollSuccess,
      onPollError,
    } = pollConfig;

    let attempts = 0;
    let stopped = false;
    let finalResponse: ApiResponse<T>;
    let timeoutId: NodeJS.Timeout | null = null;

    const cleanup = () => {
      stopped = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      this.activePollingOperations.delete(pollingId);
    };

    const stop = () => {
      if (!stopped) {
        cleanup();
      }
    };

    const pollingPromise = new Promise<PollingResult<T>>((resolve, reject) => {
      const executeRequest = async () => {
        if (this.isDestroyed || stopped || attempts >= maxAttempts) {
          cleanup();
          resolve({
            pollId: pollingId,
            finalResponse: finalResponse || {
              success: false,
              status: 0,
              error: "Polling stopped before completion",
            },
            attempts,
            stopped: true,
            stop,
          });
          return;
        }

        attempts++;

        try {
          const response = await requestFn();
          finalResponse = response;

          if (response.success) {
            this.safeCallCallback(() => onPollSuccess?.(response, attempts));

            if (stopCondition?.(response)) {
              cleanup();
              resolve({
                pollId: pollingId,
                finalResponse: finalResponse,
                attempts,
                stopped: true,
                stop,
              });
              return;
            }
          } else {
            this.safeCallCallback(() => onPollError?.(response, attempts));
          }

          if (!this.isDestroyed && !stopped && attempts < maxAttempts) {
            timeoutId = setTimeout(() => {
              if (!this.isDestroyed && !stopped) {
                executeRequest().catch((error) => {
                  cleanup();
                  reject(error);
                });
              }
            }, interval);
          } else {
            cleanup();
            resolve({
              pollId: pollingId,
              finalResponse: finalResponse,
              attempts,
              stopped: attempts >= maxAttempts,
              stop,
            });
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      executeRequest().catch((error) => {
        cleanup();
        reject(error);
      });
    });

    // Register the polling operation for cleanup
    const pollingOperation: PollingOperation = {
      id: pollingId,
      stop,
      promise: pollingPromise,
      cleanup,
    };

    this.activePollingOperations.set(pollingId, pollingOperation);

    return pollingPromise;
  }

  async get<T>(
    url: string,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    return this.request<T>(url, "GET", options);
  }

  async post<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      onUploadProgress?: ProgressCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    return this.request<T>(url, "POST", {
      ...options,
      body: data,
    });
  }

  async put<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      onUploadProgress?: ProgressCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    return this.request<T>(url, "PUT", {
      ...options,
      body: data,
    });
  }

  async patch<T>(
    url: string,
    data: any,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      onUploadProgress?: ProgressCallback;
      onDownloadProgress?: ProgressCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    return this.request<T>(url, "PATCH", {
      ...options,
      body: data,
    });
  }

  async delete<T>(
    url: string,
    options: RequestInit & {
      showError?: boolean;
      showSuccess?: boolean;
      headers?: Record<string, string>;
      finally?: () => void;
      onSuccess?: OnSuccessCallback;
      onError?: OnErrorCallback;
      timeout?: number;
      poll?: PollingConfig<T>;
    } = {}
  ): Promise<ApiResponse<T> | PollingResult<T>> {
    return this.request<T>(url, "DELETE", options);
  }
}

export const parseResponseMessage = (error: any): GlobalMessage => {
  if (!error) {
    return { message: "Unknown error occurred" };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error?.message && typeof error.message === "string") {
    return { message: error.message };
  }

  if (error?.error?.message && typeof error.error.message === "string") {
    return { message: error.error.message };
  }

  try {
    return { message: JSON.stringify(error) };
  } catch {
    return { message: "An unexpected error occurred" };
  }
};

export default ApiClient;
