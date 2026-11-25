export {
  registerUser,
  loginUser,
  verifyEmailOtp,
  type LoginRequest,
  type LoginResponse,
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
// B4.2/B4.3: profile GET contract used by /profile/edit. Only read types and
// getUserProfile are exported; Name/Phone edits stay local to the screen until
// a write contract is explicitly approved.
export { getUserProfile, type ProfileResponse, type ProfileUser } from './profile';
export {
  createServiceRequest,
  createTrackedServiceRequest,
  getMyRequestDetails,
  getMyRequests,
  MY_REQUESTS_DEFAULT_PER_PAGE,
  MY_REQUESTS_MAX_PER_PAGE,
  normalizeMyRequestsQuery,
  type CreateServiceRequestInput,
  type CreateServiceRequestResult,
  type CreateTrackedServiceRequestInput,
  type CreateTrackedServiceRequestResult,
  type MyRequestDetail,
  type MyRequestDetailsResponse,
  type MyRequestListItem,
  type MyRequestServiceSummary,
  type MyRequestsMetaData,
  type MyRequestsQuery,
  type MyRequestsResponse,
  type MyRequestTimelineEntry,
  type MyRequestVehicleDetail,
  type MyRequestVehicleSummary,
  type RequestChannel,
  type TrackedServiceRequestData,
  type TrackedServiceRequestDriver,
  type TrackedServiceRequestService,
} from './requests';
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
  type VehicleListParams,
  type VehicleResponse,
  type VehiclesByServiceResponse,
  type VehiclesListData,
  type VehiclesMetaData,
  type VehiclesQueryParams,
  type VehiclesResponse,
  type VehicleSort,
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
