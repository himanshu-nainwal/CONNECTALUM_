# ConnectAlum — Full Stack Alumni Network Platform

A full-stack alumni networking platform built with **React + Vite** (frontend) and **Express + Node.js + MongoDB** (backend).

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router v7   |
| Backend   | Node.js, Express 4                |
| Database  | MongoDB + Mongoose                |
| Auth      | JWT (jsonwebtoken + bcrypt)       |
| Realtime  | Socket.IO (live chat)             |
| Styling   | Pure CSS with CSS variables       |

---

## Features

### 🏠 Home Page
- Hero section with call-to-action
- **Portal Selector** — prominent Student / Alumni cards with role-based routing
- Features & stats sections

### 🎓 Student Portal
- Browse alumni mentors (search by name, company, expertise)
- View & register for events
- Browse jobs & internships posted by alumni

### 🏆 Alumni Portal
- Register as a mentor
- Post jobs & internships
- Create & manage events
- View alumni network

### 💬 Community Chat
- Real-time chat via Socket.IO
- Multiple rooms: General, Jobs & Careers, Tech Talk, Events

### 👤 Profile
- View and edit your profile
- Update skills, college, department, job role

---

## Project Structure

```
connectalum/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Mentor.js
│   │   ├── Event.js
│   │   └── Registration.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── jobController.js
│   │   ├── mentorController.js
│   │   └── eventController.js
│   ├── middleware/
│   │   └── auth.js            # JWT auth middleware
│   ├── routes/
│   │   ├── userRoute.js
│   │   ├── jobRoute.js
│   │   ├── mentorRoute.js
│   │   ├── eventRoutes.js
│   │   └── chatRoute.js
│   ├── server.js              # Express + Socket.IO entry
│   ├── .env                   # Your env vars
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── PortalSelector/ # NEW — Student/Alumni homepage selector
    │   │   ├── Hero/
    │   │   ├── Navbar/
    │   │   ├── Footer/
    │   │   ├── LoginSignup/
    │   │   ├── Jobs/
    │   │   ├── Events/
    │   │   ├── Mentors/
    │   │   ├── MentorForm/
    │   │   ├── Profile/
    │   │   └── Chatroom/
    │   ├── pages/
    │   │   ├── Home/           # Hero + PortalSelector + Features
    │   │   ├── Student/        # Find Mentors | Events | Jobs tabs
    │   │   ├── Alumini/        # Alumni Network | Events | Post Jobs tabs
    │   │   └── Chat/
    │   ├── context/
    │   │   └── StoreContext.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env
    └── package.json
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env`:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/connectalum
JWT_SECRET=your_secret_key_here
ALLOWED_ORIGINS=http://localhost:5173
```

Start the server:
```bash
npm run dev     # development (nodemon)
npm start       # production
```

Backend runs on: `http://localhost:4000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

Start the dev server:
```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## API Endpoints

### Auth
| Method | Endpoint               | Description        |
|--------|------------------------|--------------------|
| POST   | /api/user/register     | Register new user  |
| POST   | /api/user/login        | Login              |
| GET    | /api/user/me           | Get own profile    |
| PUT    | /api/user/profile      | Update profile     |
| GET    | /api/user/alumni       | List all alumni    |

### Jobs
| Method | Endpoint               | Description        |
|--------|------------------------|--------------------|
| GET    | /api/jobs              | Get all jobs       |
| POST   | /api/jobs/create       | Post a job (auth)  |
| GET    | /api/jobs/myjobs       | My posted jobs     |
| DELETE | /api/jobs/:id          | Delete a job       |

### Mentors
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | /api/mentors           | Get all mentors      |
| POST   | /api/mentors/add       | Register as mentor   |

### Events
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | /api/events            | Get all events       |
| POST   | /api/events/create     | Create event (auth)  |
| POST   | /api/events/register   | Register for event   |
| GET    | /api/events/:id        | Get event by ID      |

### Chat (Socket.IO)
- `join_room` — join a chat room
- `send_message` — broadcast a message
- `receive_message` — listen for messages
- `chat_history` — receive last 50 messages on join

---

## MongoDB Atlas (Cloud)

Replace `MONGO_URI` with your Atlas connection string:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/connectalum?retryWrites=true&w=majority
```
