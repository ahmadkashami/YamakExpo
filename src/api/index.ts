export {
  registerUser,
  verifyEmailOtp,
  type RegisteredUser,
  type RegisterRequest,
  type RegisterResponse,
  type VerifyEmailOtpRequest,
  type VerifyEmailOtpResponse,
} from './auth';
export {
  getOnboarding,
  type ActiveOnboardingConfig,
  type DisabledOnboardingConfig,
  type OnboardingConfig,
  type OnboardingResponse,
  type OnboardingSlide,
} from './onboarding';
export { ApiError, extractBackendMessage, type ApiErrorKind } from './api-error';
export { getAdds, type Add, type AddsMetaData, type AddsResponse } from './adds';
export {
  getServices,
  type Service,
  type ServiceLanguage,
  type ServiceName,
  type ServicesMetaData,
  type ServicesResponse,
} from './services';
export {
  getVehicleById,
  getVehicles,
  getVehiclesByService,
  type BranchResource,
  type CompanyResource,
  type DriverResource,
  type Vehicle,
  type VehicleGeoLocation,
  type VehicleResponse,
  type VehiclesByServiceResponse,
  type VehiclesMetaData,
  type VehiclesQueryParams,
  type VehiclesResponse,
} from './vehicles';
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
