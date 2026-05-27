# Contributing to Pravaah

Welcome to **Pravaah**.

This document explains how we will work on this project in a clean, professional, and organized way.

Pravaah is not only a project. It is also a serious engineering practice project.  
So we will treat it like a real product repository.

This guide explains:

- How to create issues
- How to write good issue descriptions
- How to use labels
- How to use milestones
- How to use GitHub Project board
- How to create branches
- How to write commits
- How to raise pull requests
- How to review work before merging
- How to keep code clean
- How to avoid messy GitHub habits

---

## 1. Purpose of This Guide

The purpose of this file is to make sure that every task in Pravaah is:

- Clear
- Small
- Trackable
- Reviewable
- Easy to understand later
- Connected to the correct milestone and project board
- Completed with proper Git and GitHub workflow

This guide should be followed for every feature, bug fix, documentation update, setup task, research task, and refactor.

---

## 2. Basic Rule

Before writing code, always ask:

```txt
What exactly am I trying to complete?
````

Every piece of work should have:

- An issue
- A branch
- One clear purpose
- A pull request
- A checklist before merge

Do not randomly write code directly on the `main` branch.

---

## 3. Repository Workflow

The basic workflow is:

```txt
Create Issue
   ↓
Assign Label + Milestone + Project Status
   ↓
Create Branch from Issue
   ↓
Do Work Locally
   ↓
Commit Changes
   ↓
Push Branch
   ↓
Open Pull Request
   ↓
Review Checklist
   ↓
Merge
   ↓
Close Issue
```

---

## 4. Branch Rules

### 4.1 Main Branch

The `main` branch should always stay clean and stable.

Do not directly commit to `main`.

Wrong:

```bash
git add .
git commit -m "added stuff"
git push origin main
```

Correct:

```bash
git checkout -b feature/patient-registration
git add .
git commit -m "feat: add patient registration form"
git push origin feature/patient-registration
```

Then create a pull request on GitHub.

---

## 5. Branch Naming Convention

Every branch name should clearly explain the work.

Use lowercase letters.

Use hyphens `-` between words.

Do not use spaces.

---

### 5.1 Branch Name Format

```txt
type/short-description
```

Examples:

```txt
feature/patient-registration
bugfix/fix-login-error
docs/add-api-planning-notes
setup/configure-prisma
research/supabase-auth-strategy
refactor/clean-dashboard-components
test/add-auth-flow-tests
```

---

### 5.2 Branch Types

Use these branch types:

| Type        | Use For                                  |
| ----------- | ---------------------------------------- |
| `feature/`  | New feature work                         |
| `bugfix/`   | Fixing bugs                              |
| `docs/`     | Documentation work                       |
| `setup/`    | Project setup, config, tooling           |
| `research/` | Technical research and decision work     |
| `refactor/` | Improving code without changing behavior |
| `test/`     | Adding or updating tests                 |
| `chore/`    | Small maintenance tasks                  |

---

### 5.3 Good Branch Names

Good:

```txt
feature/create-patient-model
feature/add-appointment-api
bugfix/fix-dashboard-loading-state
docs/update-readme-setup-guide
setup/add-prisma-config
research/finalize-auth-strategy
```

Bad:

```txt
new
changes
final
mybranch
test123
work
garvit-code
```

A branch name should make sense even after 2 months.

---

## 6. Commit Message Rules

Commit messages should be small and meaningful.

A commit message should explain what changed.

---

## 6.1 Commit Format

Use this format:

```txt
type: short message
```

Examples:

```txt
feat: add patient registration schema
fix: handle empty appointment list
docs: add local setup guide
setup: configure prisma client
refactor: simplify dashboard layout
test: add auth route test cases
chore: update gitignore
```

---

## 6.2 Commit Types

| Type       | Meaning                                   |
| ---------- | ----------------------------------------- |
| `feat`     | A new feature                             |
| `fix`      | A bug fix                                 |
| `docs`     | Documentation only                        |
| `setup`    | Project setup or configuration            |
| `refactor` | Code improvement without behavior change  |
| `test`     | Adding or updating tests                  |
| `chore`    | Small maintenance work                    |
| `style`    | Formatting, spacing, linting only         |
| `research` | Research notes or technical decision docs |

---

## 6.3 Good Commit Messages

Good:

```txt
feat: add patient model to prisma schema
fix: validate missing email during login
docs: add api planning notes
setup: add eslint config
refactor: move auth logic to service layer
```

Bad:

```txt
done
update
changes
final
fixed
code
wip
asdf
```

---

## 6.4 Commit Size Rule

One commit should represent one meaningful change.

Avoid doing this:

```txt
feat: add auth, dashboard, database, docs, navbar and footer
```

Better:

```txt
setup: configure prisma
feat: add user model
feat: add login route
docs: document auth flow
```

Small commits are easier to debug and review.

---

## 7. Issue Creation Guidelines

An issue is a clear task.

Every issue should answer:

```txt
What needs to be done?
Why is it needed?
What is included?
What is not included?
How will we know it is complete?
```

---

## 8. Issue Title Format

Use this format:

```txt
[Type] Short clear title
```

Examples:

```txt
[Setup] Configure Prisma with Supabase database
[Feature] Add patient registration API
[Bug] Fix login error when email is missing
[Docs] Create local development setup guide
[Research] Finalize Supabase Auth strategy
[Refactor] Clean appointment service structure
[Test] Add tests for patient creation API
```

---

## 9. Issue Types

Use the correct issue type.

| Type         | Use When                                        |
| ------------ | ----------------------------------------------- |
| `[Setup]`    | Setting up tools, repo, config, GitHub workflow |
| `[Feature]`  | Adding a new product feature                    |
| `[Bug]`      | Fixing broken behavior                          |
| `[Docs]`     | Creating or updating documentation              |
| `[Research]` | Exploring and deciding technical approach       |
| `[Refactor]` | Improving existing code structure               |
| `[Test]`     | Adding or improving tests                       |
| `[Chore]`    | Small non-feature maintenance task              |

---

## 10. Labels

Labels help us understand what kind of work an issue contains.

Each issue should usually have:

- One `type:` label
- One or more `area:` labels
- One `priority:` label
- One `difficulty:` label

---

## 10.1 Type Labels

Use one of these:

```txt
type: setup
type: feature
type: bug
type: docs
type: research
type: refactor
type: test
type: chore
```

---

## 10.2 Area Labels

Use one or more of these:

```txt
area: planning
area: frontend
area: backend
area: database
area: auth
area: ai
area: ui
area: docs
area: testing
area: deployment
area: github
```

Examples:

A dashboard UI task:

```txt
type: feature
area: frontend
area: ui
priority: medium
difficulty: medium
```

A Prisma schema task:

```txt
type: setup
area: backend
area: database
priority: high
difficulty: medium
```

An auth bug:

```txt
type: bug
area: auth
area: backend
priority: high
difficulty: medium
```

---

## 10.3 Priority Labels

Use one priority label:

```txt
priority: low
priority: medium
priority: high
priority: critical
```

### Priority Meaning

| Priority             | Meaning                                 |
| -------------------- | --------------------------------------- |
| `priority: low`      | Nice to have, not urgent                |
| `priority: medium`   | Important, but not blocking immediately |
| `priority: high`     | Very important for current sprint       |
| `priority: critical` | Blocking development or core user flow  |

Do not mark everything as high priority.

If everything is high priority, then nothing is high priority.

---

## 10.4 Difficulty Labels

Use one difficulty label:

```txt
difficulty: easy
difficulty: medium
difficulty: hard
```

### Difficulty Meaning

| Difficulty           | Meaning                                   |
| -------------------- | ----------------------------------------- |
| `difficulty: easy`   | Clear task, low risk                      |
| `difficulty: medium` | Needs thinking and careful implementation |
| `difficulty: hard`   | Complex, uncertain, or affects many parts |

---

## 11. Milestones

Milestones represent sprint goals.

Each issue should be attached to the correct milestone.

Example milestones:

```txt
Sprint 0 - Planning and Setup
Sprint 1 - Core Backend Foundation
Sprint 2 - Auth and Core Flows
Sprint 3 - Dashboard and Main UI
Sprint 4 - AI Logic and Integrations
Sprint 5 - Testing and Polish
Sprint 6 - Deployment and Final Review
```

---

## 11.1 Milestone Rules

Use milestones to answer:

```txt
In which sprint should this issue be completed?
```

Do not put future features into the current sprint unless they are truly required.

Do not overload one sprint with too many issues.

A sprint should be challenging but realistic.

---

## 12. GitHub Project Board

The GitHub Project board is used to track execution.

Every active issue should be added to the Project board.

---

## 12.1 Recommended Project Status Columns

Use these statuses:

```txt
Backlog
Ready
In Progress
In Review
Blocked
Done
```

---

## 12.2 Meaning of Each Status

| Status        | Meaning                                           |
| ------------- | ------------------------------------------------- |
| `Backlog`     | Idea or task exists, but not ready to work on yet |
| `Ready`       | Issue is clear and can be picked up               |
| `In Progress` | Someone is actively working on it                 |
| `In Review`   | Pull request is created and waiting for review    |
| `Blocked`     | Cannot continue because something is missing      |
| `Done`        | Work is completed and merged                      |

---

## 12.3 How to Move Issues

When an issue is created but not ready:

```txt
Backlog
```

When description, labels, milestone, and acceptance criteria are complete:

```txt
Ready
```

When work starts:

```txt
In Progress
```

When PR is opened:

```txt
In Review
```

When merged:

```txt
Done
```

If stuck:

```txt
Blocked
```

Also add a comment explaining why it is blocked.

Example:

```md
Blocked because Supabase environment variables are not available yet.
```

---

## 13. Issue Templates

Use the following templates depending on the type of task.

---

## 14. Feature Issue Template

Use this for new product features.

```md
## Overview

Explain the feature in simple words.

Example:
This feature will allow clinic staff to create a new patient record from the dashboard.

---

## Problem

Explain why this feature is needed.

Example:
Currently, there is no way to add patient details into the system. Without this feature, the clinic cannot manage patient data.

---

## Goal

The goal of this issue is to build the basic version of this feature for the MVP.

---

## Scope

This issue includes:

- [ ] Add form fields for required patient details
- [ ] Validate required fields
- [ ] Submit data to backend API
- [ ] Show success and error states

---

## Out of Scope

This issue does not include:

- Advanced filtering
- Analytics
- Exporting patient data
- Role-based permissions unless mentioned separately

---

## Technical Notes

Mention useful implementation details here.

Example:

- Use React Hook Form if form complexity increases
- Use existing API client helper
- Keep UI simple for MVP
- Follow existing component naming conventions

---

## Acceptance Criteria

This issue is complete when:

- [ ] User can fill the required fields
- [ ] User can submit the form successfully
- [ ] Empty required fields show validation errors
- [ ] API errors are shown clearly
- [ ] Code is clean and easy to understand
- [ ] Pull request is created and linked to this issue

---

## Screenshots / References

Add screenshots, wireframes, links, or notes here if available.

---

## Labels

Suggested labels:

- `type: feature`
- `area: frontend`
- `area: backend`
- `priority: medium`
- `difficulty: medium`
```

---

## 15. Bug Issue Template

Use this when something is broken.

```md
## Bug Summary

Explain the bug in one or two lines.

Example:
Login fails with a server error when the email field is empty.

---

## Expected Behavior

Explain what should happen.

Example:
The user should see a clear validation message saying email is required.

---

## Actual Behavior

Explain what is actually happening.

Example:
The backend returns a 500 server error.

---

## Steps to Reproduce

Write exact steps.

1. Go to login page
2. Leave email field empty
3. Enter any password
4. Click login
5. See server error

---

## Impact

Explain how serious the bug is.

Example:
This affects the login flow and can confuse users.

---

## Possible Cause

Write a guess only if you have one.

Example:
Backend validation may be missing before calling the auth service.

---

## Fix Scope

This issue includes:

- [ ] Add validation for missing email
- [ ] Return proper 400 response from backend
- [ ] Show useful error message on frontend if needed

---

## Acceptance Criteria

This bug is fixed when:

- [ ] Empty email does not cause server error
- [ ] User receives a clear validation message
- [ ] Backend returns correct status code
- [ ] Existing login behavior still works
- [ ] Pull request is created and linked to this issue

---

## Screenshots / Logs

Paste screenshots, terminal logs, browser console errors, or API responses here.

---

## Labels

Suggested labels:

- `type: bug`
- `area: backend`
- `area: auth`
- `priority: high`
- `difficulty: medium`
```

---

## 16. Documentation Issue Template

Use this for README, guides, notes, architecture docs, API docs, or planning files.

````md
## Overview

Explain what documentation needs to be created or updated.

Example:
Create a local development setup guide so the project can be installed and run easily.

---

## Why This Is Needed

Explain why this documentation matters.

Example:
Without setup documentation, future contributors may not know how to run the project locally.

---

## Scope

This issue includes:

- [ ] Create or update the documentation file
- [ ] Add clear headings
- [ ] Add step-by-step instructions
- [ ] Add useful examples
- [ ] Check formatting

---

## File Location

Mention where the file should be placed.

Example:

```txt
docs/SETUP.md
````

---

## Suggested Sections

Add planned sections.

Example:

- Prerequisites
- Installation
- Environment variables
- Running frontend
- Running backend
- Common errors
- Troubleshooting

---

## Acceptance Criteria

This issue is complete when:

- [ ] Documentation file exists
- [ ] Instructions are clear
- [ ] Formatting is clean
- [ ] Examples are correct
- [ ] Pull request is created and linked to this issue

---

## Labels

Suggested labels:

- `type: docs`
- `area: docs`
- `priority: medium`
- `difficulty: easy`

---

## 17. Setup Issue Template

Use this for repository setup, config, tooling, GitHub Project setup, Prisma setup, ESLint setup, etc.

```md
## Overview

Explain what setup work needs to be done.

Example:
Configure Prisma in the backend so the project can connect with the Supabase PostgreSQL database.

---

## Why This Is Needed

Explain why this setup is important.

Example:
Without Prisma setup, the backend cannot define models, run migrations, or safely interact with the database.

---

## Scope

This issue includes:

- [ ] Install required packages
- [ ] Add required config files
- [ ] Add environment variable examples
- [ ] Verify setup works locally
- [ ] Update documentation if needed

---

## Out of Scope

This issue does not include:

- Building full features
- Creating unrelated UI
- Adding non-required tools

---

## Technical Notes

Mention important commands, docs, or decisions.

Example:

```bash
npm install prisma @prisma/client
npx prisma init
````

---

## Acceptance Criterias

This issue is complete when:

- [ ] Required setup files exist
- [ ] Project runs without setup errors
- [ ] Configuration is documented
- [ ] No secret keys are committed
- [ ] Pull request is created and linked to this issue

---

## Label

Suggested labels:

- `type: setup`
- `area: backend`
- `area: database`
- `priority: high`
- `difficulty: medium`

---

## 18. Research Issue Template

Use this when a decision needs to be made before coding.

Research issues are not for endless learning.  
They must end with a clear decision.

```md
## Overview

Explain what needs to be researched.

Example:
Finalize the best way to use Supabase Auth with the Pravaah backend and frontend.

---

## Research Questions

Answer these questions:

- What options are available?
- Which option is best for MVP?
- What are the tradeoffs?
- What can be added later?
- What should be avoided for now?

---

## Options Considered

### Option 1

Explain option 1.

Pros:

- 
- 

Cons:

- 
- 

### Option 2

Explain option 2.

Pros:

- 
- 

Cons:

- 
- 

---

## Final Decision

Write the final chosen approach.

Example:
For MVP, we will use Supabase Auth on the frontend and verify authenticated user sessions before calling protected backend routes.

---

## Reason for Decision

Explain why this option was chosen.

Example:
This approach is fast to build, works well with Supabase, and avoids building custom auth from scratch.

---

## Implementation Notes

Mention how this decision will affect development.

Example:

- Auth routes will be protected
- User ID will come from Supabase session
- Backend should not trust frontend blindly
- Role management can be added later

---

## Acceptance Criteria

This issue is complete when:

- [ ] Research questions are answered
- [ ] Options are compared
- [ ] Final decision is written clearly
- [ ] Decision is practical for MVP
- [ ] Follow-up implementation issues are created if needed

---

## Labels

Suggested labels:

- `type: research`
- `area: auth`
- `priority: high`
- `difficulty: medium`
````

---

## 19. Refactor Issue Template

Use this when improving code structure without changing user-facing behavior.

```md
## Overview

Explain what code needs to be improved.

Example:
Refactor appointment service logic to make it easier to read and maintain.

---

## Why This Is Needed

Explain the problem with the current code.

Example:
The current controller contains too much business logic. Moving logic into a service will make the code cleaner.

---

## Scope

This issue includes:

- [ ] Move logic to correct files
- [ ] Rename confusing variables if needed
- [ ] Remove duplicate code
- [ ] Keep behavior the same
- [ ] Verify existing flow still works

---

## Out of Scope

This issue does not include:

- Adding new features
- Changing UI behavior
- Changing database schema unless required

---

## Acceptance Criteria

This issue is complete when:

- [ ] Code is cleaner
- [ ] Existing behavior still works
- [ ] No unrelated changes are included
- [ ] Pull request explains what was refactored
- [ ] Pull request is linked to this issue

---

## Labels

Suggested labels:

- `type: refactor`
- `area: backend`
- `priority: medium`
- `difficulty: medium`
```

---

## 20. Test Issue Template

Use this for adding or improving tests.

```md
## Overview

Explain what needs to be tested.

Example:
Add tests for patient creation API.

---

## Test Scope

This issue includes testing:

- [ ] Successful case
- [ ] Missing required fields
- [ ] Invalid input
- [ ] Unauthorized access if applicable
- [ ] Error response format

---

## Why This Is Needed

Explain why these tests matter.

Example:
Patient creation is a core MVP flow. Tests help prevent breaking this flow during future changes.

---

## Acceptance Criteria

This issue is complete when:

- [ ] Required tests are added
- [ ] Tests pass locally
- [ ] Important edge cases are covered
- [ ] Test names are readable
- [ ] Pull request is linked to this issue

---

## Labels

Suggested labels:

- `type: test`
- `area: testing`
- `priority: medium`
- `difficulty: medium`
```

---

## 21. Pull Request Guidelines

A pull request is a request to merge your branch into `main`.

Every PR should be small and focused.

One PR should solve one issue or one clear group of related issues.

---

## 22. Pull Request Title Format

Use this format:

```txt
type: short clear summary
```

Examples:

```txt
setup: configure prisma with supabase
feat: add patient registration API
fix: handle missing email during login
docs: add local setup guide
refactor: clean dashboard component structure
```

---

## 23. Pull Request Template

Use this template when raising a PR.

````md
## Summary

Explain what this PR does in simple words.

Example:
This PR adds the initial Prisma setup and connects the backend to the Supabase PostgreSQL database.

---

## Related Issue

Closes #issue_number

Example:

Closes #12

---

## Changes Made

- 
- 
- 

---

## Type of Change

Select one:

- [ ] Feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Setup / configuration
- [ ] Refactor
- [ ] Test
- [ ] Chore

---

## Area Affected

Select all that apply:

- [ ] Frontend
- [ ] Backend
- [ ] Database
- [ ] Auth
- [ ] AI
- [ ] UI
- [ ] Docs
- [ ] Testing
- [ ] Deployment
- [ ] GitHub workflow

---

## How I Tested This

Explain how you checked that the changes work.

Example:

- Ran the backend locally
- Tested API using Postman
- Checked frontend page in browser
- Verified Prisma client generation
- Reviewed markdown preview

---

## Screenshots / Videos

Add screenshots or videos if UI changes are included.

If not applicable, write:

```txt
Not applicable.
````

---

## Checklist Before Review

- [ ] I worked on a separate branch, not directly on `main`
- [ ] My branch name follows the project convention
- [ ] My commit messages are clear
- [ ] I have linked the related issue
- [ ] I have tested my changes locally
- [ ] I have not committed secret keys or `.env` files
- [ ] I have removed unnecessary console logs
- [ ] I have removed unused code
- [ ] I have updated documentation if needed
- [ ] My PR solves the issue scope only
- [ ] I have not added unrelated changes

---

## Notes for Reviewer

Mention anything the reviewer should pay attention to.

Example:
Please check the environment variable naming and Prisma setup flow.

---

## 24. How to Link PR to Issue

In the PR description, write:

```txt
Closes #12
```

or

```txt
Fixes #12
```

When the PR is merged, GitHub will automatically close the issue.

Use:

```txt
Closes #issue_number
```

Example:

```txt
Closes #7
```

---

## 25. Working With Git Locally

### 25.1 Check Current Branch

```bash
git branch
```

The current branch will have a `*`.

Example:

```txt
* feature/patient-registration
  main
```

---

## 25.2 Pull Latest Main

Before starting new work, always update your local `main`.

```bash
git checkout main
git pull origin main
```

---

## 25.3 Create New Branch

```bash
git checkout -b feature/patient-registration
```

---

## 25.4 Check Changed Files

```bash
git status
```

---

## 25.5 See File Differences

```bash
git diff
```

---

## 25.6 Add Files

Add all changes:

```bash
git add .
```

Add one file:

```bash
git add path/to/file
```

Example:

```bash
git add backend/src/routes/patient.routes.ts
```

---

## 25.7 Commit Changes

```bash
git commit -m "feat: add patient registration route"
```

---

## 25.8 Push Branch

```bash
git push origin feature/patient-registration
```

---

## 25.9 Open Pull Request

After pushing, GitHub will usually show a button:

```txt
Compare & pull request
```

Click it and fill the PR template.

---

## 26. Safe Git Workflow

Use this flow every time:

```bash
git checkout main
git pull origin main
git checkout -b type/short-task-name
# do your work
git status
git add .
git commit -m "type: useful message"
git push origin type/short-task-name
```

Then open PR on GitHub.

---

## 27. What Not To Do in Git

Do not commit directly to `main`.

Do not commit `.env`.

Do not commit `node_modules`.

Do not commit random temporary files.

Do not make one huge commit for many unrelated tasks.

Do not use unclear commit messages.

Do not push broken code knowingly.

Do not force push unless you clearly understand the effect.

Avoid:

```bash
git push --force
```

---

## 28. Environment Variables

Secret values must never be committed.

Wrong:

```txt
SUPABASE_SERVICE_ROLE_KEY=real-secret-key-here
DATABASE_URL=real-database-url
```

Correct:

Create `.env.example`:

```txt
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Actual values should stay in local `.env`.

---

## 28.1 Required Rule

Commit this:

```txt
.env.example
```

Do not commit this:

```txt
.env
```

Make sure `.gitignore` includes:

```txt
.env
node_modules
dist
build
```

---

## 29. Code Hygiene Rules

Code hygiene means keeping code clean, readable, and maintainable.

Write code as if another developer will read it tomorrow.

That future developer may be you.

---

## 29.1 General Code Rules

- Use meaningful variable names
- Keep functions small
- Avoid duplicate code
- Remove unused imports
- Remove unused variables
- Avoid unnecessary comments
- Add comments only when logic is not obvious
- Keep files organized
- Do not mix unrelated logic in one file
- Handle errors properly
- Validate user input
- Keep formatting consistent

---

## 29.2 Good Variable Names

Good:

```ts
const patientEmail = req.body.email;
const appointmentDate = req.body.date;
const clinicId = req.user.clinicId;
```

Bad:

```ts
const x = req.body.email;
const data = req.body.date;
const thing = req.user.clinicId;
```

---

## 29.3 Good Function Names

Good:

```ts
createPatient()
getAppointmentsByClinic()
validateLoginInput()
calculateQueuePrediction()
```

Bad:

```ts
doThing()
handleData()
process()
run()
abc()
```

---

## 30. Frontend Code Guidelines

Frontend code should be simple, reusable, and clean.

---

## 30.1 Component Rules

- One component should have one clear job
- Reusable components should go in a shared components folder
- Page-specific components should stay near that page if needed
- Keep component names in PascalCase

Good:

```txt
PatientForm.tsx
AppointmentCard.tsx
DashboardSidebar.tsx
QueueStatusBadge.tsx
```

Bad:

```txt
form.tsx
card.tsx
test.tsx
newComponent.tsx
```

---

## 30.2 UI Rules

- Keep the MVP UI simple
- Prioritize clarity over decoration
- Use consistent spacing
- Use consistent buttons
- Use consistent form styles
- Show loading states
- Show error states
- Show empty states

Every important screen should answer:

```txt
What is happening?
What can the user do next?
What went wrong if there is an error?
```

---

## 30.3 Frontend Folder Example

Example structure:

```txt
frontend/
  src/
    components/
      common/
      layout/
      forms/
    pages/
    routes/
    hooks/
    services/
    lib/
    types/
    context/
```

---

## 31. Backend Code Guidelines

Backend code should be organized and predictable.

Do not put everything in one file.

---

## 31.1 Recommended Backend Structure

Example:

```txt
backend/
  src/
    config/
    controllers/
    services/
    routes/
    middlewares/
    validators/
    utils/
    types/
    prisma/
    app.ts
    server.ts
```

---

## 31.2 Backend Layer Rules

### Routes

Routes define the API path.

Example:

```txt
POST /api/patients
GET /api/patients
```

Routes should not contain business logic.

---

### Controllers

Controllers handle request and response.

They should:

- Read request data
- Call service functions
- Send response

They should not contain heavy business logic.

---

### Services

Services contain business logic.

They should:

- Validate important rules
- Talk to database layer or Prisma
- Return useful data to controller

---

### Middlewares

Middlewares handle things that happen before controller.

Examples:

- Auth check
- Error handling
- Request logging
- Validation

---

## 31.3 Backend Rules

- Always validate input
- Always handle errors
- Do not expose secret information
- Do not trust frontend blindly
- Return clear status codes
- Keep response format consistent
- Keep business logic out of route files

---

## 32. API Response Guidelines

Try to keep API responses consistent.

Example success response:

```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "id": "patient_id"
  }
}
```

Example error response:

```json
{
  "success": false,
  "message": "Email is required",
  "error": "VALIDATION_ERROR"
}
```

---

## 33. HTTP Status Code Guidelines

Use correct status codes.

| Status | Meaning                         |
| ------ | ------------------------------- |
| `200`  | Success                         |
| `201`  | Created successfully            |
| `400`  | Bad request or validation error |
| `401`  | Not authenticated               |
| `403`  | Not allowed                     |
| `404`  | Not found                       |
| `409`  | Conflict, duplicate data        |
| `500`  | Server error                    |

Do not return `200` for errors.

---

## 34. Database Guidelines

Database changes should be planned carefully.

---

## 34.1 Prisma Rules

- Keep model names clear
- Use proper relations
- Add required fields carefully
- Think before making fields optional
- Use migrations properly
- Do not manually edit migration files unless necessary
- Keep schema readable

---

## 34.2 Database Naming

Good model names:

```prisma
User
Clinic
Patient
Appointment
Prediction
```

Good field names:

```prisma
firstName
lastName
phoneNumber
appointmentDate
createdAt
updatedAt
```

Avoid unclear names:

```prisma
data
info
thing
value
abc
```

---

## 35. Documentation Hygiene

Documentation should be useful, not decorative.

Write docs that help you build, debug, or explain the project.

Good docs answer:

```txt
What is this?
Why does it exist?
How do I use it?
What decision was made?
What should I avoid?
```

---

## 35.1 Recommended Docs Structure

```txt
docs/
  MVP_SCOPE.md
  ARCHITECTURE.md
  SETUP.md
  API_PLAN.md
  DATABASE_DESIGN.md
  AUTH_STRATEGY.md
  AI_LOGIC.md
  DAILY_LOG.md
```

---

## 35.2 Documentation Rules

- Use clear headings
- Use short paragraphs
- Use checklists where helpful
- Add examples
- Keep docs updated when decisions change
- Do not write huge theory unless needed
- Prefer practical notes over textbook explanations

---

## 36. Pull Request Review Checklist

Before merging any PR, check:

```md
- [ ] Does this PR solve the linked issue?
- [ ] Is the scope controlled?
- [ ] Are there unrelated changes?
- [ ] Is the code readable?
- [ ] Are names clear?
- [ ] Are errors handled?
- [ ] Are required docs updated?
- [ ] Was this tested locally?
- [ ] Are there any secrets committed?
- [ ] Is the branch name correct?
- [ ] Are commits understandable?
```

---

## 37. Definition of Done

An issue is done only when:

- The required work is completed
- Code or docs are pushed
- PR is opened
- PR checklist is completed
- PR is merged
- Issue is closed
- Project board status is moved to `Done`

Do not mark an issue done just because coding is finished.

Coding finished does not always mean task finished.

---

## 38. Handling Blockers

If blocked, do not silently stop.

Move issue to:

```txt
Blocked
```

Then comment on the issue.

Use this format:

```md
## Blocker

I am blocked because:

- 

## What I Tried

- 
- 

## What I Need

- 
```

Example:

```md
## Blocker

I am blocked because the Supabase database URL is not configured yet.

## What I Tried

- Checked `.env`
- Checked Supabase project settings
- Tried running Prisma migration

## What I Need

- Correct `DATABASE_URL` value
```

---

## 39. Daily Work Habit

At the start of work:

```txt
1. Open GitHub Project board
2. Pick one Ready issue
3. Move it to In Progress
4. Create branch
5. Work locally
```

At the end of work:

```txt
1. Check git status
2. Commit meaningful changes
3. Push branch
4. Open or update PR if ready
5. Update issue comment if needed
6. Update project board status
```

---

## 40. Daily Log Format

Use this format in `docs/DAILY_LOG.md`.

```md
# Daily Log

## YYYY-MM-DD

### Work Completed

- 

### Issues Worked On

- #

### Decisions Made

- 

### Blockers

- 

### Learnings

- 

### Next Focus

- 
```

Example:

```md
## 2026-05-24

### Work Completed

- Created initial labels and milestones
- Created GitHub Project board
- Added contribution guidelines

### Issues Worked On

- #1
- #2

### Decisions Made

- Use `CONTRIBUTING.md` as the main contribution guide
- Use feature branches instead of direct commits to main

### Blockers

- None

### Learnings

- Learned how GitHub milestones and project board statuses work

### Next Focus

- Finalize backend architecture decisions
```

---

## 41. README Update Rule

Whenever a major setup, command, or architecture decision changes, check whether README or docs need updates.

Examples:

If you add Prisma:

```txt
Update setup docs
```

If you add backend run command:

```txt
Update README
```

If you add new environment variable:

```txt
Update .env.example
```

If you change folder structure:

```txt
Update architecture docs
```

---

## 42. GitHub Issue Comment Updates

For longer tasks, add progress comments.

Example:

```md
## Progress Update

Completed:

- Created Prisma schema draft
- Added initial User and Clinic models

Pending:

- Add Patient and Appointment models
- Test migration locally
```

This helps track work clearly.

---

## 43. File Naming Rules

Use clear file names.

Good:

```txt
AUTH_STRATEGY.md
DATABASE_DESIGN.md
API_PLAN.md
SETUP.md
patient.controller.ts
appointment.service.ts
DashboardLayout.tsx
```

Bad:

```txt
notes.md
new.md
final.md
test.ts
abc.tsx
rough.md
```

---

## 44. Folder Hygiene

Keep related files together.

Do not put everything in root folder.

Root folder should stay clean.

Good root:

```txt
README.md
CONTRIBUTING.md
LICENSE
.gitignore
.env.example
frontend/
backend/
docs/
```

Bad root:

```txt
test.js
rough.txt
newfile.md
final2.md
random.ts
old-code/
```

---

## 45. Working With AI Tools

AI tools can be used for help, but final responsibility belongs to the developer.

Use AI for:

- Understanding concepts
- Generating first drafts
- Reviewing code
- Debugging errors
- Improving documentation
- Brainstorming architecture

Do not blindly copy AI code.

Always check:

- Does the code fit our project?
- Do I understand it?
- Does it follow our folder structure?
- Are there security issues?
- Are there unnecessary packages?
- Are there hidden bugs?

If you do not understand the code, do not merge it.

---

## 46. Security Rules

Never commit:

```txt
.env
API keys
Database passwords
Supabase service role key
Access tokens
Private credentials
```

Always check before committing:

```bash
git diff
```

If a secret is accidentally committed, remove it immediately and rotate the key.

---

## 47. MVP Discipline

Pravaah should be built with MVP discipline.

That means:

- Build the simplest useful version first
- Avoid unnecessary advanced features
- Do not over-engineer
- Do not add features just because they sound cool
- Focus on the core user flow
- Keep scope realistic
- Polish after the core flow works

Ask before adding anything:

```txt
Is this required for MVP?
```

If not, move it to future scope.

---

## 48. Issue Size Rule

Issues should be small enough to complete without confusion.

A good issue usually takes:

```txt
30 minutes to 3 hours
```

If an issue feels too big, split it.

Too big:

```txt
[Feature] Build complete dashboard
```

Better:

```txt
[Feature] Create dashboard layout
[Feature] Add appointment summary cards
[Feature] Add today's queue table
[Feature] Connect dashboard to backend API
```

---

## 49. PR Size Rule

A PR should be easy to review.

Avoid very large PRs.

Good PR:

```txt
Adds Prisma setup
```

Bad PR:

```txt
Adds Prisma, auth, dashboard, patient form, AI logic, docs, and deployment config
```

Large PRs create bugs and review confusion.

---

## 50. Final Checklist Before Starting Any Task

Before starting:

```md
- [ ] Is there an issue for this work?
- [ ] Is the issue clear?
- [ ] Does it have labels?
- [ ] Does it have a milestone?
- [ ] Is it added to GitHub Project?
- [ ] Is the status set to Ready?
- [ ] Have I created a new branch?
```

Before pushing:

```md
- [ ] Did I check `git status`?
- [ ] Did I check `git diff`?
- [ ] Did I avoid committing `.env`?
- [ ] Did I remove unnecessary logs?
- [ ] Did I write a clear commit message?
```

Before opening PR:

```md
- [ ] Does the PR solve the issue?
- [ ] Did I fill the PR template?
- [ ] Did I link the issue?
- [ ] Did I test locally?
- [ ] Did I keep scope clean?
```

Before merging:

```md
- [ ] PR checklist is complete
- [ ] Code or docs are reviewed
- [ ] No secrets are present
- [ ] Main branch remains stable
- [ ] Issue can be closed
```

---

## 51. Simple Example Workflow

Example task:

```txt
[Setup] Configure Prisma with Supabase database
```

Step 1: Create branch

```bash
git checkout main
git pull origin main
git checkout -b setup/configure-prisma
```

Step 2: Do the setup work.

Step 3: Check changes

```bash
git status
git diff
```

Step 4: Commit

```bash
git add .
git commit -m "setup: configure prisma with supabase"
```

Step 5: Push

```bash
git push origin setup/configure-prisma
```

Step 6: Open PR.

PR title:

```txt
setup: configure prisma with supabase
```

PR body:

```txt
Closes #issue_number
```

Step 7: Merge after checklist is complete.

---

## 52. Final Rule

Clean process creates clean projects.

For Pravaah, do not chase fake productivity.

The goal is not to create many issues, many branches, or many docs.

The goal is to build a working MVP with professional engineering habits.

Every issue, branch, commit, and PR should help the project move forward.
