# Interview Narrative

I built Pravaah around a small-clinic operations problem: many clinics still coordinate appointments, arrivals, and queues through notebooks, phone calls, and disconnected records. I wanted the product to focus on flow, so the core path is clinic setup, doctor and patient records, appointment booking, arrival, queue handling, completion, and dashboard review.

The app is a TypeScript monorepo. The frontend is React and Vite, the backend is Express, data is stored in PostgreSQL through Prisma, validation uses Zod, and Clerk handles authentication. A key design choice is that Clerk does not own Pravaah's authorization model. Clerk tells the backend who the user is; the backend resolves the internal `User`, checks status, role, and clinic context, and then authorizes the action.

The hardest workflow is appointment booking because it is not just inserting one row. The backend checks that the clinic is active, the doctor and patient exist and belong to the clinic, takes a scoped advisory lock, checks same-time doctor conflicts, creates the appointment, creates the queue entry, calculates deterministic no-show risk, and stores the risk explanation. That made it a good place to practise service/repository separation and transactional thinking.

The queue workflow continues that theme. Staff can update queue status and manually reorder active entries for one doctor and date. The system syncs queue status back to appointment status and blocks changes away from terminal states, but it does not pretend to automate clinical decisions.

One deliberate trade-off is the no-show feature. It is deterministic and explainable rather than trained ML. That keeps the feature inspectable: reviewers can see the factors, score, reasons, and suggested actions. The limitation is that Pravaah cannot claim prediction accuracy or automatic optimization.

The current state is a `v0.3.0` release candidate pending production verification. The source implements the main reviewer workflows, but production URLs, deployed SHAs, production smoke results, and real screenshots still need owner verification before the project should be described as fully released.
