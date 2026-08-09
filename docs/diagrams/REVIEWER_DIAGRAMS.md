# Reviewer Diagrams

These diagrams summarize implementation evidence for reviewers. Use the [Workflow Atlas](../workflows/README.md) for exact traces.

## System Architecture

```mermaid
flowchart LR
    User[Admin or Staff browser user] --> Web[React + TypeScript Vite frontend]
    Web --> ClerkReact[Clerk React session]
    Web --> ApiClient[API client with bearer token]
    ApiClient --> Express[Express + TypeScript /api]
    Express --> ClerkMiddleware[Clerk Express middleware]
    ClerkMiddleware --> PravaahAuth[Pravaah auth middleware]
    PravaahAuth --> Validation[Zod validation]
    Validation --> Controller[Controller]
    Controller --> Service[Service business rules]
    Service --> Repository[Repository + Prisma]
    Repository --> Postgres[(PostgreSQL)]
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant U as Admin or Staff
    participant Web as React page
    participant API as apiClient
    participant Auth as Auth middleware
    participant Zod as Zod validation
    participant Svc as Service
    participant Repo as Repository
    participant DB as PostgreSQL

    U->>Web: Submit form or click action
    Web->>API: HTTP request with Clerk token
    API->>Auth: Bearer token
    Auth->>Auth: Resolve Clerk identity and internal User when required
    Auth->>Zod: Validate params/query/body
    Zod->>Svc: Controller calls service
    Svc->>Repo: Apply business rule
    Repo->>DB: Prisma query or transaction
    DB-->>Repo: Result
    Repo-->>Svc: Domain data
    Svc-->>Web: API response
    Web->>Web: State update, toast, redirect, or reload
```

## Authentication And Authorization

```mermaid
flowchart TD
    ClerkIdentity[Clerk authenticated identity] --> OnboardingCheck{Internal Pravaah User exists?}
    OnboardingCheck -- No --> Onboarding[Onboarding status NOT_STARTED]
    Onboarding --> Provision[Create Clinic + first ADMIN in transaction]
    Provision --> OperationalUser[ACTIVE internal User with clinicId]
    OnboardingCheck -- Yes --> StatusCheck{User ACTIVE?}
    StatusCheck -- No --> Recovery[Recovery or access denied]
    StatusCheck -- Yes --> RoleCheck{ADMIN or STAFF?}
    RoleCheck -- No --> Denied[Access denied]
    RoleCheck -- Yes --> ClinicCheck{Resource clinic matches user.clinicId?}
    ClinicCheck -- No --> Denied
    ClinicCheck -- Yes --> Action[Authorized clinic action]
```

## ER Relationships

```mermaid
erDiagram
    CLINIC ||--o{ USER : has
    CLINIC ||--o{ DOCTOR_CLINIC : links
    DOCTOR ||--o{ DOCTOR_CLINIC : belongs_through
    CLINIC ||--o{ PATIENT_CLINIC : links
    PATIENT ||--o{ PATIENT_CLINIC : belongs_through
    CLINIC ||--o{ APPOINTMENT : owns
    DOCTOR ||--o{ APPOINTMENT : attends
    PATIENT ||--o{ APPOINTMENT : books
    USER ||--o{ APPOINTMENT : creates
    APPOINTMENT ||--o| QUEUE_ENTRY : has
    APPOINTMENT ||--o| NO_SHOW_PREDICTION : has
    CLINIC ||--o{ QUEUE_ENTRY : owns
    DOCTOR ||--o{ QUEUE_ENTRY : serves
    PATIENT ||--o{ QUEUE_ENTRY : waits
    CLINIC ||--o{ NO_SHOW_PREDICTION : owns
    PATIENT ||--o{ NO_SHOW_PREDICTION : receives
```

## Appointment Lifecycle

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED: booking creates appointment
    SCHEDULED --> CONFIRMED
    SCHEDULED --> ARRIVED
    SCHEDULED --> IN_QUEUE
    CONFIRMED --> ARRIVED
    CONFIRMED --> IN_QUEUE
    ARRIVED --> IN_QUEUE
    IN_QUEUE --> CALLED
    CALLED --> COMPLETED
    SCHEDULED --> CANCELLED
    CONFIRMED --> CANCELLED
    ARRIVED --> CANCELLED
    IN_QUEUE --> CANCELLED
    CALLED --> CANCELLED
    SCHEDULED --> NO_SHOW
    CONFIRMED --> NO_SHOW
    ARRIVED --> NO_SHOW
    IN_QUEUE --> NO_SHOW
    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

Note: frontend actions guide the natural path. Backend enforcement currently blocks changes away from final states but does not enforce this full transition matrix for every state pair.

## Queue Lifecycle

```mermaid
stateDiagram-v2
    [*] --> WAITING: appointment booking creates queue entry
    WAITING --> ARRIVED
    ARRIVED --> WAITING
    WAITING --> CALLED
    ARRIVED --> CALLED
    CALLED --> COMPLETED
    WAITING --> CANCELLED
    ARRIVED --> CANCELLED
    CALLED --> CANCELLED
    WAITING --> NO_SHOW
    ARRIVED --> NO_SHOW
    CALLED --> NO_SHOW
    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

Terminal queue entries cannot be updated or reordered.

## Queue Reorder

```mermaid
flowchart TD
    Request[PATCH /api/clinics/:clinicId/queue/reorder] --> Auth[Authenticate + verify clinic access]
    Auth --> Duplicates{Duplicate IDs?}
    Duplicates -- Yes --> RejectDuplicate[400 duplicate entry]
    Duplicates -- No --> Fetch[Fetch requested queue entries]
    Fetch --> Scope{All same clinic, one doctor, active, same date?}
    Scope -- No --> RejectScope[400/403/409 scope error]
    Scope -- Yes --> Complete{All active entries included?}
    Complete -- No --> RejectIncomplete[400 incomplete reorder]
    Complete -- Yes --> Tx[Transaction + advisory doctor/date lock]
    Tx --> Temp[Move entries to temporary high positions]
    Temp --> Final[Write final 1-based positions]
    Final --> Response[Return ordered queue entries]
```

## No-Show Risk

```mermaid
flowchart TD
    Appointment[Appointment context] --> Factors[Rule inputs]
    PatientHistory[PatientClinic history] --> Factors
    Factors --> Rules[starter-rule-v1 deterministic scoring]
    Rules --> Score[0-100 score]
    Score --> Level{Risk level}
    Level --> Low[LOW]
    Level --> Medium[MEDIUM]
    Level --> High[HIGH]
    Rules --> Reasons[Human-readable reasons]
    Rules --> Actions[Suggested manual actions]
    Score --> Store[Store NoShowPrediction]
    Reasons --> UI[Appointment / queue / dashboard UI]
    Actions --> UI
```

## Deployment Architecture

```mermaid
flowchart LR
    Browser[Browser] --> Frontend[Frontend static host]
    Frontend --> Clerk[Clerk]
    Frontend --> API[Express API host]
    API --> Clerk
    API --> Postgres[(PostgreSQL database)]
```

Repository evidence: the frontend has [Vercel SPA rewrite config](../../apps/web/vercel.json); backend deployment is documented for a Node host such as Render; PostgreSQL and Clerk are required by env examples. Production URLs and deployed SHAs are not committed.

## Documentation Navigation

```mermaid
flowchart TD
    Readme[Root README] --> Reviewer[docs/reviewer]
    Reviewer --> Status[Project Status]
    Reviewer --> Evidence[Technical Evidence Map]
    Reviewer --> Demo[Demo Guide]
    Reviewer --> Limits[Known Limitations]
    Reviewer --> CaseStudy[Product Case Study]
    Readme --> DocsIndex[docs/README.md]
    DocsIndex --> PRD[PRD]
    DocsIndex --> HLD[HLD]
    DocsIndex --> LLD[LLD]
    PRD --> Atlas[Workflow Atlas]
    HLD --> Atlas
    LLD --> Atlas
    Atlas --> Score[Project Score Pack]
    Reviewer --> Release[Release Notes and Checklist]
```
