/**
 * B3.3 compatibility barrel.
 *
 * The canonical read API lives in `./requests` alongside the create API.
 * This file keeps the earlier untracked import paths working without a second
 * implementation, so there is exactly one source of truth for My Requests.
 */
export {
  getMyRequestDetails,
  getMyRequests,
  MY_REQUESTS_DEFAULT_PER_PAGE,
  MY_REQUESTS_MAX_PER_PAGE,
  normalizeMyRequestsQuery,
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
} from './requests';

export type { MyRequestsQuery as MobileRequestListOptions } from './requests';
export type { MyRequestDetail as MobileRequestDetail } from './requests';
export type { MyRequestListItem as MobileRequestListItem } from './requests';
