import axios, { type AxiosError } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/constants';
import { APP_EVENTS } from '../config/events';
import { appEvents } from '../lib/emitter';
import { tokenStore } from '../lib/storage';
import type { AccountInfo, AccountNoticeInfo, ApiFailure } from '../types';
import { syncServerTime } from '../utils/serverClock';

type ErrorBody = { message?: string; details?: ApiFailure['details']; code?: string; account?: AccountInfo };

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    syncServerTime(res.headers?.['x-server-time']);
    return res;
  },
  (error: AxiosError<ErrorBody>) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const message =
      data.message || (error.code === 'ECONNABORTED' ? 'Request timed out' : 'Unable to reach SnapNear servers');
    const isAccountRestricted = status === 403 && Boolean(data.code?.startsWith('ACCOUNT_'));

    if (tokenStore.get()) {
      if (isAccountRestricted) {
        appEvents.emit<AccountNoticeInfo>(APP_EVENTS.ACCOUNT_RESTRICTED, { code: data.code, message, account: data.account });
      } else if (status === 401) {
        appEvents.emit(APP_EVENTS.UNAUTHORIZED);
      }
    }

    const failure: ApiFailure = { status, message, details: data.details, code: data.code, account: data.account };
    return Promise.reject(failure);
  }
);

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  pathParams?: Record<string, string>;
  /** Query string */
  params?: Record<string, unknown>;
  /** JSON body */
  data?: unknown;
  /**
   * Retry when the server never responds at all (Render free tier sleeps when idle —
   * the first request wakes it, ~30–50s, longer than the normal 15s timeout).
   * Only opt in for calls that are safe to repeat, e.g. login. Real API errors
   * (401/400/403…) come back with an HTTP status and are never retried.
   */
  retryOnColdStart?: boolean;
}

// Extra attempts given to a possibly-sleeping backend, and how long each may take.
const COLD_START_RETRIES = 2;
const COLD_START_TIMEOUT_MS = 60_000;
const COLD_START_RETRY_DELAY_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// No HTTP status = no response ever arrived (timeout / network), i.e. cold start.
// A response with a status means the server is awake and its answer is final.
const isColdStartFailure = (err: unknown) => !(err as ApiFailure)?.status;

let lastWarmUpAt = 0;
let warmUpInFlight = false;

/** Fire-and-forget ping so a sleeping backend starts waking while the user is still typing. */
export function warmUpServer() {
  const now = Date.now();
  if (warmUpInFlight || now - lastWarmUpAt < 30_000) return;
  lastWarmUpAt = now;
  warmUpInFlight = true;
  void apiClient
    .get('/health', { timeout: COLD_START_TIMEOUT_MS })
    .catch(() => undefined)
    .finally(() => {
      warmUpInFlight = false;
    });
}

const buildUrl = (url: string, pathParams: Record<string, string> = {}) =>
  url.replace(/:(\w+)/g, (_, key: string) => {
    if (pathParams[key] === undefined || pathParams[key] === null) throw new Error(`Missing path param "${key}" for ${url}`);
    return encodeURIComponent(pathParams[key]);
  });

export async function request<T>(
  method: Method,
  url: string,
  { pathParams, params, data, retryOnColdStart }: RequestOptions = {}
) {
  // GETs are safe to repeat; other methods only when the caller opts in (login).
  const attempts = method === 'GET' || retryOnColdStart ? COLD_START_RETRIES + 1 : 1;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await apiClient.request<T>({
        method,
        url: buildUrl(url, pathParams),
        params,
        data,
        // First try keeps the snappy 15s timeout; retries ride out the wake-up.
        timeout: attempt === 0 ? API_TIMEOUT_MS : COLD_START_TIMEOUT_MS,
      });
      return res.data;
    } catch (err) {
      if (attempt >= attempts - 1 || !isColdStartFailure(err)) throw err;
      await sleep(COLD_START_RETRY_DELAY_MS);
    }
  }
}

export default apiClient;
