# ConnectHub — System Architecture & Design Documentation

## 1. System Overview

ConnectHub is a decoupled, full-stack professional networking platform designed to scale across cloud environments. It implements a clean separation of concerns between client presentation, server-side data aggregation, and persistent data layers.

```
                      +-----------------------------+
                      |   Client Web Browser        |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
       Client SPA Requests                            Public SSR Routes
       (Redux Toolkit / Axios)                     (getServerSideProps)
              |                                             |
              v                                             v
+-----------------------------+               +-----------------------------+
| Next.js Frontend (Netlify)  |               | Next.js SSR Engine (Node)   |
| - React 18 Components       |               | - Dynamic SEO Meta Tags     |
| - Redux Slices (Auth/Posts) |               | - OpenGraph Social Cards    |
| - Tailwind CSS              |               +--------------+--------------+
+--------------+--------------+                              |
               |                                             |
               +----------------------+----------------------+
                                      |
                                      | HTTPS REST (JWT Bearer Auth)
                                      v
                      +-----------------------------+
                      | Render: Express.js REST API |
                      | - CORS Origin Filtering     |
                      | - JWT Authentication Guard  |
                      | - Resource Ownership Guard  |
                      | - Centralized Error Handler |
                      +-------+--------------+------+
                              |              |
          Multipart Form-Data |              | Mongoose Connection Pool
                              v              v
               +------------------+   +--------------------+
               | Cloudinary CDN   |   | MongoDB Atlas      |
               | Media Storage    |   | Persistent Cluster |
               +------------------+   +--------------------+
```

---

## 2. Directory & Monorepo Structure

```text
d:\connecthub/
├── client/                     # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── components/         # Reusable UI & Feature Components
│   │   │   ├── common/         # Navbar, Footer, Button, Card, Avatar, Input
│   │   │   ├── feed/           # CreatePostCard, PostCard, LikeButton, CommentList
│   │   │   ├── network/        # NetworkTabs, ConnectionCard, SuggestionCard
│   │   │   └── profile/        # ProfileHeader, EditProfileModal, ExperienceSection
│   │   ├── pages/              # Next.js File-system Routing
│   │   │   ├── index.jsx       # Feed & Home Stream
│   │   │   ├── login.jsx       # Sign In Page & Gated Demo Helper
│   │   │   ├── register.jsx    # User Registration Page
│   │   │   ├── profile.jsx     # Personal Profile Edit & View
│   │   │   ├── network.jsx     # Connections, Pending Invitations & Search
│   │   │   ├── profile/[id].jsx# Public SSR Profile View
│   │   │   └── post/[id].jsx   # Public SSR Post Preview
│   │   ├── services/           # Axios API Client & Media Service
│   │   └── store/              # Redux Toolkit Slices (auth, posts, profile, connections)
│   ├── public/                 # Static Assets
│   └── package.json            # Frontend Dependencies & Scripts
│
├── server/                     # Node.js & Express REST Backend
│   ├── src/
│   │   ├── app.js              # Express Application Config & Middleware Stack
│   │   ├── server.js           # HTTP Server Entrypoint & Process Lifecycle
│   │   ├── config/             # Database Connection (MongoDB Atlas)
│   │   ├── models/             # Mongoose Schemas (User, Profile, Post, Connection, Comment)
│   │   ├── controllers/        # Business Logic & Request Handlers
│   │   ├── routes/             # REST Route Mounts
│   │   ├── middleware/         # JWT Auth, Multer Multipart, Error Handlers
│   │   ├── utils/              # PDF Generator & Seeder
│   │   └── scripts/            # Standalone CLI Seed Script (opt-in)
│   ├── tests/                  # Automated Jest / Supertest Integration Suites
│   └── package.json            # Backend Dependencies & Scripts
│
├── docs/                       # Comprehensive Engineering Documentation
│   ├── ARCHITECTURE.md         # System Architecture & Design
│   ├── DATABASE.md             # MongoDB Schema & Index Reference
│   ├── API.md                  # REST API Specification
│   ├── WALKTHROUGH.md          # User Journey Verification Walkthrough
│   └── INTERVIEW_QA.md         # Technical Interview Q&A Reference
│
├── scripts/                    # End-to-end Smoke Test Suite
│   └── smoke_test.js           # Automated 20-flow Verification Harness
├── DEPLOYMENT.md               # Netlify, Render, Atlas, Cloudinary Setup
├── package.json                # Root Monorepo Orchestration
└── README.md                   # Platform Overview & Quickstart
```

---

## 3. Technology Stack & Decision Rationale

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14 (Pages Router) | Combines client-side React 18 interactivity with server-side rendering (`getServerSideProps`) for public profile and post links, ensuring proper OpenGraph preview unfurls on LinkedIn, Twitter, and Slack. |
| **State Management** | Redux Toolkit (RTK) | Provides predictable, immutable global state across navigation routes for active user session, real-time like toggles, comment additions, and connection request state without prop drilling. |
| **Styling** | Tailwind CSS | Utility-first CSS ensuring lightweight bundle size, clean design system primitives, responsive breakpoints, and dark-accent styling consistent across modern platforms. |
| **Backend Runtime** | Node.js + Express.js | High-throughput asynchronous event loop ideal for I/O bound REST queries, JSON payloads, and streaming media proxies. |
| **Database & ODM** | MongoDB Atlas + Mongoose | Schema flexibility accommodating rich career histories (nested experience arrays, variable skills) while enforcing data integrity, uniqueness constraints, and compound indexing. |
| **Authentication** | JSON Web Tokens (JWT) + bcrypt | Stateless authentication supporting decoupled client/server architectures; bcrypt generates 10-round salted password hashes resistant to rainbow table attacks. |
| **Media Pipeline** | Multer + Cloudinary | Memory buffer stream directly to Cloudinary CDN, removing disk reliance in ephemeral container environments (e.g., Render free tier) while supporting local disk fallbacks during offline development. |
| **Document Generation**| PDFKit | Pure JavaScript streaming PDF generation creates downloadable, professional resume PDFs directly from MongoDB profile data without heavy headless browser (Puppeteer) overhead. |

---

## 4. Security & Authorization Model

1. **Stateless JWT Verification**:
   - Every protected API route enforces the `protect` middleware.
   - Requires `Authorization: Bearer <token>`.
   - Rejects missing, malformed, expired, or unsigned tokens with HTTP 401 Unauthorized.
   - Resolves user from token `id`, attaches sanitized user document to `req.user`.

2. **Resource Ownership Enforcement**:
   - Posts can only be edited or deleted by their author (`post.user.toString() === req.user._id.toString()`). Attempted modifications by other users return HTTP 403 Forbidden.
   - Comments can be deleted by either the comment author or the post author (moderation rights).
   - Profiles can only be mutated via `PUT /api/profiles/me` by the authenticated session owner.

3. **CORS Isolation**:
   - Express server parses `CLIENT_URL` supporting comma-separated production origins (Netlify, Vercel, custom domain).
   - Pre-flight OPTIONS requests are handled with caching and required headers (`Content-Type`, `Authorization`).

4. **Zero Secrets in Code**:
   - Passwords and secrets are strictly provided via environment variables (`JWT_SECRET`, `MONGODB_URI`, `CLOUDINARY_*`).
   - Production mode immediately fails fast if required production variables are absent.

5. **JWT Lifecycle, Client-Side Logout & Limitations**:
   - **Issuance & Expiry**: Tokens are signed with HMAC-SHA256 containing `{ id }` with a 7-day expiration (`JWT_EXPIRES_IN=7d`).
   - **Storage**: Persisted in browser `localStorage` and sent via Axios request interceptor (`Authorization: Bearer <token>`).
   - **Logout Mechanics**: Logout is performed on the client by deleting the token from `localStorage` and resetting Redux auth state (`logoutUser` thunk). There is **no server-side token blacklist or revocation list**.
   - **Trade-off & Limitation**: In accordance with the agreed lightweight stack (no Redis/memcached), the backend is completely stateless. If a token is stolen or leaked prior to logout, that token remains cryptographically valid until its 7-day TTL expires, unless the user account is deleted from MongoDB (which invalidates the user lookup in `auth.js`) or `JWT_SECRET` is rotated.

6. **Image Upload Sanitization & Stored XSS Prevention**:
   - SVG (`image/svg+xml`, `.svg`) uploads are **strictly rejected** by the Multer middleware filter and the media controller.
   - SVG files are executable XML documents capable of containing inline `<script>` tags, event handlers (`onload`), and external entities. Serving user-uploaded SVGs without an isolated domain or heavy sanitizer poses Stored XSS risks.
   - Only raster images (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) are permitted. Both client and server reject SVG uploads with an explicit HTTP 400 Bad Request error.
