# Patient-to-Clinic Routing (#267)

Pravaah derives travel enrichment from trusted backend coordinates:

```text
structured address → Geoapify Forward Geocoding → coordinates
Patient coordinates + Clinic coordinates
    → Geoapify Routing, Patient → Clinic
    → PatientClinic.distanceFromClinicKm
    → PatientClinic.estimatedTravelTimeMinutes
```

Routing uses the server-only `GEOAPIFY_API_KEY`, `mode=drive`,
`type=balanced`, `traffic=free_flow`, `units=metric`, and a five-second
timeout. Provider distance is converted with `meters / 1000` and fixed to two
decimal places; travel time is `Math.ceil(seconds / 60)`. Zero values are valid.
No route geometry, live traffic, map, or navigation data is stored.

An attempt is eligible only when both entities have `geocodingStatus=GEOCODED`
and valid persisted coordinates. The source fingerprint normalizes every
coordinate with `toFixed(6)` and includes Patient coordinates, Clinic
coordinates, mode, route type, and traffic model. Every request also receives
a random `routingAttemptId`. Success and failure writes require both values,
so stale and same-source concurrent attempts cannot overwrite current state.

Provider calls happen after the core Patient/Clinic transaction commits and
never inside a Prisma transaction. Automatic routing is best-effort: missing
configuration or coordinates does not block Patient creation, Patient updates,
Clinic updates, appointments, queues, or reads. An actual provider failure is
stored as `FAILED`; an explicit retry uses:

```text
POST /api/clinics/:clinicId/patients/:patientId/route
{}
```

Only active Admin/Staff users with access to the Clinic and PatientClinic link
may use it. Read endpoints never call Routing. Existing manual distances are
preserved as legacy values while `routingStatus=NOT_CALCULATED`; once an
automatic attempt begins, that row's old distance is cleared and a failed
attempt does not fall back to it.

Patient coordinate changes invalidate all routed PatientClinic rows and
recalculate only the current Clinic relationship. Clinic coordinate changes
bulk-invalidate related routes and intentionally do not mass-reroute. If
coordinates normalize to the same six-decimal values, existing routes remain
current.

Prediction thresholds, scores, reason codes, model version, and appointment
booking behavior are unchanged. Travel time is not a prediction input.
