# Campus Guardian — Backend

**Tagline:** Report. Respond. Recover.

Campus Guardian is a unified campus management platform backend built with the MERN stack (backend only in this repo). It powers three core modules — **Campus Problem Reporting**, an **Emergency Network** (in-app alerting), and **Lost & Found** — plus an **Admin Dashboard API**.

---

## Features

- JWT-based authentication with hashed passwords (bcryptjs)
- Role-based access control: `student`, `staff`, `security`, `admin`
- **Campus Complaint System**: report issues, upvote, auto-calculated priority, assignment workflow, status tracking, image uploads
- **Emergency Network**: in-app emergency alerts with location, response tracking, and authority notifications (does **not** contact police/fire/ambulance automatically)
- **Lost & Found**: report lost/found items with a rule-based matching algorithm (no AI model), match scoring with reasons, and an owner-verification workflow
- **Notifications**: in-app notifications for complaint updates, assignments, emergencies, and lost & found matches
- **Admin Dashboard**: platform-wide stats, user management, and MongoDB aggregation-powered analytics
- Centralized error handling with consistent JSON responses
- Security: Helmet, CORS, basic rate limiting, Multer file-type/size validation

---

## Tech Stack

- Node.js + Express.js
- MongoDB Atlas + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Multer (image uploads)
- Helmet, CORS, express-rate-limit
- dotenv

---

## Folder Structure

```
backend/
│
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── complaintController.js
│   ├── emergencyController.js
│   ├── lostFoundController.js
│   ├── notificationController.js
│   └── adminController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── adminMiddleware.js
│   ├── roleMiddleware.js
│   ├── uploadMiddleware.js
│   └── errorMiddleware.js
├── models/
│   ├── User.js
│   ├── Complaint.js
│   ├── Emergency.js
│   ├── LostFound.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── complaintRoutes.js
│   ├── emergencyRoutes.js
│   ├── lostFoundRoutes.js
│   ├── notificationRoutes.js
│   └── adminRoutes.js
├── utils/
│   ├── generateToken.js
│   ├── priorityCalculator.js
│   ├── matchCalculator.js
│   └── createNotification.js
├── uploads/
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js
```

---

## Installation

### 1. Clone / extract the project

```bash
cd backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 4. MongoDB Atlas setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user (Database Access) with a username/password.
3. Whitelist your IP address (Network Access) — for local dev, `0.0.0.0/0` works but is not recommended for production.
4. Click **Connect → Drivers**, copy the connection string, and paste it into `MONGO_URI` in your `.env` (replace `<password>` with your DB user's password).

### 5. Run locally

Development (auto-restart with nodemon):

```bash
npm run dev
```

Production:

```bash
npm start
```

The API will be available at `http://localhost:5000`.

Health check: `GET http://localhost:5000/` → `{ "success": true, "message": "Campus Guardian API is running" }`

---

## User Roles

| Role       | Description                                                    |
|------------|------------------------------------------------------------------|
| `student`  | Default role on registration. Can report complaints, emergencies, lost/found items. |
| `staff`    | Can be assigned complaints and update their status.             |
| `security` | Can view/respond to emergencies, verify lost & found recoveries. |
| `admin`    | Full access — user management, assignment, analytics, dashboard. |

> Public registration **always** creates a `student` account. Roles are only changed via `PUT /api/admin/users/:id/role` by an admin.

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint         | Access  | Description               |
|--------|-------------------|---------|----------------------------|
| POST   | `/register`       | Public  | Register a new student     |
| POST   | `/login`          | Public  | Login, returns JWT         |
| GET    | `/me`             | Private | Get current logged-in user |

### Complaints — `/api/complaints`
| Method | Endpoint            | Access               | Description                        |
|--------|----------------------|-----------------------|-------------------------------------|
| POST   | `/`                  | Private              | Create complaint (supports image)  |
| GET    | `/`                  | Private              | List complaints (role-aware)       |
| GET    | `/my`                | Private              | My reported complaints             |
| GET    | `/:id`               | Private              | Get complaint by id                |
| PUT    | `/:id`               | Private (owner/admin/staff) | Update complaint             |
| DELETE | `/:id`               | Private (owner/admin) | Delete complaint                  |
| POST   | `/:id/upvote`        | Private              | Upvote a complaint                 |
| PUT    | `/:id/status`        | staff, admin          | Update complaint status           |
| PUT    | `/:id/assign`        | admin                 | Assign complaint to staff         |

### Emergencies — `/api/emergencies`
| Method | Endpoint       | Access             | Description                       |
|--------|-----------------|---------------------|-------------------------------------|
| POST   | `/`             | Private            | Create emergency alert             |
| GET    | `/`             | security, admin     | List all emergency alerts          |
| GET    | `/my`           | Private            | My emergency alerts                |
| GET    | `/:id`          | Private (owner/authority) | Get emergency by id          |
| PUT    | `/:id/status`   | security, admin     | Update status (respond/resolve)    |

### Lost & Found — `/api/lost-found`
| Method | Endpoint                        | Access               | Description                            |
|--------|-----------------------------------|-----------------------|------------------------------------------|
| POST   | `/`                               | Private              | Report lost/found item (supports image) |
| GET    | `/`                               | Private              | List all items                          |
| GET    | `/my`                             | Private              | My reported items                       |
| GET    | `/:id`                            | Private              | Get item by id                          |
| PUT    | `/:id`                            | Private (owner/admin) | Update item                            |
| DELETE | `/:id`                            | Private (owner/admin) | Delete item                            |
| GET    | `/:id/matches`                    | Private              | Get possible matches with scores        |
| POST   | `/:id/request-verification`       | Private              | Request verification of a match         |
| PUT    | `/:id/verify`                     | security, admin       | Confirm recovery                        |

### Notifications — `/api/notifications`
| Method | Endpoint        | Access  | Description                  |
|--------|------------------|---------|-------------------------------|
| GET    | `/`              | Private | List my notifications         |
| PUT    | `/:id/read`      | Private | Mark one notification as read |
| PUT    | `/read-all`      | Private | Mark all notifications as read|

### Admin — `/api/admin`
| Method | Endpoint               | Access | Description                  |
|--------|-------------------------|--------|--------------------------------|
| GET    | `/dashboard`            | admin  | Platform-wide summary stats   |
| GET    | `/analytics`            | admin  | Aggregated analytics          |
| GET    | `/complaints`           | admin  | All complaints                |
| GET    | `/emergencies`          | admin  | All emergencies               |
| GET    | `/lost-found`           | admin  | All lost & found items        |
| GET    | `/users`                | admin  | All users                     |
| PUT    | `/users/:id/role`       | admin  | Change a user's role          |
| PUT    | `/users/:id/status`     | admin  | Activate/deactivate a user    |

---

## Example API Requests

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Aisha Khan",
  "email": "aisha@campus.edu",
  "password": "SecurePass123",
  "phone": "9876543210"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "aisha@campus.edu",
  "password": "SecurePass123"
}
```

Response includes a `token` — use it as `Authorization: Bearer <token>` on all subsequent requests.

### Create a complaint (with image)

```http
POST /api/complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Broken water cooler"
description: "The water cooler on the 2nd floor of Block A is leaking."
category: "Water"
location: "Block A"
image: <file>
```

### Create an emergency alert

```http
POST /api/emergencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Medical",
  "description": "Student fainted near the library",
  "location": "Library",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

### Report a lost item

```http
POST /api/lost-found
Authorization: Bearer <token>
Content-Type: multipart/form-data

type: "lost"
itemName: "Black wallet"
category: "Wallet"
description: "Black leather wallet with college ID inside"
location: "Cafeteria"
date: "2026-09-14"
image: <file>
```

---

## Testing with Postman / Thunder Client

1. Import or manually create requests for each endpoint listed above.
2. Register a user via `POST /api/auth/register`, then log in via `POST /api/auth/login` to get a JWT.
3. In Postman/Thunder Client, set the `Authorization` header on protected requests to `Bearer <your_token>`.
4. For file uploads (complaint/lost-found images), use `form-data` body type with a `image` file field alongside the other text fields.
5. To test admin-only routes, manually promote a test user to `admin` directly in MongoDB Atlas (via the Atlas UI, editing the `role` field on a user document) since there is no public way to self-register as admin.
6. Test role restrictions by logging in as different roles (student/staff/security/admin) and confirming access is correctly allowed/denied.

---

## Important Notes

- The Emergency module is an **in-app alert system only**. It does **not** automatically contact police, ambulance, or fire services — it notifies campus security/admin users in-app.
- The Lost & Found matching algorithm is a **practical, rule-based scoring system** (category, name, description keywords, location, date) — it is **not** an AI/ML model.
- Passwords are never returned in any API response, and sensitive config (`JWT_SECRET`, `MONGO_URI`) should never be committed to version control.
