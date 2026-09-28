export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
type Envelope<T> = {
  success: boolean;
  data: T;
  message: string;
  error: string | null;
};
const FAIL = "We couldn't reach LASBAG. Check your connection and try again.";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);
async function request<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });
  if (
    res.status === 401 &&
    !retried &&
    !path.startsWith("/auth/") &&
    !path.startsWith("/public/")
  ) {
    // one silent refresh, then retry
    if (
      (
        await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
      ).ok
    )
      return request<T>(path, init, true);
  }
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body?.success)
    throw new ApiError(res.status, body?.error ?? FAIL);
  return body.data;
}
/** multipart upload with progress (fetch cannot report upload progress). */
function upload<T>(
  path: string,
  form: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("POST", `${API_BASE_URL}${path}`);
    x.withCredentials = true;
    x.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    x.onerror = () => reject(new ApiError(0, FAIL));
    x.onload = () => {
      let b: Envelope<T> | null = null;
      try {
        b = JSON.parse(x.responseText);
      } catch {
        /* not JSON */
      }
      x.status < 300 && b?.success
        ? resolve(b.data)
        : reject(new ApiError(x.status, b?.error ?? FAIL));
    };
    x.send(form);
  });
}
export const api = {
  get: <T>(p: string) => request<T>(p),
  post: <T>(p: string, b?: unknown) =>
    request<T>(p, {
      method: "POST",
      body: b instanceof FormData ? b : JSON.stringify(b ?? {}),
    }),
  patch: <T>(p: string, b: unknown) =>
    request<T>(p, { method: "PATCH", body: JSON.stringify(b) }),
  upload,
};
