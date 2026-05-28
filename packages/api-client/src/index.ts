export type ApiClientConfig = {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(path, baseUrl);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? response.statusText, payload);
  }

  return payload as T;
}

export function createApiClient(config: ApiClientConfig) {
  async function request<T>(path: string, init: RequestInit = {}, query?: Record<string, string | number | boolean | undefined>) {
    const token = await config.getAuthToken?.();
    const headers = new Headers(config.headers);
    headers.set("Content-Type", "application/json");

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (init.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    const response = await fetch(buildUrl(config.baseUrl, path, query), {
      ...init,
      headers
    });

    return parseResponse<T>(response);
  }

  return {
    request,
    get<T>(path: string, query?: Record<string, string | number | boolean | undefined>) {
      return request<T>(path, { method: "GET" }, query);
    },
    post<T>(path: string, body?: unknown) {
      return request<T>(path, {
        method: "POST",
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    },
    put<T>(path: string, body?: unknown) {
      return request<T>(path, {
        method: "PUT",
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    },
    patch<T>(path: string, body?: unknown) {
      return request<T>(path, {
        method: "PATCH",
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    },
    del<T>(path: string) {
      return request<T>(path, { method: "DELETE" });
    }
  };
}
