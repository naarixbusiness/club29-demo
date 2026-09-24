# Club29 · Staff Demo

A frontend-only, working demo of the Club29 gym management staff app: 11 desktop
screens (Login, Dashboard, Members, Member Profile, Memberships, Payments &
Billing, Attendance, Trainers, Workouts, Leads/CRM, Reports) driven by realistic
mock data, with role-based access for Owner, Front Desk, Trainer and Accountant.

No backend — everything runs in the browser on seeded, deterministic mock data.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5290 (or the port Vite prints).

## Demo accounts

Password for all: `club29`

| Role | Email |
|---|---|
| Owner / Admin | admin@club29.in |
| Manager / Front desk | frontdesk@club29.in |
| Trainer | john@club29.in |
| Accountant | accounts@club29.in |

Switch roles anytime from the profile menu (top right) without logging out.

## Stack

React + TypeScript + Vite, React Router, hand-rolled design system (no UI
library) matching the Club29 brand — dark charcoal ground with a single orange
accent, Archivo (display/numerals) + Manrope (body) typefaces.
