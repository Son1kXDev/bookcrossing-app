# BookCrossing App

---

## BookCrossing — Online Book Exchange Platform

**BookCrossing** is a full-stack web application designed for exchanging physical books between users via the Internet.  
The platform removes the need for direct meetings by combining a virtual currency system with delivery service integration.

The application follows a modern client–server architecture and provides a complete cycle of book exchange: from catalog browsing to deal completion and delivery tracking.

---

## Key Features

- User registration and authentication (JWT)
- Public book catalog with search by title and author
- Personal library management
- Virtual currency system (1 book = 1 coin)
- Deal creation and lifecycle management
- Integration with delivery services (CDEK / mock provider)
- Pickup point (PVZ) selection
- File uploads (book covers, user avatars)
- User profiles and public statistics

---

## Architecture

The system is built using a **client–server architecture**:

- **Frontend** — Single Page Application (SPA)
- **Backend** — REST API
- **Database** — Relational (PostgreSQL)
- **File storage** — Local storage with Docker volumes
- **External services** — Book catalogs and delivery APIs

Communication between frontend and backend is performed via **REST API (JSON over HTTP)**.

---

## Technology Stack

### Frontend
- Angular
- TypeScript
- HTML / SCSS
- JWT-based authorization
- Guards & HTTP interceptors

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT authentication
- Multer (file uploads)

### Infrastructure
- Docker
- Docker Compose
- Nginx (frontend container)
- Environment-based configuration

---

## Project Structure

```text
apps/
├── backend/
│   ├── src/
│   │   ├── auth/        # Authentication & JWT
│   │   ├── users/       # User profiles
│   │   ├── books/       # Books & catalog
│   │   ├── deals/       # Exchange deals
│   │   ├── wallet/     # Virtual currency
│   │   ├── shipping/   # Delivery abstraction
│   │   ├── cdek/       # CDEK delivery implementation
│   │   └── main.ts     # Backend entry point
│   └── prisma/         # DB schema & migrations
│
├── frontend/
│   └── src/
│       ├── app/
│       ├── pages/
│       ├── services/
│       ├── shared/
│       └── core/
│
infra/
└── docker/
    └── docker-compose.yml
```

---

## Getting Started

### Prerequisites

* Node.js 18+
* Docker & Docker Compose (recommended)
* PostgreSQL 14+ (if running without Docker)

---

### Run with Docker (Recommended)

1. Create `.env` file in the project root:

```env
POSTGRES_PASSWORD=pass123
JWT_SECRET=supersecret
PUBLIC_API_URL=http://localhost:3000
SHIPPING_MODE=mock
UPLOADS_DIR=/app/uploads
CORS_ORIGIN=http://localhost:4200,http://0.0.0.0:4200
```

2. Start the project:

```bash
docker compose -f infra/docker/docker-compose.yml up -d --build
```

3. Check services:

* Backend healthcheck: `GET /health`
* Frontend available via Nginx container
* PostgreSQL exposed on `127.0.0.1:15432`

---

### Run Manually (Development)

#### Backend

```bash
cd apps/backend
npm install
npm run dev
```

#### Frontend

```bash
cd apps/frontend
npm install
npm start
```

---

## Authentication

* JWT-based authorization
* Token is sent via:

  ```
  Authorization: Bearer <token>
  ```
* Protected routes use guards and middleware

---

## Virtual Currency Logic

* Each book has a fixed price: **1 virtual coin**
* Coins are:

  * Spent when requesting a book
  * Earned after successfully sending a book
* Balance is managed transactionally

---

## Delivery Integration

The system supports a pluggable delivery layer:

* `mock` — for development and testing
* `cdek` — real delivery service integration

Delivery logic is abstracted via a shared shipping layer.

---

## API Overview

* `/auth/*` — authentication
* `/users/*` — profiles
* `/books/*` — catalog & personal books
* `/deals/*` — exchange lifecycle
* `/wallet/*` — virtual currency
* `/shipping/*` — delivery & pickup points

All API responses use JSON.

---

## Documentation

* User Guide
* Developer Guide
* REST API reference
* Database schema (Prisma)

---

## License

This project is provided for educational and demonstration purposes.

