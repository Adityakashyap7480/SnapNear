import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../config/constants';

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
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
          new CustomEvent('snapnear:account-restricted', { detail: { code: data.code, message, account: data.account } })
        );
      } else if (status === 401) {
        window.dispatchEvent(new Event('snapnear:unauthorized'));
      }
    }

    return Promise.reject({ status, message, details: data.details, code: data.code, account: data.account });
  }
);

export default http;
