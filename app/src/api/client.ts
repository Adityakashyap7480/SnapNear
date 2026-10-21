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
}

const buildUrl = (url: string, pathParams: Record<string, string> = {}) =>
  url.replace(/:(\w+)/g, (_, key: string) => {
    if (pathParams[key] === undefined || pathParams[key] === null) throw new Error(`Missing path param "${key}" for ${url}`);
    return encodeURIComponent(pathParams[key]);
  });

export async function request<T>(method: Method, url: string, { pathParams, params, data }: RequestOptions = {}) {
  const res = await apiClient.request<T>({ method, url: buildUrl(url, pathParams), params, data });
  return res.data;
}

export default apiClient;
