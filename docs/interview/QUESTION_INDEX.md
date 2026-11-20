# Question index: mounted API routes

Purpose: source-backed interview practice. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: `VERIFIED_FROM_CODE` unless marked future. Audience: project owner.

These are compact drills. For full explanations see [booking and queue](DATABASE_AND_TRANSACTIONS.md), [security](AUTHORIZATION_AND_SECURITY.md), and [deep dives](INTERVIEW_GUIDE.md). A source-backed route declaration proves wiring, not successful deployment.

### Q001. How does GET /api/appointments/:appointmentId/activities enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `GET /api/appointments/:appointmentId/activities`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q002. Who may call GET /api/appointments/:appointmentId/activities, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q003. What validation and abuse controls protect GET /api/appointments/:appointmentId/activities?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `appointmentIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q004. How does PATCH /api/appointments/:appointmentId/reschedule enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `PATCH /api/appointments/:appointmentId/reschedule`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q005. Who may call PATCH /api/appointments/:appointmentId/reschedule, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q006. What validation and abuse controls protect PATCH /api/appointments/:appointmentId/reschedule?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `appointmentIdParamsSchema, rescheduleAppointmentSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q007. How does GET /api/appointments/:appointmentId/reschedule-slots enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `GET /api/appointments/:appointmentId/reschedule-slots`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q008. Who may call GET /api/appointments/:appointmentId/reschedule-slots, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q009. What validation and abuse controls protect GET /api/appointments/:appointmentId/reschedule-slots?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `appointmentIdParamsSchema, rescheduleAppointmentSlotsQuerySchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q010. How does PATCH /api/appointments/:appointmentId/status enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `PATCH /api/appointments/:appointmentId/status`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q011. Who may call PATCH /api/appointments/:appointmentId/status, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q012. What validation and abuse controls protect PATCH /api/appointments/:appointmentId/status?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `appointmentIdParamsSchema, updateAppointmentStatusSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q013. How does GET /api/clinics/:clinicId/appointments enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `GET /api/clinics/:clinicId/appointments`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q014. Who may call GET /api/clinics/:clinicId/appointments, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q015. What validation and abuse controls protect GET /api/clinics/:clinicId/appointments?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `clinicIdParamsSchema, listAppointmentsQuerySchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q016. How does POST /api/clinics/:clinicId/appointments enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `POST /api/clinics/:clinicId/appointments`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q017. Who may call POST /api/clinics/:clinicId/appointments, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q018. What validation and abuse controls protect POST /api/clinics/:clinicId/appointments?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `clinicIdParamsSchema, createAppointmentSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q019. How does GET /api/clinics/:clinicId/appointments/available-slots enter the system?

**Difficulty:** Beginner. **Topic:** appointments. **Short answer:** `app.ts` mounts the appointments router, then `apps/server/src/modules/appointments/appointment.routes.ts` handles `GET /api/clinics/:clinicId/appointments/available-slots`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q020. Who may call GET /api/clinics/:clinicId/appointments/available-slots, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** appointments. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q021. What validation and abuse controls protect GET /api/clinics/:clinicId/appointments/available-slots?

**Difficulty:** Advanced. **Topic:** appointments. **Short answer:** The route references `clinicIdParamsSchema, availableAppointmentSlotsQuerySchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/appointments/appointment.routes.ts`](../../apps/server/src/modules/appointments/appointment.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q022. How does GET /api/auth/me enter the system?

**Difficulty:** Beginner. **Topic:** auth. **Short answer:** `app.ts` mounts the auth router, then `apps/server/src/modules/auth/auth.routes.ts` handles `GET /api/auth/me`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q023. Who may call GET /api/auth/me, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** auth. **Short answer:** The route requires active internal user; route-level role is see service; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q024. What validation and abuse controls protect GET /api/auth/me?

**Difficulty:** Advanced. **Topic:** auth. **Short answer:** The route references `none` for request checks and `identityRead` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q025. How does GET /api/auth/onboarding-status enter the system?

**Difficulty:** Beginner. **Topic:** auth. **Short answer:** `app.ts` mounts the auth router, then `apps/server/src/modules/auth/auth.routes.ts` handles `GET /api/auth/onboarding-status`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q026. Who may call GET /api/auth/onboarding-status, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** auth. **Short answer:** The route requires Clerk identity; route-level role is see service; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q027. What validation and abuse controls protect GET /api/auth/onboarding-status?

**Difficulty:** Advanced. **Topic:** auth. **Short answer:** The route references `see route` for request checks and `identityRead` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q028. How does POST /api/auth/onboarding/clinic enter the system?

**Difficulty:** Beginner. **Topic:** auth. **Short answer:** `app.ts` mounts the auth router, then `apps/server/src/modules/auth/auth.routes.ts` handles `POST /api/auth/onboarding/clinic`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q029. Who may call POST /api/auth/onboarding/clinic, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** auth. **Short answer:** The route requires Clerk identity; route-level role is see service; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q030. What validation and abuse controls protect POST /api/auth/onboarding/clinic?

**Difficulty:** Advanced. **Topic:** auth. **Short answer:** The route references `see route` for request checks and `onboarding` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q031. How does POST /api/clinics enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `POST /api/clinics`; its controller deliberately disables standalone creation. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q032. Who may call POST /api/clinics, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q033. What validation and abuse controls protect POST /api/clinics?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `none` for request checks and `none` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q034. How does GET /api/clinics/:clinicId enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `GET /api/clinics/:clinicId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q035. Who may call GET /api/clinics/:clinicId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q036. What validation and abuse controls protect GET /api/clinics/:clinicId?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q037. How does PATCH /api/clinics/:clinicId enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `PATCH /api/clinics/:clinicId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q038. Who may call PATCH /api/clinics/:clinicId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q039. What validation and abuse controls protect PATCH /api/clinics/:clinicId?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema, updateClinicSchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q040. How does POST /api/clinics/:clinicId/deactivate enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `POST /api/clinics/:clinicId/deactivate`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q041. Who may call POST /api/clinics/:clinicId/deactivate, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q042. What validation and abuse controls protect POST /api/clinics/:clinicId/deactivate?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema, deactivateClinicBodySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q043. How does POST /api/clinics/:clinicId/geocode enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `POST /api/clinics/:clinicId/geocode`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q044. Who may call POST /api/clinics/:clinicId/geocode, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q045. What validation and abuse controls protect POST /api/clinics/:clinicId/geocode?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema, retryClinicGeocodingBodySchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q046. How does GET /api/clinics/:clinicId/lifecycle-impact enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `GET /api/clinics/:clinicId/lifecycle-impact`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q047. Who may call GET /api/clinics/:clinicId/lifecycle-impact, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q048. What validation and abuse controls protect GET /api/clinics/:clinicId/lifecycle-impact?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q049. How does POST /api/clinics/:clinicId/restore enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `POST /api/clinics/:clinicId/restore`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q050. Who may call POST /api/clinics/:clinicId/restore, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q051. What validation and abuse controls protect POST /api/clinics/:clinicId/restore?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema, restoreClinicBodySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q052. How does POST /api/clinics/:clinicId/sample-data enter the system?

**Difficulty:** Beginner. **Topic:** clinics. **Short answer:** `app.ts` mounts the clinics router, then `apps/server/src/modules/clinics/clinic.routes.ts` handles `POST /api/clinics/:clinicId/sample-data`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q053. Who may call POST /api/clinics/:clinicId/sample-data, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** clinics. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q054. What validation and abuse controls protect POST /api/clinics/:clinicId/sample-data?

**Difficulty:** Advanced. **Topic:** clinics. **Short answer:** The route references `clinicIdParamsSchema, provisionSampleDataBodySchema` for request checks and `provisioning` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/clinics/clinic.routes.ts`](../../apps/server/src/modules/clinics/clinic.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q055. How does GET /api/clinics/:clinicId/dashboard/high-risk-appointments enter the system?

**Difficulty:** Beginner. **Topic:** dashboard. **Short answer:** `app.ts` mounts the dashboard router, then `apps/server/src/modules/dashboard/dashboard.routes.ts` handles `GET /api/clinics/:clinicId/dashboard/high-risk-appointments`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q056. Who may call GET /api/clinics/:clinicId/dashboard/high-risk-appointments, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** dashboard. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q057. What validation and abuse controls protect GET /api/clinics/:clinicId/dashboard/high-risk-appointments?

**Difficulty:** Advanced. **Topic:** dashboard. **Short answer:** The route references `dashboardClinicIdParamsSchema, highRiskAppointmentsQuerySchema` for request checks and `dashboard` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q058. How does GET /api/clinics/:clinicId/dashboard/no-show-intelligence enter the system?

**Difficulty:** Beginner. **Topic:** dashboard. **Short answer:** `app.ts` mounts the dashboard router, then `apps/server/src/modules/dashboard/dashboard.routes.ts` handles `GET /api/clinics/:clinicId/dashboard/no-show-intelligence`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q059. Who may call GET /api/clinics/:clinicId/dashboard/no-show-intelligence, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** dashboard. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q060. What validation and abuse controls protect GET /api/clinics/:clinicId/dashboard/no-show-intelligence?

**Difficulty:** Advanced. **Topic:** dashboard. **Short answer:** The route references `dashboardClinicIdParamsSchema, noShowIntelligenceQuerySchema` for request checks and `dashboard` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q061. How does GET /api/clinics/:clinicId/dashboard/summary enter the system?

**Difficulty:** Beginner. **Topic:** dashboard. **Short answer:** `app.ts` mounts the dashboard router, then `apps/server/src/modules/dashboard/dashboard.routes.ts` handles `GET /api/clinics/:clinicId/dashboard/summary`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q062. Who may call GET /api/clinics/:clinicId/dashboard/summary, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** dashboard. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q063. What validation and abuse controls protect GET /api/clinics/:clinicId/dashboard/summary?

**Difficulty:** Advanced. **Topic:** dashboard. **Short answer:** The route references `dashboardClinicIdParamsSchema, dashboardSummaryQuerySchema` for request checks and `dashboard` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q064. How does GET /api/clinics/:clinicId/dashboard/today-activity enter the system?

**Difficulty:** Beginner. **Topic:** dashboard. **Short answer:** `app.ts` mounts the dashboard router, then `apps/server/src/modules/dashboard/dashboard.routes.ts` handles `GET /api/clinics/:clinicId/dashboard/today-activity`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q065. Who may call GET /api/clinics/:clinicId/dashboard/today-activity, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** dashboard. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q066. What validation and abuse controls protect GET /api/clinics/:clinicId/dashboard/today-activity?

**Difficulty:** Advanced. **Topic:** dashboard. **Short answer:** The route references `dashboardClinicIdParamsSchema` for request checks and `dashboard` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/dashboard/dashboard.routes.ts`](../../apps/server/src/modules/dashboard/dashboard.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q067. How does GET /api/clinics/:clinicId/doctors enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `GET /api/clinics/:clinicId/doctors`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q068. Who may call GET /api/clinics/:clinicId/doctors, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q069. What validation and abuse controls protect GET /api/clinics/:clinicId/doctors?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `clinicIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q070. How does POST /api/clinics/:clinicId/doctors enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `POST /api/clinics/:clinicId/doctors`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q071. Who may call POST /api/clinics/:clinicId/doctors, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q072. What validation and abuse controls protect POST /api/clinics/:clinicId/doctors?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `clinicIdParamsSchema, createDoctorSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q073. How does DELETE /api/clinics/:clinicId/doctors/:doctorId enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `DELETE /api/clinics/:clinicId/doctors/:doctorId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q074. Who may call DELETE /api/clinics/:clinicId/doctors/:doctorId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q075. What validation and abuse controls protect DELETE /api/clinics/:clinicId/doctors/:doctorId?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q076. How does GET /api/clinics/:clinicId/doctors/:doctorId enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `GET /api/clinics/:clinicId/doctors/:doctorId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q077. Who may call GET /api/clinics/:clinicId/doctors/:doctorId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q078. What validation and abuse controls protect GET /api/clinics/:clinicId/doctors/:doctorId?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q079. How does PATCH /api/clinics/:clinicId/doctors/:doctorId enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `PATCH /api/clinics/:clinicId/doctors/:doctorId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q080. Who may call PATCH /api/clinics/:clinicId/doctors/:doctorId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q081. What validation and abuse controls protect PATCH /api/clinics/:clinicId/doctors/:doctorId?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema, updateDoctorSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q082. How does GET /api/clinics/:clinicId/doctors/:doctorId/availability enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `GET /api/clinics/:clinicId/doctors/:doctorId/availability`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q083. Who may call GET /api/clinics/:clinicId/doctors/:doctorId/availability, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q084. What validation and abuse controls protect GET /api/clinics/:clinicId/doctors/:doctorId/availability?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q085. How does PUT /api/clinics/:clinicId/doctors/:doctorId/availability enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `PUT /api/clinics/:clinicId/doctors/:doctorId/availability`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q086. Who may call PUT /api/clinics/:clinicId/doctors/:doctorId/availability, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q087. What validation and abuse controls protect PUT /api/clinics/:clinicId/doctors/:doctorId/availability?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema, replaceDoctorAvailabilitySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q088. How does GET /api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `GET /api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q089. Who may call GET /api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q090. What validation and abuse controls protect GET /api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q091. How does POST /api/clinics/:clinicId/doctors/:doctorId/restore enter the system?

**Difficulty:** Beginner. **Topic:** doctors. **Short answer:** `app.ts` mounts the doctors router, then `apps/server/src/modules/doctors/doctor.routes.ts` handles `POST /api/clinics/:clinicId/doctors/:doctorId/restore`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q092. Who may call POST /api/clinics/:clinicId/doctors/:doctorId/restore, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** doctors. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q093. What validation and abuse controls protect POST /api/clinics/:clinicId/doctors/:doctorId/restore?

**Difficulty:** Advanced. **Topic:** doctors. **Short answer:** The route references `doctorClinicParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/doctors/doctor.routes.ts`](../../apps/server/src/modules/doctors/doctor.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q094. How does GET /api/health enter the system?

**Difficulty:** Beginner. **Topic:** health. **Short answer:** `app.ts` mounts the health router, then `apps/server/src/modules/health/health.routes.ts` handles `GET /api/health`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/health/health.routes.ts`](../../apps/server/src/modules/health/health.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q095. Who may call GET /api/health, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** health. **Short answer:** The route requires public; route-level role is none; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/health/health.routes.ts`](../../apps/server/src/modules/health/health.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q096. What validation and abuse controls protect GET /api/health?

**Difficulty:** Advanced. **Topic:** health. **Short answer:** The route references `none` for request checks and `none` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/health/health.routes.ts`](../../apps/server/src/modules/health/health.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q097. How does GET /api/clinics/:clinicId/patients enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `GET /api/clinics/:clinicId/patients`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q098. Who may call GET /api/clinics/:clinicId/patients, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q099. What validation and abuse controls protect GET /api/clinics/:clinicId/patients?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicIdParamsSchema, listPatientsQuerySchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q100. How does POST /api/clinics/:clinicId/patients enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `POST /api/clinics/:clinicId/patients`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q101. Who may call POST /api/clinics/:clinicId/patients, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q102. What validation and abuse controls protect POST /api/clinics/:clinicId/patients?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicIdParamsSchema, createPatientSchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q103. How does DELETE /api/clinics/:clinicId/patients/:patientId enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `DELETE /api/clinics/:clinicId/patients/:patientId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q104. Who may call DELETE /api/clinics/:clinicId/patients/:patientId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q105. What validation and abuse controls protect DELETE /api/clinics/:clinicId/patients/:patientId?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q106. How does GET /api/clinics/:clinicId/patients/:patientId enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `GET /api/clinics/:clinicId/patients/:patientId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q107. Who may call GET /api/clinics/:clinicId/patients/:patientId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q108. What validation and abuse controls protect GET /api/clinics/:clinicId/patients/:patientId?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q109. How does PATCH /api/clinics/:clinicId/patients/:patientId enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `PATCH /api/clinics/:clinicId/patients/:patientId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q110. Who may call PATCH /api/clinics/:clinicId/patients/:patientId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q111. What validation and abuse controls protect PATCH /api/clinics/:clinicId/patients/:patientId?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema, updatePatientSchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q112. How does POST /api/clinics/:clinicId/patients/:patientId/geocode enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `POST /api/clinics/:clinicId/patients/:patientId/geocode`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q113. Who may call POST /api/clinics/:clinicId/patients/:patientId/geocode, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q114. What validation and abuse controls protect POST /api/clinics/:clinicId/patients/:patientId/geocode?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema, retryPatientGeocodingBodySchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q115. How does GET /api/clinics/:clinicId/patients/:patientId/lifecycle-impact enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `GET /api/clinics/:clinicId/patients/:patientId/lifecycle-impact`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q116. Who may call GET /api/clinics/:clinicId/patients/:patientId/lifecycle-impact, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q117. What validation and abuse controls protect GET /api/clinics/:clinicId/patients/:patientId/lifecycle-impact?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q118. How does POST /api/clinics/:clinicId/patients/:patientId/restore enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `POST /api/clinics/:clinicId/patients/:patientId/restore`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q119. Who may call POST /api/clinics/:clinicId/patients/:patientId/restore, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q120. What validation and abuse controls protect POST /api/clinics/:clinicId/patients/:patientId/restore?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q121. How does POST /api/clinics/:clinicId/patients/:patientId/route enter the system?

**Difficulty:** Beginner. **Topic:** patients. **Short answer:** `app.ts` mounts the patients router, then `apps/server/src/modules/patients/patient.routes.ts` handles `POST /api/clinics/:clinicId/patients/:patientId/route`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q122. Who may call POST /api/clinics/:clinicId/patients/:patientId/route, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** patients. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q123. What validation and abuse controls protect POST /api/clinics/:clinicId/patients/:patientId/route?

**Difficulty:** Advanced. **Topic:** patients. **Short answer:** The route references `clinicPatientIdParamsSchema, retryPatientRoutingBodySchema` for request checks and `provider` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/patients/patient.routes.ts`](../../apps/server/src/modules/patients/patient.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q124. How does GET /api/predictions/:predictionId/feedback enter the system?

**Difficulty:** Beginner. **Topic:** predictions. **Short answer:** `app.ts` mounts the predictions router, then `apps/server/src/modules/predictions/prediction-feedback.routes.ts` handles `GET /api/predictions/:predictionId/feedback`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q125. Who may call GET /api/predictions/:predictionId/feedback, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** predictions. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q126. What validation and abuse controls protect GET /api/predictions/:predictionId/feedback?

**Difficulty:** Advanced. **Topic:** predictions. **Short answer:** The route references `predictionFeedbackParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q127. How does PUT /api/predictions/:predictionId/feedback enter the system?

**Difficulty:** Beginner. **Topic:** predictions. **Short answer:** `app.ts` mounts the predictions router, then `apps/server/src/modules/predictions/prediction-feedback.routes.ts` handles `PUT /api/predictions/:predictionId/feedback`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q128. Who may call PUT /api/predictions/:predictionId/feedback, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** predictions. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q129. What validation and abuse controls protect PUT /api/predictions/:predictionId/feedback?

**Difficulty:** Advanced. **Topic:** predictions. **Short answer:** The route references `predictionFeedbackParamsSchema, predictionFeedbackBodySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/predictions/prediction-feedback.routes.ts`](../../apps/server/src/modules/predictions/prediction-feedback.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q130. How does GET /api/clinics/:clinicId/queue enter the system?

**Difficulty:** Beginner. **Topic:** queues. **Short answer:** `app.ts` mounts the queues router, then `apps/server/src/modules/queues/queue.routes.ts` handles `GET /api/clinics/:clinicId/queue`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q131. Who may call GET /api/clinics/:clinicId/queue, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** queues. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q132. What validation and abuse controls protect GET /api/clinics/:clinicId/queue?

**Difficulty:** Advanced. **Topic:** queues. **Short answer:** The route references `queueClinicIdParamsSchema, listQueueQuerySchema` for request checks and `queueRead` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q133. How does PATCH /api/clinics/:clinicId/queue/:queueEntryId/status enter the system?

**Difficulty:** Beginner. **Topic:** queues. **Short answer:** `app.ts` mounts the queues router, then `apps/server/src/modules/queues/queue.routes.ts` handles `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q134. Who may call PATCH /api/clinics/:clinicId/queue/:queueEntryId/status, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** queues. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q135. What validation and abuse controls protect PATCH /api/clinics/:clinicId/queue/:queueEntryId/status?

**Difficulty:** Advanced. **Topic:** queues. **Short answer:** The route references `queueStatusUpdateParamsSchema, updateQueueStatusBodySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q136. How does PATCH /api/clinics/:clinicId/queue/reorder enter the system?

**Difficulty:** Beginner. **Topic:** queues. **Short answer:** `app.ts` mounts the queues router, then `apps/server/src/modules/queues/queue.routes.ts` handles `PATCH /api/clinics/:clinicId/queue/reorder`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q137. Who may call PATCH /api/clinics/:clinicId/queue/reorder, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** queues. **Short answer:** The route requires active internal user; route-level role is Admin/Staff; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q138. What validation and abuse controls protect PATCH /api/clinics/:clinicId/queue/reorder?

**Difficulty:** Advanced. **Topic:** queues. **Short answer:** The route references `queueClinicIdParamsSchema, reorderQueueBodySchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q139. How does GET /api/clinics/:clinicId/staff enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `GET /api/clinics/:clinicId/staff`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q140. Who may call GET /api/clinics/:clinicId/staff, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q141. What validation and abuse controls protect GET /api/clinics/:clinicId/staff?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `clinicIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q142. How does DELETE /api/clinics/:clinicId/staff/:userId enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `DELETE /api/clinics/:clinicId/staff/:userId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q143. Who may call DELETE /api/clinics/:clinicId/staff/:userId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q144. What validation and abuse controls protect DELETE /api/clinics/:clinicId/staff/:userId?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffMemberParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q145. How does GET /api/clinics/:clinicId/staff/:userId enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `GET /api/clinics/:clinicId/staff/:userId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q146. Who may call GET /api/clinics/:clinicId/staff/:userId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q147. What validation and abuse controls protect GET /api/clinics/:clinicId/staff/:userId?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffMemberParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q148. How does PATCH /api/clinics/:clinicId/staff/:userId enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `PATCH /api/clinics/:clinicId/staff/:userId`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q149. Who may call PATCH /api/clinics/:clinicId/staff/:userId, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q150. What validation and abuse controls protect PATCH /api/clinics/:clinicId/staff/:userId?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffMemberParamsSchema, updateStaffProfileSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q151. How does POST /api/clinics/:clinicId/staff/:userId/restore enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `POST /api/clinics/:clinicId/staff/:userId/restore`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q152. Who may call POST /api/clinics/:clinicId/staff/:userId/restore, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q153. What validation and abuse controls protect POST /api/clinics/:clinicId/staff/:userId/restore?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffMemberParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q154. How does PATCH /api/clinics/:clinicId/staff/:userId/status enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `PATCH /api/clinics/:clinicId/staff/:userId/status`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q155. Who may call PATCH /api/clinics/:clinicId/staff/:userId/status, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q156. What validation and abuse controls protect PATCH /api/clinics/:clinicId/staff/:userId/status?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffMemberParamsSchema, updateStaffStatusSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q157. How does GET /api/clinics/:clinicId/staff/invitations enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `GET /api/clinics/:clinicId/staff/invitations`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q158. Who may call GET /api/clinics/:clinicId/staff/invitations, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q159. What validation and abuse controls protect GET /api/clinics/:clinicId/staff/invitations?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `clinicIdParamsSchema` for request checks and `collection` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q160. How does POST /api/clinics/:clinicId/staff/invitations enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `POST /api/clinics/:clinicId/staff/invitations`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q161. Who may call POST /api/clinics/:clinicId/staff/invitations, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q162. What validation and abuse controls protect POST /api/clinics/:clinicId/staff/invitations?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `clinicIdParamsSchema, createStaffInvitationSchema` for request checks and `invitationWrite` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q163. How does POST /api/clinics/:clinicId/staff/invitations/:invitationId/resend enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `POST /api/clinics/:clinicId/staff/invitations/:invitationId/resend`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q164. Who may call POST /api/clinics/:clinicId/staff/invitations/:invitationId/resend, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q165. What validation and abuse controls protect POST /api/clinics/:clinicId/staff/invitations/:invitationId/resend?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffInvitationManagementParamsSchema` for request checks and `invitationWrite` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q166. How does PATCH /api/clinics/:clinicId/staff/invitations/:invitationId/revoke enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `PATCH /api/clinics/:clinicId/staff/invitations/:invitationId/revoke`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q167. Who may call PATCH /api/clinics/:clinicId/staff/invitations/:invitationId/revoke, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires active internal user; route-level role is Admin; `requireClinicAccess` guards the clinic path. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q168. What validation and abuse controls protect PATCH /api/clinics/:clinicId/staff/invitations/:invitationId/revoke?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffInvitationManagementParamsSchema` for request checks and `mutation` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q169. How does GET /api/staff/invitations/:token enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `GET /api/staff/invitations/:token`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q170. Who may call GET /api/staff/invitations/:token, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires Clerk identity; route-level role is see service; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q171. What validation and abuse controls protect GET /api/staff/invitations/:token?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffInvitationTokenParamsSchema` for request checks and `invitationRead` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q172. How does POST /api/staff/invitations/:token/accept enter the system?

**Difficulty:** Beginner. **Topic:** staff. **Short answer:** `app.ts` mounts the staff router, then `apps/server/src/modules/staff/staff.routes.ts` handles `POST /api/staff/invitations/:token/accept`. Trace its controller, service and repository to determine whether it writes data. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q173. Who may call POST /api/staff/invitations/:token/accept, and where is the boundary?

**Difficulty:** Intermediate. **Topic:** staff. **Short answer:** The route requires Clerk identity; route-level role is see service; Object or clinic checks, if needed, live deeper in the service. Verify them before claiming isolation. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q174. What validation and abuse controls protect POST /api/staff/invitations/:token/accept?

**Difficulty:** Advanced. **Topic:** staff. **Short answer:** The route references `staffInvitationTokenParamsSchema, acceptStaffInvitationBodySchema` for request checks and `invitationAccept` for rate limiting. Inspect the validator for bounds and the controller/service for failure codes; do not assume a generic 400 for every rejection. **Code evidence:** [`apps/server/src/modules/staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts); [`app.ts`](../../apps/server/src/app.ts). **Follow-up:** What changes under a concurrent request or another clinic identity? **Common mistake:** Treating a route declaration as proof of production verification.

### Q175. Why use a single Express service?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** One deployable service keeps cross-module transactions local; split only when independent scaling and operational cost justify it. **Code evidence:** [`apps/server/src/app.ts`](../../apps/server/src/app.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.

### Q176. What is a race condition in booking?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** Two requests may both read a free slot before either writes; the transaction-scoped schedule lock serializes the conflicting doctor/date scope. **Code evidence:** [`apps/server/src/modules/appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.

### Q177. Why is a uniqueness index insufficient for every scheduling conflict?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** A unique start protects equal timestamps, while duration and buffer create overlapping intervals with different starts. **Code evidence:** [`apps/server/src/modules/appointments/appointment.scheduling.ts`](../../apps/server/src/modules/appointments/appointment.scheduling.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.

### Q178. What should happen if queue insertion fails after appointment insertion?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** The booking transaction should roll back both records, leaving no orphan operational state. **Code evidence:** [`apps/server/src/modules/appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.

### Q179. How does stale queue reorder fail?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** The request supplies expected membership and order; the repository checks again under its queue lock and returns a conflict on change. **Code evidence:** [`apps/server/src/modules/queues/queue.service.ts`](../../apps/server/src/modules/queues/queue.service.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.

### Q180. Why is Clerk not the source of clinic permissions?

**Difficulty:** Advanced. **Topic:** architecture and product. **Short answer:** Clerk proves identity; Pravaah User role, status, and clinic membership determine application access. **Code evidence:** [`apps/server/src/modules/auth/auth.middleware.ts`](../../apps/server/src/modules/auth/auth.middleware.ts). **Follow-up:** How would you verify this against a real clinic workflow? **Common mistake:** Claiming deployment or measured impact from source alone.
