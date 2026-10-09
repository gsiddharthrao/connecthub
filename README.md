# ConnectHub — Full-Stack Professional Networking Platform

ConnectHub is a modern, enterprise-grade professional social networking platform built with **Node.js**, **Express**, **MongoDB/Mongoose**, **React 18**, **Next.js 14**, **Redux Toolkit**, and **Tailwind CSS**. It provides a LinkedIn-style professional ecosystem featuring comprehensive user profile management, bidirectional professional connection lifecycles, multimedia post creation and engagement feeds, server-side rendered (SSR) preview pages with dynamic OpenGraph meta tags, and pure-JavaScript PDF resume export.

---

## Table of Contents

1. [Production Deployment Guide (Netlify, Render, Atlas, Cloudinary)](DEPLOYMENT.md)
2. [Architecture & System Design Documentation](docs/ARCHITECTURE.md)
3. [MongoDB Database & Schema Reference](docs/DATABASE.md)
4. [Complete REST API Specification](docs/API.md)
5. [Platform Walkthrough & Verification Guide](docs/WALKTHROUGH.md)
6. [Architectural Deep-Dive & Interview Q&A Reference](docs/INTERVIEW_QA.md)
7. [Tech Stack](#tech-stack)
8. [Prerequisites](#prerequisites)
9. [Environment Configuration](#environment-configuration)
10. [Setup & Installation](#setup--installation)
11. [Running in Development](#running-in-development)
12. [Production Build & Running](#production-build--running)
13. [Automated Testing & QA Architecture](#automated-testing--qa-architecture)
14. [REST API Quick Reference](#rest-api-reference)
15. [Media Pipeline & Local Fallback](#media-pipeline--local-fallback)
16. [PDF Resume Generator](#pdf-resume-generator)

---

## Architecture & Monorepo Structure

ConnectHub is organized as a clean, decoupled monorepo separating the Express REST backend (`server/`) and the Next.js frontend application (`client/`).

```text
connecthub/
├── package.json                 # Monorepo orchestration scripts & dev tooling
├── .gitignore                   # Root repository gitignore
├── README.md                    # Comprehensive platform documentation
├── server/                      # Express REST API backend
│   ├── package.json             # Backend dependencies & test scripts
│   ├── jest.config.js           # Jest configuration (in-band, 60s timeout)
│   ├── .env.example             # Server environment variables template
│   ├── uploads/                 # Local media storage directory (.gitkeep tracked)
│   ├── src/
│   │   ├── app.js               # Express application initialization & middleware
│   │   ├── server.js            # HTTP server entrypoint & MongoDB connection
│   │   ├── config/
│   │   │   ├── db.js            # Mongoose MongoDB connection manager
│   │   │   └── cloudinary.js    # Cloudinary SDK configuration
│   │   ├── models/
│   │   │   ├── User.js          # User schema (email, bcrypt password, timestamps)
│   │   │   ├── Profile.js       # Profile schema (headline, experience, skills, avatar)
│   │   │   ├── Post.js          # Post schema (content, mediaUrl, likes, commentsCount)
│   │   │   ├── Connection.js    # Mutual connection lifecycle schema
│   │   │   └── Comment.js       # Comment schema (post, author, text)
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── profileController.js
│   │   │   ├── connectionController.js
│   │   │   ├── postController.js
│   │   │   ├── mediaController.js
│   │   │   └── pdfController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js        # /api/auth
│   │   │   ├── profileRoutes.js     # /api/profiles
│   │   │   ├── connectionRoutes.js  # /api/connections
│   │   │   ├── postRoutes.js        # /api/posts
│   │   │   ├── mediaRoutes.js       # /api/media
│   │   │   └── pdfRoutes.js         # /api/pdf
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT authentication & Bearer token verification
│   │   │   ├── upload.js            # Multer multipart memory storage engine
│   │   │   └── errorHandler.js      # Centralized HTTP error & CastError handler
│   │   └── utils/
│   │       └── pdfGenerator.js      # Pure-JS PDFKit resume generation stream
│   └── tests/                       # 7 comprehensive Jest + Supertest suites (115+ tests)
│       ├── setup.js                 # MongoMemoryServer in-memory DB lifecycle
│       ├── auth.test.js
│       ├── profiles.test.js
│       ├── connections.test.js
│       ├── posts.test.js
│       ├── media_pdf.test.js
│       ├── auth_adversarial_challenge.test.js
│       └── adversarial_social_connections.test.js
└── client/                      # Next.js 14 React frontend
    ├── package.json             # Next.js, Redux Toolkit, Tailwind dependencies
    ├── next.config.js           # Next.js config (rewrites, image domains)
    ├── tailwind.config.js       # Tailwind CSS design system configuration
    ├── postcss.config.js        # PostCSS configuration
    ├── .env.example             # Client environment template
    ├── public/                  # Static assets
    └── src/
        ├── pages/
        │   ├── _app.jsx         # Next.js root app with Redux Provider & Navbar
        │   ├── index.jsx        # Authenticated home feed & post creator
        │   ├── login.jsx        # User login with credentials validation
        │   ├── register.jsx     # User registration form
        │   ├── profile.jsx      # Current user profile view and editor
        │   ├── network.jsx      # Mutual connections & pending requests manager
        │   ├── profile/[id].jsx # Dynamic SSR public profile preview with OpenGraph tags
        │   └── post/[id].jsx    # Dynamic SSR post preview with OpenGraph tags & comments
        ├── components/          # Reusable UI components (Navbar, PostCard, Feed, etc.)
        ├── store/               # Redux Toolkit store & slices (auth, posts, connections)
        └── services/            # Axios API clients with auto token injection
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.19
- **Database & ODM**: MongoDB with Mongoose 8.2
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing
- **File & Media Handling**: Multer (memory buffer storage) & Cloudinary SDK
- **Document Generation**: PDFKit (pure JavaScript vector PDF generator)
- **CORS & Environment**: `cors`, `dotenv`

### Frontend
- **Framework**: Next.js 14 (Pages Router)
- **Library**: React 18
- **State Management**: Redux Toolkit (`@reduxjs/toolkit` & `react-redux`)
- **Styling**: Tailwind CSS & PostCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios with request/response interceptors

### Testing & Tooling
- **Test Runner**: Jest 29
- **HTTP Assertion**: Supertest 6
- **Database Simulation**: `mongodb-memory-server` 11 (zero external DB requirement)
- **Process Orchestration**: `concurrently` 8 & `cross-env` 7

---

## Prerequisites

- **Node.js**: `>= 18.0.0` (Tested on Node.js v22.20.0)
- **npm**: `>= 9.0.0` (Tested on npm v11.6.1)
- **Git**

*Note: You do NOT need a local MongoDB server installed to run the automated tests. All tests run against an isolated, in-memory MongoDB server instance.*

---

## Environment Configuration

Both backend and frontend contain dedicated `.env.example` templates.

### 1. Server Configuration (`server/.env.example`)

Create `server/.env` by copying `server/.env.example`:

```bash
cp server/.env.example server/.env
```

| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port on which the Express REST API server listens |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGO_URI` | `mongodb://localhost:27017/connecthub` | Primary MongoDB connection URI |
| `MONGODB_URI`| `mongodb://localhost:27017/connecthub` | Fallback MongoDB connection URI |
| `JWT_SECRET` | `connecthub_super_secret_jwt_key_2026` | Secret key for signing and verifying JWT tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `CLOUDINARY_CLOUD_NAME` | *(empty)* | Cloudinary cloud name (optional for remote media) |
| `CLOUDINARY_API_KEY` | *(empty)* | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | *(empty)* | Cloudinary API secret (optional) |
| `UPLOAD_PATH` | `./uploads` | Local directory for static media storage fallback |
| `CLIENT_URL` | `http://localhost:3000` | Origin URL permitted by CORS middleware |

#### Cloudinary & Local Fallback Strategy
If `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` are not set or if streaming to Cloudinary encounters an error, the backend **automatically falls back to local disk storage**:
1. Uploaded image buffers are written directly to `server/uploads/`.
2. The server constructs an accessible HTTP URL: `http://localhost:5000/uploads/<filename>`.
3. Express serves the `server/uploads/` directory via `express.static()`.
4. The API response returns `{ url: "...", storage: "local" }`.

### 2. Client Configuration (`client/.env.example`)

Create `client/.env.local` by copying `client/.env.example`:

```bash
cp client/.env.example client/.env.local
```

| Variable | Default Value | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Base REST API URL accessed by browser and SSR |

---

## Setup & Installation

From the monorepo root (`connecthub/`), run:

```bash
npm run install:all
```

This single command:
1. Installs root devDependencies (`concurrently`, `cross-env`).
2. Runs `npm install` in the `server/` directory.
3. Runs `npm install` in the `client/` directory.

---

## Running in Development

To start both the Express backend API and the Next.js frontend concurrently:

```bash
npm run dev
```

- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:3000`

Logs from both processes are streamed to the terminal with color prefixes (`[SERVER]` in blue, `[CLIENT]` in green). If either process encounters a fatal error, the other is terminated cleanly.

---

## Production Build & Running

To verify and compile production artifacts for the entire monorepo:

```bash
npm run build
```

This command executes:
1. `npm --prefix server run build`: Syntax, module, and schema sanity checks for the backend (`node --check src/server.js && node --check src/app.js`).
2. `npm --prefix client run build`: Optimized Next.js production build (`next build`), compiling static pages and dynamic SSR routes.

### Targeted Commands
- `npm run client:build`: Compiles only the Next.js client.
- `npm run server:test`: Runs the server test suite.

---

## Automated Testing & QA Architecture

The test suite is structured around a comprehensive **4-Tier QA Architecture** that ensures complete reliability, security, and data integrity:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ConnectHub QA Test Pyramid                      │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 4: E2E Simulation & Adversarial Challenges                       │
│          Multi-user flows, concurrency stress, token tampering         │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 3: Cross-Feature Interactions & Relational Integrity             │
│          Connection lifecycles, atomic like counts, comment cascades   │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 2: Boundary & Security Tests                                     │
│          401 Unauthorized, CastError handling, validation constraints │
├────────────────────────────────────────────────────────────────────────┤
│  Tier 1: Happy Path Core API Testing                                   │
│          Auth, Profile, Connection, Post, Media, and PDF endpoints     │
└────────────────────────────────────────────────────────────────────────┘
```

### Running Tests

Execute the automated test suite from the monorepo root:

```bash
npm test
```

Or for detailed per-test output:

```bash
npm run test:verbose
```

### In-Memory Database Architecture
- Tests utilize `mongodb-memory-server` (version 11).
- No external MongoDB daemon or Docker container is required.
- The lifecycle manager (`server/tests/setup.js`) provisions an isolated in-memory MongoDB instance on startup, purges collections after every test case, and cleanly shuts down on completion.
- Tests execute sequentially with `--runInBand` to eliminate file lock contention and port collisions.

### Test Results Summary
- **Test Suites**: 7 passed, 7 total
- **Tests**: 115 passed, 115 total
- **Execution Time**: ~25 seconds
- **Pass Rate**: 100%

---

## REST API Reference

All API routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register new user | `{ name, email, password }` → `{ token, user }` (201) |
| `POST` | `/api/auth/login` | No | Login with credentials | `{ email, password }` → `{ token, user }` (200) |
| `GET` | `/api/auth/me` | Yes | Get authenticated user | Returns user profile details (200) |

### Profiles (`/api/profiles`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `GET` | `/api/profiles` | No | List profiles | Returns array of user profiles (200) |
| `GET` | `/api/profiles/me` | Yes | Get current user's profile | Returns populated profile document (200) |
| `PUT` | `/api/profiles/me` | Yes | Update current user's profile | `{ headline, summary, skills, experience, location, avatar }` (200) |
| `POST` | `/api/profiles` | Yes | Create or update profile | Profile fields (200/201) |
| `GET` | `/api/profiles/:id` | No | Get profile by profile or user ID | Returns profile document with user data (200) |
| `GET` | `/api/profiles/:id/pdf` | No | Export profile as PDF resume | Streams binary `application/pdf` (200) |
| `GET` | `/api/profiles/me/pdf` | Yes | Export own profile as PDF resume | Streams binary `application/pdf` (200) |

### Connections (`/api/connections`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `POST` | `/api/connections/request` | Yes | Send connection request | `{ recipientId }` → Status `pending` (201) |
| `POST` | `/api/connections/:id/accept` | Yes | Accept connection request | Status transitions to `accepted` (200) |
| `POST` | `/api/connections/:id/reject` | Yes | Reject connection request | Status transitions to `rejected` (200) |
| `GET` | `/api/connections` | Yes | List accepted connections | Returns array of connected users (200) |
| `GET` | `/api/connections/pending` | Yes | List incoming pending requests | Returns list of pending requests (200) |
| `GET` | `/api/connections/status/:userId`| Yes | Check status with another user | Returns `{ status, connectionId }` (200) |

### Posts & Social Feed (`/api/posts`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `GET` | `/api/posts` | Optional | Get feed posts | Sorted by `createdAt` desc with like status (200) |
| `POST` | `/api/posts` | Yes | Create a post | `{ content, mediaUrl }` (201) |
| `GET` | `/api/posts/:id` | Optional | Get post by ID | Returns post and comment thread (200) |
| `PUT` | `/api/posts/:id` | Yes | Edit own post | `{ content, mediaUrl }` → updates post content (200) |
| `DELETE` | `/api/posts/:id` | Yes | Delete own post | Soft-deletes post, hides from public API (200) |
| `POST` | `/api/posts/:id/like` | Yes | Toggle like on post | Atomic toggle (`likesCount ± 1`) (200) |
| `POST` | `/api/posts/:id/comment` | Yes | Add comment to post | `{ text }` or `{ content }` → updates `commentsCount` (201) |
| `GET` | `/api/posts/:id/comments` | Optional | Get post comments | Returns array of comments with author (200) |
| `DELETE` | `/api/posts/:id/comment/:commentId` | Yes | Delete own comment | Decrements `commentsCount` (200) |

### Media Upload (`/api/media`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `POST` | `/api/media/upload` | Yes | Upload image (JPG/PNG/WEBP/GIF; SVG rejected for XSS) | Multipart `file` or `image` → `{ url, storage }` (200) |
| `GET` | `/uploads/:filename` | No | Serve locally stored media | Statically served binary image (200) |

### PDF Resume Export (`/api/pdf`)

| Method | Endpoint | Auth | Description | Payload / Response |
|---|---|---|---|---|
| `GET` | `/api/pdf/:id` | No | Export profile as PDF resume | Streams binary `application/pdf` (200) |

---

## Media Pipeline & Local Fallback

1. **Multer Middleware**: Configured with `multer.memoryStorage()`, a 5MB size limit, and an image MIME filter (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`).
2. **Cloudinary Stream**: If Cloudinary credentials are provided, the image buffer streams securely to Cloudinary CDN and returns an HTTPS URL.
3. **Resilient Local Fallback**: If Cloudinary is unconfigured or returns an error, the controller safely persists the buffer to `server/uploads/` on disk and returns `http://<host>/uploads/<filename>`.
4. **Static Delivery**: Express mounts `express.static(path.join(__dirname, '../../uploads'))` to serve uploaded images directly over HTTP.

---

## PDF Resume Generator

The resume export engine (`server/src/utils/pdfGenerator.js`) is written entirely in pure JavaScript using `pdfkit`:
- **No Headless Browsers**: Eliminates Puppeteer, Chromium, or native binary requirements.
- **Professional Formatting**: Renders an A4 document with primary branding (`#0A66C2`), candidate header, contact information, divider rules, professional summary, work experience timeline, skills & expertise badges, and education credentials.
- **Direct Streaming**: Pipes directly to the Express HTTP response stream with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<name>-resume.pdf"`.
- **Validation**: Verified to produce valid PDF binaries starting with standard `%PDF-` header magic bytes.

---

## License

This project is licensed under the MIT License.
