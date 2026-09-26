export {
  registerUser,
  type RegisteredUser,
  type RegisterRequest,
  type RegisterResponse,
} from './auth';
export { ApiError, extractBackendMessage, type ApiErrorKind } from './api-error';
export { API_BASE_URL, buildApiUrl, resolveApiBaseUrl } from './config';
export {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  apiRequest,
  type ApiRequestOptions,
  type HttpMethod,
} from './http-client';
