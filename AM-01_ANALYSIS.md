# LABCO CONTRACT SYSTEM — AM-01
## MODE: READ-ONLY ANALYSIS

### Repository Overview
- **InventoryBECore** (backend): `D:\AALYASSIN\Projects\work\YamakProject\yamak-backend` — Laravel PHP framework
- **InventoryFEAngular** (frontend): `D:\AALYASSIN\Projects\work\YamakProject\YamakExpoNew` — Expo/React Native with Expo Router

---

## 1. Contract Models, DTOs, and EF Configuration

### Backend (Laravel Eloquent Models)

#### `ServiceRequest` (`yamak-backend\App\Models\ServiceRequest.php`)
- **Fillable fields**: `platform`, `app_user_id`, `driver_id`, `company_id`, `branch_id`, `vehicle_id`, `channel`, `latitude`, `longitude`, `status`
- **Casts**: `latitude` => `decimal:7`, `longitude` => `decimal:7`
- **Relations**:
  - `appUser()` — BelongsTo `AppUser`
  - `driver()` — BelongsTo `Driver`
  - `company()` — BelongsTo `Company`
  - `branch()` — BelongsTo `Branch`
  - `vehicle()` — BelongsTo `Vehicle`
  - `statusHistories()` — HasMany `ServiceRequestStatusHistory`
  - `services()` — BelongsToMany `Service` (pivot: `request_service`)
- **SoftDeletes** enabled

#### `ServiceRequestStatusHistory` (`yamak-backend\App\Models\ServiceRequestStatusHistory.php`)
- **Table**: `service_request_status_histories`
- **Fields**: `id`, `service_request_id`, `from_status`, `to_status`, `actor_type`, `actor_id`, `reason_note`, `created_at`
- **No `updated_at`** (UPDATED_AT = null)
- **Relations**: `serviceRequest()` — BelongsTo `ServiceRequest`, `reasons()` — BelongsToMany `RequestReason`

#### `RequestReason` (`yamak-backend\App\Models\RequestReason.php`)
- **Table**: `request_reasons`
- **Fields**: `code` (unique), `label_ar`
- **Relations**: `statusHistories()` — BelongsToMany `ServiceRequestStatusHistory` (pivot: `service_request_status_history_reasons`)

#### Idempotency
- `RequestIdempotencyKey` — Maps `request_idempotency_keys` table with `app_user_id`, `key`, `request_fingerprint`, `service_request_id`, `expires_at`

### Frontend (TypeScript — Expo/React Native)

#### `src/api/mobile-requests.ts`
- **`MobileRequestListItem`**: `id`, `_id`, `channel`, `status`, `createdAt`, `vehicle_summary`, `services_summary`, `provider_name`
- **`MobileRequestDetail`**: `id`, `_id`, `channel`, `status`, `createdAt`, `updatedAt`, `vehicle`, `services`, `provider_name`, `provider_phone`, `coordinates`, `timeline`, `availableReasons`, `allowedTransitions`
- **`TrackedServiceRequestData`**: `id`, `_id`, `channel`, `status`, `vehicleId`, `driverId`, `driver`, `services`, `createdAt`

#### `src/api/requests.ts`
- **`CreateServiceRequestInput`**: `vehicleId`, `driverId`, `services`
- **`CreateTrackedServiceRequestInput`**: `vehicleId`, `driverId`, `services`, `channel`, `latitude`, `longitude`
- **`TrackedServiceRequestData`**: `id`, `_id`, `channel`, `status`, `vehicleId`, `driverId`, `driver`, `services`, `createdAt`

---

## 2. Existing Amendment Functionality

**NONE EXISTS.**

- No amendment endpoints, controllers, or services found in either repository.
- No Angular components or services for amendments.
- No API routes for amendment operations.
- The `RequestController` in the backend has `update()` method that only updates the `status` field (line 144-157 of `RequestController.php`), not amendment tracking.

### Backend `RequestController::update()` (Draft/Amendment-like)
- Only allows updating the `status` field of an existing request
- No old/new value comparison, no effective date, no audit trail beyond status history
- Used by dashboard for status transitions only

### Frontend
- No amendment UI/screens exist
- Request detail view (`useMyRequestDetail`) shows timeline and allowed transitions but no amendment capability

---

## 3. PreviousContractId and Renewal Support

**NOT FOUND** in any model, migration, or code.

- No `PreviousContractId` column/field in any database table
- No `PreviousContractId` property in `ServiceRequest` model
- No renewal-related code in backend or frontend
- No EF configuration (Laravel uses migrations, not EF)
- No renewal DTOs or controllers

### Status Vocabulary (Backend)
- Approved statuses: `contact_initiated`, `pending`, `accepted`, `completed`, `not_completed`, `cancelled`
- **Per task rules**: Statuses should be `Active`, `Expired`, `Terminated` (not the Laravel vocabularies seen in code)
- No "Renewed" status (per approved rule: "No Renewed status")

### Renewal Rule (from task)
- "Renewal creates a NEW linked contract" — This means renewal is NOT an update to the existing contract, but creation of a new one linked to the original
- "No Renewed status" — Confirmed: no such status exists

---

## 4. Amendment History, Old/New Values, Effective Dates, and Audit Fields

### Existing History Tracking (Backend)
- `service_request_status_histories` table records status transitions with:
  - `from_status` (nullable — NULL for initial creation)
  - `to_status`
  - `actor_type` (e.g., 'admin')
  - `actor_id`
  - `reason_note`
  - `created_at` (timestamp)

### Gaps — Amendment History Not Implemented
- **No old/new value comparison** for amendment fields
- **No effective dates** on amendments
- **No audit fields** (who, when, what changed) specific to amendments
- **No diff/patch tracking** of which fields changed
- **No amendment-specific audit table**

### What IS Tracked
- Status transitions only (via `statusHistories` relation)
- Who made the transition (`actor_id`, `actor_type`)
- When (`created_at`)
- Optional reason note

### What is NOT Tracked
- Field-level changes (what specific values changed)
- Before/after snapshots of amended fields
- Effective start/end dates for amendments
- Amendment type/reason classification

---

## 5. Dependencies on Phase 7

**Phase 7: DEFERRED** (per approved rules)

No existing code depends on Phase 7 for amendment/renewal functionality because:
- No amendment/renewal functionality exists anywhere
- The codebase is currently at B2.5B phase (request lifecycle, status histories, idempotency)
- Phase 7 would be a later phase introducing contract amendments/renewals

### Current Phase Context
- **B2.5A**: Request lifecycle + channel analysis — ✅ COMPLETE
- **B2.5B**: Request model extension (vehicle_id, channel, coordinates, status history) — 🔄 IN PROGRESS
- **B2.5C/D**: Tracked request creation with channel + coordinates — PLANNED
- **Phase 7**: Contract amendments/renewals — **DEFERRED** per task rules

### Risks if Phase 7 Attempted Early
- Premature introduction of amendment logic before lifecycle stabilization
- Conflicts with approved status transition policy (`RequestLifecyclePolicy`)
- Database schema changes without proper migration planning
- Frontend UI changes without corresponding backend API

---

## 6. Reusable Code and Missing Features

### Reusable Code (Existing, Can Be Leveraged)

| Feature | Location | Reusability |
|---|---|---|
| Status history tracking | `ServiceRequest::statusHistories()` | Can be extended for amendment events |
| Idempotency key pattern | `RequestCreationService::createTracked()` | Safe for replay prevention |
| Lifecycle transition policy | `RequestLifecyclePolicy::isAllowed()` | Foundation for status change validation |
| Request reason catalog | `RequestReason` model + seeders | Can be extended for amendment reasons |
| Audit trail (status history) | `service_request_status_histories` table | Can be repurposed for amendment events |

### Missing Features (What Needs to Be Built)

| Feature | Priority | Description |
|---|---|---|
| **Amendment API endpoint** | HIGH | `PATCH /api/mobile/v1/requests/{id}/amendment` or similar |
| **Amendment DTO/Model** | HIGH | Data structure for old/new values, effective date, amendment type |
| **PreviousContractId field** | HIGH | New column on `service_requests` table to link renewed/amended contracts |
| **Amendment service layer** | HIGH | Business logic for creating amendment, validating transitions |
| **Amendment UI** | MEDIUM | Frontend screens for proposing, reviewing, and applying amendments |
| **Renewal workflow** | HIGH | Create new linked contract from existing one |
| **Audit log for amendments** | MEDIUM | Track old/new values, who, when, effective date |
| **Status expansion** | MEDIUM | Add `Active`, `Expired`, `Terminated` statuses (per task rules) |

---

## 7. Atomic Implementation Tasks

Based on the analysis, here are the proposed atomic tasks divided by scope:

### Phase 1: Database & Model Changes
- [ ] **T1**: Add `previous_contract_id` column to `service_requests` table (nullable, FK to service_requests.id)
- [ ] **T2**: Add `amendment_type` column to `service_requests` (enum: 'renewal', 'extension', 'modification')
- [ ] **T3**: Add `amendment_effective_date` column to `service_requests` (date/null)
- [ ] **T4**: Add `amendment_status` column (enum: 'pending', 'approved', 'rejected')
- [ ] **T5**: Create `amendment_history` audit table (or extend `service_request_status_histories`)

### Phase 2: Backend API & Service
- [ ] **T6**: Create `AmendmentController` with `propose()` and `apply()` methods
- [ ] **T7**: Implement amendment validation service (validate old/new values, effective dates)
- [ ] **T8**: Implement renewal service (create new linked contract from existing)
- [ ] **T9**: Extend `RequestLifecyclePolicy` to allow amendment/renewal transitions
- [ ] **T10**: Add amendment reason codes to `request_reasons` catalog

### Phase 3: Frontend
- [ ] **T11**: Create amendment proposal screen (React Native/Expo)
- [ ] **T12**: Create renewal screen (select existing contract, generate new contract)
- [ ] **T13**: Update request detail view to show amendment history
- [ ] **T14**: Add amendment/renewal actions to dashboard request view

### Phase 4: Tests & Documentation
- [ ] **T15**: Write unit tests for amendment service logic
- [ ] **T16**: Write integration tests for renewal workflow
- [ ] **T17**: Update API documentation with amendment/renewal endpoints
- [ ] **T18**: Document amendment types and transition rules

---

## Open Business Decisions

| Decision | Options | Status |
|---|---|---|
| **Amendment vs Renewal distinction** | - Amendment: modify existing contract fields<br>- Renewal: create new linked contract, old becomes historical | **Required**: Per task rules, renewal creates NEW linked contract, no Renewed status |
| **PreviousContractId semantics** | - Links to original contract that was renewed/amended<br>- Nullable for new contracts | **Required**: Must track original contract relationship |
| **Amendment effective date** | - Date when amendment takes effect<br>- Can be past, present, or future | **Required**: Must store for audit and lifecycle purposes |
| **Allowed amendment fields** | - Which fields can be amended (services, channel, coordinates, status)<br>- Which fields are immutable | **Required**: Define business rules per contract type |
| **Amendment approval workflow** | - Automatic (eligible user)<br>- Manual (admin approval)<br>- Hybrid | **Required**: Determine approval path |
| **Status taxonomy** | - Current: `contact_initiated`, `pending`, `accepted`, `completed`, `not_completed`, `cancelled`<br>- Target per rules: `Active`, `Expired`, `Terminated` | **Required**: Must map/convert existing statuses to approved set |
| **Historical preservation** | - Keep all old contracts visible<br>- Archive after X years<br>- Delete after X years | **Required**: Per rule "Preserve historical changes" |

---

## Dependencies and Risks

### Dependencies
1. **B2.5B completion** — Request lifecycle and status history must be stable before adding amendment layer
2. **Status taxonomy migration** — Existing `contact_initiated`/`pending`/etc. statuses need mapping to `Active`/`Expired`/`Terminated`
3. **Database migration** — Adding new columns requires careful migration plan (no data loss)
4. **Frontend coordination** — Amendment UI must match backend API contract
5. **Dashboard alignment** — Dashboard request management must include amendment/renewal actions

### Risks
1. **Schema change risk** — Adding columns to `service_requests` affects all existing queries; must be additive (nullable first)
2. **Status transition conflicts** — Amendment/renewal transitions must not conflict with approved lifecycle policy
3. **Data integrity** — `previous_contract_id` must correctly link without orphan references
4. **Performance** — Amendment history queries could become expensive; need proper indexing
5. **Frontend-backend drift** — UI expectations may not match implemented API

---

## Recommended First Task

**T1: Add `previous_contract_id` column to `service_requests` table**

This is the foundational database change that enables all subsequent amendment and renewal functionality. It:
- Is minimally invasive (nullable column, can be added without downtime)
- Establishes the contract relationship required for renewals
- Enables querying amended/renewed contracts from original
- Sets precedent for subsequent amendment-type and effective-date columns
- Low risk: can be added via standard Laravel migration without data loss
- Unblocks: T2-T5 (additional columns), T6-T8 (backend API), T11-T13 (frontend)

**Rationale**: Without `previous_contract_id`, there is no way to link a renewed contract to its original. This is the single most critical enabler for the entire AM-01 amendment/renewal feature set, and it's the lowest-risk, highest-impact starting point.