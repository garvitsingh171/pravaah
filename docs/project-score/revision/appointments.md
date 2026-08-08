# Appointment Revision

Trace:

```text
/appointments
  -> AppointmentBookingForm.handleSubmit
  -> appointmentApi.createAppointment
  -> POST /api/clinics/:clinicId/appointments
  -> authenticateRequest
  -> validateRequest
  -> requireClinicAccess
  -> requireClinicStaffRole
  -> createAppointmentController
  -> appointmentService.createAppointment
  -> validate doctor/patient clinic links
  -> transaction
  -> advisory slot lock
  -> conflict check
  -> create Appointment
  -> create QueueEntry
  -> create NoShowPrediction
  -> response and UI update
```

Strong answer: appointment booking is the best proof of real workflow engineering.

Limitations: conflict is exact doctor/time; no strict duration-overlap check; status lifecycle has final-state protection but broad non-final transitions.
