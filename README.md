# DefectTrack — Enterprise Defect Tracker (Frontend)

A frontend-only, enterprise-grade Defect Tracking System scaffold built with **React + TypeScript + Vite**.
Backed entirely by a mock service layer designed to be swapped for a Spring Boot REST API with minimal changes.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Demo accounts

| Email | Password | Role |
|---|---|---|
| `superuser@defecttrack.io` | `Passw0rd!` | Super User — all privileges |
| `pm.priya@defecttrack.io` | `Passw0rd!` | Project Manager — project/release/reporting privileges |
| `qa.arjun@defecttrack.io` | `Passw0rd!` | QA Engineer — test case & defect privileges only |

The sidebar, routes, and page actions are all driven by the logged-in user's **privileges** — nothing is
hardcoded to a role name, including the Super User (it simply happens to hold every privilege in the system).

## What's implemented

- Mock authentication (`authService`) issuing a mock session token + user/role/privilege payload
- Privilege-driven sidebar menu and route guarding (`ProtectedRoute`)
- 5-minute inactivity auto-logout with activity listeners (mouse, keyboard, scroll, touch)
- Reusable component library: Button, Input, Dropdown, Modal, Table, Card, Pagination, Search, Filter,
  Badge, Loader, EmptyState, ErrorMessage
- Backend-shaped mock service layer (`services/*.ts`) returning `Page<T>`-style paginated responses,
  ready to be pointed at real Spring Boot endpoints
- Reusable pagination framework supporting page size 10/25/50/100 against a 10,000-row mock defect dataset
- Shared form validation hook (required-field marking, trim-aware, spaces-only rejection, dirty-field tracking
  that gates the Update button)
- Placeholder pages + routing for every module in the spec (Workspace, Project Management, User Management,
  Configuration, System Settings)

## Folder structure

```
src
 ├── components/{common,layout,forms}
 ├── pages
 ├── routes
 ├── services
 ├── mock
 ├── hooks
 ├── context
 ├── types
 ├── constants
 └── utils
```

## Swapping in the real API

Every function in `src/services/*.ts` returns the same response shape a Spring Boot controller would
(`ApiResponse<T>` / `Page<T>`, see `src/types/common.ts`). To go live, replace the mock body of each
service function with an `axios`/`fetch` call to the matching endpoint — page components, hooks, and
types do not need to change.
