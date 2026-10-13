import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS, TOKEN_KEY } from '../config/constants';
import { APP_EVENTS } from '../config/events';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const message =
      data.message || (error.code === 'ECONNABORTED' ? 'Request timed out' : 'Unable to reach SnapNear servers');
    const isAccountRestricted = status === 403 && data.code?.startsWith('ACCOUNT_');

    if (localStorage.getItem(TOKEN_KEY)) {
      if (isAccountRestricted) {
        window.dispatchEvent(
          new CustomEvent(APP_EVENTS.ACCOUNT_RESTRICTED, { detail: { code: data.code, message, account: data.account } })
        );
      } else if (status === 401) {
        window.dispatchEvent(new Event(APP_EVENTS.UNAUTHORIZED));
      }
    }

    return Promise.reject({ status, message, details: data.details, code: data.code, account: data.account });
  }
);

const buildUrl = (url, pathParams = {}) =>
  url.replace(/:(\w+)/g, (_, key) => {
    if (pathParams[key] === undefined || pathParams[key] === null) throw new Error(`Missing path param "${key}" for ${url}`);
    return encodeURIComponent(pathParams[key]);
  });

/**
 * Calls an endpoint from API_ENDPOINTS.
 * @param {{ method: string, url: string }} endpoint
 * @param {{ pathParams?: object, params?: object, data?: object }} [options] params = query string, data = JSON body
 */
export function request(endpoint, { pathParams, params, data } = {}) {
  return apiClient.request({ method: endpoint.method, url: buildUrl(endpoint.url, pathParams), params, data });
}

export default apiClient;
