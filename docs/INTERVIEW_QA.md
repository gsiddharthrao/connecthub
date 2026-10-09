# ConnectHub — Architectural Deep-Dive & Engineering Interview Reference

This document provides an end-to-end architectural, security, and systems engineering reference for the **ConnectHub** platform. It details architectural trade-offs, design rationales, system boundaries, and precise code execution traces for every core user action.

---

## 1. System Architecture Overview

```
                      +-----------------------------+
                      |   Browser / Mobile Client   |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
     (SPA Pages & UI)                              (Public SSR Pages)
              |                                             |
              v                                             v
+-----------------------------+               +-----------------------------+
|    Netlify / Next.js SPA    |               | Next.js SSR Runtime Engine  |
|  - Redux Toolkit (RTK)      |               |  - getServerSideProps       |
|  - Axios Client             |               |  - Dynamic OpenGraph Meta   |
|  - Tailwind CSS             |               +--------------+--------------+
+--------------+--------------+                              |
               |                                             |
               +----------------------+----------------------+
                                      |
                                      | REST / JSON (CORS + JWT)
                                      v
                      +-----------------------------+
                      | Render: Express.js Backend  |
                      |  - helmet security headers  |
                      |  - rateLimiter middleware   |
                      |  - jwtAuthGuard & authMw    |
                      |  - centralized errorHandler |
                      +-------+--------------+------+
                              |              |
           Multipart Uploads  |              | Mongoose ODM (Connection Pool)
                              v              v
               +------------------+   +--------------------+
               | Cloudinary CDN   |   | MongoDB Atlas      |
               | Media & Storage  |   | Persistent Cluster |
               +------------------+   +--------------------+
```

---

## 2. Core Architectural Decisions & Justifications

### 2.1 Database: MongoDB Atlas & Mongoose
- **Why NoSQL / Document Store?**
  ConnectHub's core entities (User Profiles, Posts, Activity feeds) feature dynamic, semi-structured data:
  - User profiles contain variable lists of `skills` (strings) and `experience` objects (nested documents with company, role, dates, current flags).
  - Normalizing this in a relational SQL database requires multiple join tables (`user_experiences`, `user_skills`, `post_likes`), creating high latency query joins on high-throughput feed queries.
  - Document modeling keeps profile data co-located within a single document, enabling atomic single-read updates (`O(1)` primary-key B-tree lookup).
- **Atlas Configuration:**
  - Connection pooling configured via `maxPoolSize: 10`, `minPoolSize: 2`, `socketTimeoutMS: 45000`.
  - DNS IPv4 forcing (`family: 4`) avoids Node.js dual-stack IPv6 DNS resolution stalls on cloud hosts.
  - Graceful connection termination on `SIGTERM` / `SIGINT` prevents severed socket states during container redeployments.
  - Production mode strictly rejects starting if `MONGODB_URI` is missing, forbidding in-memory mock databases from masking production data loss.

### 2.2 Frontend: Next.js (Pages Router) & React
- **Why Next.js SSR instead of Pure Vite / CRA?**
  - **SEO & Social Link Unfurling:** Social platforms (LinkedIn, Twitter/X, WhatsApp, Slack) crawl preview links via automated scrapers that do not execute client-side JavaScript. Pre-rendering public profile (`/profile/[id]`) and post (`/post/[id]`) routes via `getServerSideProps` injects semantic OpenGraph tags (`og:title`, `og:description`, `og:image`) directly into the raw HTML header.
  - **Single Repository Synergy:** Next.js allows unified client code with integrated SSR fallbacks and production bundling via SWC.

### 2.3 State Management: Redux Toolkit (RTK)
- **Why RTK over Context API or Zustand?**
  - **Cross-Cutting State Synchronization:** Authentication state (token, logged-in user profile, permissions) must synchronize seamlessly with feed updates, comment additions, and connection count counters.
  - **Predictable Async Flows:** `createAsyncThunk` encapsulates standard lifecycle stages (`pending`, `fulfilled`, `rejected`) with deterministic reducer transitions, preventing UI race conditions on rapid actions (e.g. toggling likes or deleting comments).
  - **Optimistic Updates:** Enables instant UI feedback on likes and comments with rollback capability if network calls fail.

### 2.4 Authentication & Security: JWT & bcrypt
- **Why Stateless JWTs?**
  - Decouples frontend hosting (Netlify) from backend hosting (Render). There is no shared session cache (like Redis) required to authenticate REST requests, keeping hosting costs zero and horizontal autoscaling trivial.
  - Standard `Bearer` token scheme stored securely in client memory/Redux and synced to `localStorage`.
- **Password Hashing:**
  - Passwords hashed with `bcryptjs` using a cost factor of 10 (`saltRounds = 10`), taking ~80ms per hash. This provides strong resistance against GPU rainbow table attacks while preserving responsive registration/login latency.
  - Stored models use `select: false` on the `password` field in Mongoose, ensuring no database read or JSON serialization inadvertently leaks password hashes.

### 2.5 Media Storage: Multer & Cloudinary
- **Why Not Local Filesystem in Production?**
  - Modern cloud PaaS platforms (Render, Heroku, AWS Fargate) utilize **ephemeral filesystems**. Any file saved to `./uploads` on local disk is permanently erased upon container restart, redeploy, or scaling event.
  - Multer memory storage buffers image binaries in memory and streams directly to Cloudinary over HTTPS.
  - Cloudinary offloads bandwidth, applies automatic WebP/AVIF format optimization, generates responsive thumbnail sizes, and delivers media through an edge CDN.
- **Fail-Safe Design:**
  - Production mode explicitly verifies Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and fails immediately with HTTP 500 if missing, preventing silent data corruption.

### 2.6 Soft Deletes vs Hard Deletes
- **Audit Trails & Relational Integrity:**
  - Hard deleting posts (`findByIdAndDelete`) destroys historical data, breaks reference lookups, and precludes moderation investigations.
  - Post deletion updates `isDeleted: true` and `deletedAt: new Date()`.
  - Compound indexes (`{ isDeleted: 1, createdAt: -1 }`) ensure queries filtering `{ isDeleted: { $ne: true } }` remain fully index-covered and execute in under a millisecond.
  - Related comments are cascade-deleted to prevent orphaned sub-documents.

### 2.7 In-Memory PDF Generation
- **Pure-Memory Streaming:**
  - `GET /api/profiles/:id/pdf` leverages `pdfkit` to construct a professional, formatted resume.
  - Stream piped directly to Express `res` with appropriate headers (`Content-Type: application/pdf`, `Content-Disposition: attachment; filename="resume.pdf"`).
  - Zero disk reads or writes are performed, eliminating temp-file cleanup scripts and disk permission failures in serverless/containerized runtimes.

---

## 3. End-to-End Execution Trace Matrix

The following table traces every critical platform interaction across all software architectural layers:

```
+-------------------------------------------------------------------------------------------------------------------------------+
| User Action             | Client Component        | RTK Thunk / Hook     | REST Endpoint            | Middleware Pipeline     |
| Controller / Handler    | Mongoose Model & Query  | Database Index       | HTTP Response            | UI / Redux Update       |
+-------------------------------------------------------------------------------------------------------------------------------+
```

### Trace 1: User Registration
1. **User Action:** User fills out name, email, password on `/register` and submits.
2. **Client Component:** [`RegisterForm.jsx`](file:///d:/connecthub/client/src/components/auth/RegisterForm.jsx)
3. **RTK Action:** `dispatch(registerUser({ name, email, password }))` in [`authSlice.js`](file:///d:/connecthub/client/src/store/slices/authSlice.js)
4. **REST API Call:** `POST /api/auth/register` via Axios instance ([`api.js`](file:///d:/connecthub/client/src/utils/api.js))
5. **Middleware:** Express JSON parser (`express.json()`), CORS validation, Helmet headers.
6. **Controller:** `register` in [`authController.js`](file:///d:/connecthub/server/src/controllers/authController.js)
7. **Validation:** Checks email presence, regex validity, password length $\ge 6$, name presence. Normalizes email to lowercase.
8. **Model & DB Execution:**
   - `User.findOne({ email })` checks for duplicates.
   - `bcrypt.genSalt(10)` and `bcrypt.hash(password, salt)` generate secure hash.
   - `User.create({ name, email, password: hash })` inserts into `users` collection.
   - `Profile.create({ user: user._id })` initializes default user profile document.
9. **Index Used:** Unique index on `users.email`.
10. **Backend Response:** HTTP 201 `{ success: true, token: "jwt...", user: { id, name, email } }`
11. **Client Update:** `authSlice.js` saves token in `localStorage`, sets `state.isAuthenticated = true`, `state.user = payload.user`; router navigates to `/`.

---

### Trace 2: User Login
1. **User Action:** Enters email & password on `/login`.
2. **Client Component:** [`LoginForm.jsx`](file:///d:/connecthub/client/src/components/auth/LoginForm.jsx)
3. **RTK Action:** `dispatch(loginUser({ email, password }))` in [`authSlice.js`](file:///d:/connecthub/client/src/store/slices/authSlice.js)
4. **REST API Call:** `POST /api/auth/login`
5. **Middleware:** Express JSON parser, CORS validation.
6. **Controller:** `login` in [`authController.js`](file:///d:/connecthub/server/src/controllers/authController.js)
7. **Model Execution:** `User.findOne({ email: email.toLowerCase() }).select('+password')`
8. **Authentication:** `bcrypt.compare(password, user.password)`. Rejects on mismatch with uniform 401 message (prevents account enumeration).
9. **JWT Generation:** Signs payload `{ id: user._id }` using `JWT_SECRET` with 7-day expiration (`jwt.sign()`).
10. **Backend Response:** HTTP 200 `{ success: true, token, user }`
11. **Client Update:** Redux stores credentials; Axios sets authorization headers; router navigates to `/`.

---

### Trace 3: Profile Update
1. **User Action:** Edits headline, summary, skills, or experience on `/profile` and clicks "Save Profile".
2. **Client Component:** [`ProfileForm.jsx`](file:///d:/connecthub/client/src/components/profile/ProfileForm.jsx)
3. **RTK Action:** `dispatch(updateProfile(formData))` in [`profileSlice.js`](file:///d:/connecthub/client/src/store/slices/profileSlice.js)
4. **REST API Call:** `PUT /api/profiles/me`
5. **Middleware:** `protect` in [`authMiddleware.js`](file:///d:/connecthub/server/src/middleware/authMiddleware.js) verifies `Bearer <jwt>`, extracts user ID, attaches `req.user`.
6. **Controller:** `updateProfile` in [`profileController.js`](file:///d:/connecthub/server/src/controllers/profileController.js)
7. **Model Execution:**
   - Finds existing profile with `Profile.findOne({ user: req.user._id })`.
   - Mutates fields: `headline`, `summary`, `location`, `skills`, `experience`.
   - Also syncs avatar / name updates to `User` document if specified.
   - `profile.save()` saves document with updated timestamps.
8. **Index Used:** Unique index `{ user: 1 }` on `profiles` collection.
9. **Backend Response:** HTTP 200 `{ success: true, profile: { ... } }`
10. **Client Update:** `profileSlice.js` updates `state.profile`; toast notification confirms update.

---

### Trace 4: Profile Image Upload
1. **User Action:** Selects image file in Avatar upload modal.
2. **Client Component:** [`ProfileHeader.jsx`](file:///d:/connecthub/client/src/components/profile/ProfileHeader.jsx)
3. **RTK Action:** Calls `mediaService.uploadImage(file)` or Axios `POST /api/media/upload` with `FormData`.
4. **REST API Call:** `POST /api/media/upload` (with `multipart/form-data`)
5. **Middleware:**
   - `protect` verifies JWT.
   - `upload.single('file')` in [`mediaMiddleware.js`](file:///d:/connecthub/server/src/middleware/mediaMiddleware.js) validates MIME type (`image/jpeg`, `image/png`, `image/webp`), enforces 5MB limit, stores buffer in memory.
6. **Controller:** `uploadMedia` in [`mediaController.js`](file:///d:/connecthub/server/src/controllers/mediaController.js)
7. **Cloud Execution:**
   - In production: `cloudinary.uploader.upload_stream` pipes the memory buffer directly to Cloudinary.
   - Obtains secure HTTPS CDN URL: `https://res.cloudinary.com/.../image.jpg`.
8. **Backend Response:** HTTP 200 `{ success: true, url, public_id, storage: "cloudinary" }`
9. **Client Update:** Client takes returned URL, sends `PUT /api/profiles/me` with `avatar: url`, updating user & profile documents.

---

### Trace 5: Search Other Users
1. **User Action:** Types search keyword into top Navbar search input and hits Enter.
2. **Client Component:** [`Navbar.jsx`](file:///d:/connecthub/client/src/components/common/Navbar.jsx) navigates to `/network?search=<query>`.
3. **Target Page:** [`network.jsx`](file:///d:/connecthub/client/src/pages/network.jsx) detects query parameter via `useRouter()`.
4. **RTK Action:** `dispatch(fetchProfiles({ search: query }))` in [`networkSlice.js`](file:///d:/connecthub/client/src/store/slices/networkSlice.js)
5. **REST API Call:** `GET /api/profiles?search=<query>`
6. **Middleware:** None (public discovery query).
7. **Controller:** `getProfiles` in [`profileController.js`](file:///d:/connecthub/server/src/controllers/profileController.js)
8. **Multi-Model Query:**
   - First matches matching users by name: `User.find({ name: { $regex: search, $options: 'i' } })`.
   - Then queries `Profile.find({ $or: [{ user: { $in: matchedUserIds } }, { headline: regex }, { summary: regex }, { skills: regex }] })`.
   - Populates `user` (`name`, `avatar`, `headline`).
9. **Backend Response:** HTTP 200 `{ success: true, count, profiles: [...] }`
10. **Client Update:** Redux renders list of matching profile cards with "Connect" buttons and responsive grid layout.

---

### Trace 6: Send Connection Request
1. **User Action:** Clicks "Connect" on another user's profile card.
2. **Client Component:** [`UserCard.jsx`](file:///d:/connecthub/client/src/components/network/UserCard.jsx)
3. **RTK Action:** `dispatch(sendConnectionRequest(recipientUserId))` in [`networkSlice.js`](file:///d:/connecthub/client/src/store/slices/networkSlice.js)
4. **REST API Call:** `POST /api/connections/request` with body `{ recipientId }`
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `sendRequest` in [`connectionController.js`](file:///d:/connecthub/server/src/controllers/connectionController.js)
7. **Integrity Checks:**
   - Validates recipient ID is valid ObjectId.
   - Checks `recipientId !== req.user._id` (cannot connect with oneself $\to$ 400).
   - Checks `Connection.findOne({ $or: [{ requester, recipient }, { requester: recipient, recipient: requester }] })`.
   - If existing connection found with status `accepted` or `pending`, rejects with 400.
8. **Model Execution:** `Connection.create({ requester: req.user._id, recipient: recipientId, status: 'pending' })`
9. **Index Used:** `{ requester: 1, recipient: 1 }`
10. **Backend Response:** HTTP 201 `{ success: true, connection: { ... } }`
11. **Client Update:** Button transitions to "Pending" state in UI.

---

### Trace 7: Accept Connection Request
1. **User Action:** Clicks "Accept" on an invitation in the Invitations section.
2. **Client Component:** [`PendingRequests.jsx`](file:///d:/connecthub/client/src/components/network/PendingRequests.jsx)
3. **RTK Action:** `dispatch(acceptConnection(connectionId))` in [`networkSlice.js`](file:///d:/connecthub/client/src/store/slices/networkSlice.js)
4. **REST API Call:** `POST /api/connections/:id/accept` (or `PUT /api/connections/accept/:id`)
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `acceptRequest` in [`connectionController.js`](file:///d:/connecthub/server/src/controllers/connectionController.js)
7. **Authorization & State Checks:**
   - Retrieves connection: `Connection.findById(id)`.
   - Verifies `connection.recipient.toString() === req.user._id.toString()` (only recipient may accept $\to$ 403 otherwise).
   - Verifies status is `pending` (cannot re-accept $\to$ 400).
8. **Model Execution:** `connection.status = 'accepted'; await connection.save();`
9. **Backend Response:** HTTP 200 `{ success: true, message: 'Connection accepted', connection }`
10. **Client Update:** Item moves from Pending list to Connections list; connection counter increments.

---

### Trace 8: Create Post
1. **User Action:** Enters post text and optionally attaches media URL/file, then clicks "Post".
2. **Client Component:** [`PostForm.jsx`](file:///d:/connecthub/client/src/components/feed/PostForm.jsx)
3. **RTK Action:** `dispatch(createPost({ content, mediaUrl }))` in [`postsSlice.js`](file:///d:/connecthub/client/src/store/slices/postsSlice.js)
4. **REST API Call:** `POST /api/posts`
5. **Middleware:** `protect` verifies token and attaches `req.user`.
6. **Controller:** `createPost` in [`postController.js`](file:///d:/connecthub/server/src/controllers/postController.js)
7. **Validation:** Checks `content` is non-empty string.
8. **Model Execution:**
   - `Post.create({ user: req.user._id, content, mediaUrl, likesCount: 0, commentsCount: 0, isDeleted: false })`
   - Populates author details: `post.populate('user', 'name email avatar headline')`.
9. **Index Used:** `{ isDeleted: 1, createdAt: -1 }`
10. **Backend Response:** HTTP 201 `{ success: true, post }`
11. **Client Update:** `postsSlice.js` prepends new post to `state.posts` array; form resets; post immediately appears at top of feed.

---

### Trace 9: Atomic Likes Toggle
1. **User Action:** Clicks "Like" button on a post.
2. **Client Component:** [`PostCard.jsx`](file:///d:/connecthub/client/src/components/feed/PostCard.jsx)
3. **RTK Action:** `dispatch(toggleLike(postId))` in [`postsSlice.js`](file:///d:/connecthub/client/src/store/slices/postsSlice.js)
4. **REST API Call:** `POST /api/posts/:id/like`
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `toggleLike` in [`postController.js`](file:///d:/connecthub/server/src/controllers/postController.js)
7. **Concurrency Control & Atomic Mutation:**
   - Inspects whether user ID is currently in `post.likes`.
   - If not present: performs atomic `Post.findOneAndUpdate({ _id: id, likes: { $ne: req.user._id } }, { $addToSet: { likes: req.user._id }, $inc: { likesCount: 1 } }, { new: true })`.
   - If already present: performs atomic `Post.findOneAndUpdate({ _id: id, likes: req.user._id }, { $pull: { likes: req.user._id }, $inc: { likesCount: -1 } }, { new: true })`.
   - Prevents race conditions and double-counting without distributed locks.
8. **Backend Response:** HTTP 200 `{ success: true, isLiked: true/false, likesCount, likes }`
9. **Client Update:** `postsSlice.js` updates specific post in Redux state; like icon transitions to active state; count updates.

---

### Trace 10: Add Comment
1. **User Action:** Submits comment text in comment box beneath a post.
2. **Client Component:** [`CommentList.jsx`](file:///d:/connecthub/client/src/components/feed/CommentList.jsx)
3. **RTK Action:** `dispatch(addComment({ postId, content }))` in [`postsSlice.js`](file:///d:/connecthub/client/src/store/slices/postsSlice.js)
4. **REST API Call:** `POST /api/posts/:id/comment` with body `{ content }`
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `addComment` in [`postController.js`](file:///d:/connecthub/server/src/controllers/postController.js)
7. **Model Execution:**
   - `Comment.create({ post: id, user: req.user._id, content: content.trim() })`
   - `Post.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } })`
   - Populates comment author: `comment.populate('user', 'name avatar')`.
8. **Backend Response:** HTTP 201 `{ success: true, comment, commentsCount }`
9. **Client Update:** Comment appends to post's comment list; post's `commentsCount` increments in Redux state.

---

### Trace 11: Edit Comment
1. **User Action:** Comment author clicks "Edit", modifies text, and clicks "Save".
2. **Client Component:** [`CommentList.jsx`](file:///d:/connecthub/client/src/components/feed/CommentList.jsx)
3. **RTK Action:** `dispatch(updateComment({ postId, commentId, content }))` in [`postsSlice.js`](file:///d:/connecthub/client/src/store/slices/postsSlice.js)
4. **REST API Call:** `PUT /api/posts/:id/comment/:commentId` with body `{ content }`
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `updateComment` in [`postController.js`](file:///d:/connecthub/server/src/controllers/postController.js)
7. **Authorization & Mutation:**
   - `Comment.findById(commentId)`
   - Checks `comment.user.toString() === req.user._id.toString()` (returns 403 Forbidden if not comment author).
   - Updates `comment.content = content.trim()`, `comment.updatedAt = new Date()`.
   - `comment.save()`.
8. **Backend Response:** HTTP 200 `{ success: true, comment }`
9. **Client Update:** Comment text updates in-place in UI; edit input closes.

---

### Trace 12: Soft-Delete Post
1. **User Action:** Post author clicks post menu $\to$ "Delete Post".
2. **Client Component:** [`PostCard.jsx`](file:///d:/connecthub/client/src/components/feed/PostCard.jsx)
3. **RTK Action:** `dispatch(deletePost(postId))` in [`postsSlice.js`](file:///d:/connecthub/client/src/store/slices/postsSlice.js)
4. **REST API Call:** `DELETE /api/posts/:id`
5. **Middleware:** `protect` attaches authenticated `req.user`.
6. **Controller:** `deletePost` in [`postController.js`](file:///d:/connecthub/server/src/controllers/postController.js)
7. **Ownership & Deletion:**
   - Verifies `post.user.toString() === req.user._id.toString()` (returns 403 Forbidden otherwise).
   - Marks post: `post.isDeleted = true; post.deletedAt = new Date(); await post.save();`
   - Cascade cleans comments: `await Comment.deleteMany({ post: post._id });`
8. **Backend Response:** HTTP 200 `{ success: true, message: 'Post deleted' }`
9. **Client Update:** Post is filtered out of `state.posts` in Redux; disappears from UI with smooth transition.

---

### Trace 13: Public SSR Profile Page
1. **User Action:** External user or web crawler navigates to `/profile/[id]`.
2. **Next.js Server Execution:** `getServerSideProps(context)` executes on Next.js Node server before any HTML reaches browser.
3. **Target File:** [`client/src/pages/profile/[id].jsx`](file:///d:/connecthub/client/src/pages/profile/[id].jsx)
4. **Data Fetching:** Calls `fetch(`${API_URL}/api/profiles/${id}`)` directly server-to-server.
5. **OpenGraph Injection:**
   - Injects dynamic metadata into `<Head>`:
     - `<title>{user.name} - ConnectHub</title>`
     - `<meta property="og:title" content={`${user.name} | ${profile.headline}`} />`
     - `<meta property="og:description" content={profile.summary} />`
     - `<meta property="og:image" content={user.avatar} />`
6. **HTML Delivery:** Fully rendered HTML and CSS delivered to crawler or browser.
7. **Client Hydration:** React hydrates on client for subsequent client-side navigation.

---

### Trace 14: PDF Resume Generation
1. **User Action:** User clicks "Download PDF Resume" on profile page.
2. **Client Component:** [`ProfileHeader.jsx`](file:///d:/connecthub/client/src/components/profile/ProfileHeader.jsx) triggers browser navigation to `${NEXT_PUBLIC_API_URL}/api/profiles/${id}/pdf`.
3. **REST API Call:** `GET /api/profiles/:id/pdf`
4. **Middleware:** None (public profile export).
5. **Controller:** `generateProfilePDF` in [`profileController.js`](file:///d:/connecthub/server/src/controllers/profileController.js)
6. **Model Execution:** `Profile.findOne({ user: id }).populate('user', 'name email headline avatar')`
7. **PDF Stream Engine:** [`pdfGenerator.js`](file:///d:/connecthub/server/src/utils/pdfGenerator.js)
   - Initializes `PDFDocument` instance in memory.
   - Writes professional header (Name, Headline, Email).
   - Renders formatted Summary, Skills tags, and Work Experience blocks.
   - Streams chunks directly to `res.write()` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="resume.pdf"`.
   - Calls `doc.end()`.
8. **Browser Action:** File download dialog saves `resume.pdf` to local disk.

---

## 4. Security & Production Controls

| Threat / Risk | ConnectHub Mitigation & Implementation |
|---|---|
| **SQL / NoSQL Injection** | Mongoose strict schema casting prevents injection payloads; parameterized queries. |
| **Cross-Site Scripting (XSS)** | React JSX auto-escapes string interpolation; Helmet sets secure `Content-Security-Policy`. |
| **Clickjacking** | Helmet sets `X-Frame-Options: SAMEORIGIN`. |
| **MIME Sniffing** | Helmet sets `X-Content-Type-Options: nosniff`. |
| **Brute-Force Auth Attacks** | `express-rate-limit` limits IP requests across auth endpoints. |
| **Password Rainbow Tables** | `bcryptjs` with salt work-factor of 10 applied before saving to MongoDB. |
| **Token Hijacking / Replay** | Short-lived signed JWTs with expiration; signature checked against `JWT_SECRET`. |
| **Unauthorized Resource Access** | Strict ownership comparison (`req.user._id.toString() === resource.user.toString()`) before update or delete. |
| **CORS Exploits** | Multi-origin CORS whitelist matches only explicitly configured production client domains. |
| **Unbounded Query DoS** | Hard-capped pagination limits (`limit = Math.min(parseInt(limit), 50)`). |
| **Ephemeral Disk File Loss** | Cloudinary streams to memory buffer; local disk fallback blocked in production. |

---

## 5. Architectural Trade-offs & Limitations

1. **REST Polling vs WebSockets:**
   - *Design Choice:* ConnectHub utilizes REST APIs and client-triggered state refreshes rather than persistent WebSockets or Server-Sent Events (SSE).
   - *Rationale:* WebSockets require persistent TCP connections, which complicate autoscaling on serverless or single-dyno PaaS tiers (Render free tier shuts down idle connections). REST enables stateless caching and high horizontal elasticity.
   - *Limitation:* Real-time live notifications requires periodic polling or manual feed refresh.
2. **Stateless JWTs vs Revocable Redis Session Store:**
   - *Design Choice:* Signed JWTs contain user claims without querying a centralized session store on every request.
   - *Rationale:* Eliminates Redis dependency, reducing infrastructure complexity and cloud cost to zero.
   - *Limitation:* Tokens cannot be instantly revoked before their expiration time without maintaining a token denylist.
3. **Cloudinary Dependency in Production:**
   - *Design Choice:* Uploads require Cloudinary credentials in production.
   - *Rationale:* Prevents ephemeral disk data loss on container rebuilds.
   - *Limitation:* If Cloudinary service is unreachable, media uploads fail gracefully with HTTP 502 rather than corrupting local disk state.
