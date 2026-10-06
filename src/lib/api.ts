/**
 * All requests go to same-origin `/api/*`: Caddy routes them to the backend in
 * production and next.config.ts rewrites them in development, so the session
 * cookie is first-party and no CORS is involved.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Per-field messages from row validation / uniqueness errors. */
    readonly fields: Record<string, string> = {},
    readonly body: unknown = null,
  ) {
    super(message);
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON error (e.g. proxy error page).
  }
  const b = (body ?? {}) as {
    message?: string | string[];
    fields?: Record<string, string>;
  };
  const message = Array.isArray(b.message)
    ? b.message.join('. ')
    : (b.message ?? `Request failed (${res.status})`);
  return new ApiError(res.status, message, b.fields ?? {}, body);
}

export async function api<T = unknown>(
  path: string,
  init: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const isForm = init.body instanceof FormData;
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body !== undefined && !isForm
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init.headers,
    },
    body:
      init.body === undefined
        ? undefined
        : isForm
          ? (init.body as FormData)
          : JSON.stringify(init.body),
  });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** SWR fetcher. */
export const fetcher = <T>(path: string) => api<T>(path);

export interface FilterCondition {
  id: string;
  field: string;
  op: string;
  value: string;
}

export interface ViewQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: string;
  match?: 'all' | 'any';
  filters?: FilterCondition[];
}

/** Serializes a grid view into the backend's `filter[key][op]=value` syntax. */
export function viewSearchParams(view: ViewQuery): URLSearchParams {
  const p = new URLSearchParams();
  if (view.page && view.page > 1) p.set('page', String(view.page));
  if (view.pageSize) p.set('pageSize', String(view.pageSize));
  if (view.q) p.set('q', view.q);
  if (view.sort) p.set('sort', view.sort);
  const active = (view.filters ?? []).filter(
    (f) => f.field && f.op && (f.value !== '' || f.op === 'empty'),
  );
  for (const f of active) {
    p.append(`filter[${f.field}][${f.op}]`, f.op === 'empty' ? f.value || 'true' : f.value);
  }
  if (active.length > 1 && view.match === 'any') p.set('match', 'any');
  return p;
}

export function withQuery(path: string, params: URLSearchParams | Record<string, string | number | boolean | undefined>) {
  const p =
    params instanceof URLSearchParams
      ? params
      : new URLSearchParams(
          Object.entries(params).flatMap(([k, v]) =>
            v === undefined || v === '' || v === false ? [] : [[k, String(v)]],
          ),
        );
  const s = p.toString();
  return s ? `${path}?${s}` : path;
}
