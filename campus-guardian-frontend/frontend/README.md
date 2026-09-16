# Campus Guardian — Frontend

**Report. Respond. Recover.**

React + Vite frontend for Campus Guardian, a campus platform where students report problems,
raise emergency alerts to the campus response team, and post lost or found belongings.
Administrators manage the queue, users and campus analytics.

This repository is the frontend only. It talks to the Node.js + Express + MongoDB backend
over HTTP and contains no mock data.

---

## Features

**Students**
- Report a campus problem with category, location and an optional photo
- Track every complaint through Reported → Assigned → In Progress → Resolved
- Upvote complaints so the team knows how many people an issue affects
- Raise an in-app emergency alert with type, location and optional coordinates
- Post lost or found items and run Smart Match to find likely pairs
- Request verification before a handover, without exposing private contact details
- Notifications with unread count, in the navbar and on its own page

**Administrators and campus staff**
- Dashboard with users, complaints, emergency and lost & found counts
- Complaint queue with search, status and category filters, status changes and staff assignment
- Emergency response desk that refreshes every 30 seconds, with active alerts made prominent
- Lost & found overview
- User management: change role, activate or deactivate accounts
- Analytics: complaints by category, location and status, emergencies by type, lost & found

**Throughout**
- Loading states and skeletons on every request
- Friendly errors for 401, 403, 404, 500 and network failures — no stack traces
- Empty states that tell you what to do next
- Responsive from mobile to desktop, including a collapsing admin sidebar

---

## Tech stack

React 18 · Vite 5 · JavaScript · React Router 6 · Axios · Bootstrap 5 · custom CSS · lucide-react · Recharts

---

## Folder structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/      Navbar, Sidebar, Footer, cards, badges, route guards, modal
│   ├── pages/           Landing, auth, student pages
│   │   └── admin/       Admin console pages
│   ├── services/        Axios instance + one service per API area
│   ├── context/         AuthContext
│   ├── utils/           Token storage, roles, date helpers
│   ├── App.jsx          Routes and layouts
│   ├── main.jsx
│   └── index.css        Design system
├── .env.example
├── package.json
└── vite.config.js
```

---

## Installation

```bash
cd frontend
npm install
```

### Environment setup

Copy the example file and point it at your backend:

```bash
cp .env.example .env
```

`.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Only `VITE_API_URL` belongs here. Never put the Mongo connection string, the JWT secret or any
other backend secret in this project — everything in a Vite `.env` ships to the browser.

### Run it

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000 (start this first)

Uploaded images are read from `http://localhost:5000/uploads/<filename>`. The `fileUrl()` helper
in `src/services/api.js` derives that from `VITE_API_URL`, so changing the API URL moves the
images with it.

---

## Routes

| Route | Access | What it does |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/login`, `/register` | Public | Authentication |
| `/dashboard` | Signed in | Student dashboard |
| `/report-problem` | Signed in | File a complaint |
| `/my-complaints` | Signed in | Your complaints |
| `/complaints/:id` | Signed in | Complaint detail and timeline |
| `/emergency` | Signed in | Raise an emergency alert |
| `/emergency/:id` | Signed in | Alert detail |
| `/lost-found` | Signed in | Browse lost and found items |
| `/lost-found/create` | Signed in | Post an item |
| `/lost-found/:id` | Signed in | Item detail, Smart Match, verification |
| `/notifications` | Signed in | All notifications |
| `/profile` | Signed in | Your details |
| `/admin/dashboard` | Admin | Campus overview |
| `/admin/complaints` | Admin, staff, security | Complaint queue |
| `/admin/emergencies` | Admin, staff, security | Response desk |
| `/admin/lost-found` | Admin | Item overview |
| `/admin/users` | Admin | Roles and account status |
| `/admin/analytics` | Admin | Charts |

Unauthenticated visits to a protected route redirect to `/login` and return to the original page
after signing in. Signed-in non-admins see an access message instead of admin pages.

---

## API integration

`src/services/api.js` creates one Axios instance with `baseURL = import.meta.env.VITE_API_URL`,
attaches `Authorization: Bearer <token>` to every request, drops the JSON content type when the
body is `FormData` so multipart uploads set their own boundary, and signs the user out on a 401.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PUT /auth/me` |
| Complaints | `POST /complaints`, `GET /complaints/my`, `GET /complaints/:id`, `POST /complaints/:id/upvote`, `PUT /complaints/:id/status`, `PUT /complaints/:id/assign` |
| Emergencies | `POST /emergencies`, `GET /emergencies`, `GET /emergencies/:id`, `PUT /emergencies/:id/status` |
| Lost & found | `POST /lost-found`, `GET /lost-found`, `GET /lost-found/:id`, `GET /lost-found/:id/matches`, `POST /lost-found/:id/request-verification` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read`, `PUT /notifications/read-all` |
| Admin | `GET /admin/dashboard`, `GET /admin/complaints`, `GET /admin/users`, `PUT /admin/users/:id/role`, `PUT /admin/users/:id/status`, `GET /admin/analytics` |

Responses are read through `unwrap()`, which handles both a bare object and the common
`{ success, data }` wrapper, so the pages work whichever shape your backend returns.

---

## About emergency alerts and Smart Match

**Emergency alerts** go to the campus response team inside this app. Campus Guardian does not call
the police, an ambulance or the fire service. Every emergency screen says so. For a life-threatening
situation, contact your local emergency services directly.

**Smart Match** compares category, description wording, location and date between posted items and
ranks the closest ones. It is a rule-based comparison served by the backend, not a trained AI model,
and the interface presents it that way.

---

## Build

```bash
npm run build     # production build into dist/
npm run preview   # serve the build locally
```

Deploy `dist/` behind any static host. Set `VITE_API_URL` to the deployed backend URL before
building — Vite inlines environment variables at build time.
