# ConnectHub — REST API Specification

Base URL: `http://localhost:5000/api` (Local) / `https://your-backend.onrender.com/api` (Production)

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `201 Created`: Returns JWT token and sanitized user object.
  - `400 Bad Request`: Validation error (missing fields or password < 6 characters).
  - `409 Conflict`: Email already exists.

### 1.2 User Login
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT token and user profile.
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Get Current Authenticated User
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Access**: Protected (`Bearer <token>`)
- **Responses**:
  - `200 OK`: Returns current user and profile.
  - `401 Unauthorized`: Missing or invalid token.

### 1.4 Demo Login (Development Only)
- **Method**: `POST`
- **Route**: `/api/auth/demo`
- **Access**: Public (Gated in production)
- **Responses**:
  - `200 OK`: Auto-authenticates demo user (Sarah Chen) in development.
  - `403 Forbidden`: Blocked in production when `ENABLE_DEMO_LOGIN !== 'true'`.

### 1.5 User Logout
- **Mechanism**: Client-side stateless token removal (`localStorage.removeItem('token')`).
- **Access**: Client-side Redux action (`logoutUser`).
- **Server Behavior**: Stateless JWT. The server does not maintain a server-side revocation list or stateful Redis store. Discarded tokens expire naturally via their 7-day TTL (`JWT_EXPIRES_IN=7d`). Subsequent requests from the client without the `Authorization` header receive HTTP 401 Unauthorized.

---

## 2. Profile Endpoints (`/api/profiles`)

### 2.1 Get Current User Profile
- **Method**: `GET`
- **Route**: `/api/profiles/me`
- **Access**: Protected
- **Responses**:
  - `200 OK`: Returns active user's profile and populated user record.

### 2.2 Update Current User Profile
- **Method**: `PUT`
- **Route**: `/api/profiles/me`
- **Access**: Protected
- **Request Body**:
  ```json
  {
    "headline": "Senior Software Architect",
    "summary": "Building large-scale cloud-native distributed platforms.",
    "location": "Seattle, WA",
    "website": "https://example.com",
    "skills": ["Node.js", "React", "MongoDB", "Cloud Architecture"],
    "experience": [
      {
        "title": "Principal Engineer",
        "company": "Tech Corp",
        "location": "Seattle, WA",
        "from": "2021-01-01",
        "current": true,
        "description": "Architecting core platform microservices."
      }
    ]
  }
  ```
- **Responses**:
  - `200 OK`: Returns updated profile object.

### 2.3 List Profiles / Search
- **Method**: `GET`
- **Route**: `/api/profiles`
- **Access**: Public
- **Query Parameters**:
  - `search` (optional): Search keywords matching headline, skills, or location.
  - `page` (optional): Page number (default: 1).
  - `limit` (optional): Results per page (default: 20).
- **Responses**:
  - `200 OK`: Returns paginated profiles array, total count, and pages.

### 2.4 Get Profile by User ID
- **Method**: `GET`
- **Route**: `/api/profiles/:id`
- **Access**: Public
- **Responses**:
  - `200 OK`: Returns profile document.
  - `400 Bad Request`: Invalid ObjectId.
  - `404 Not Found`: Profile not found.

### 2.5 Generate Profile PDF Resume
- **Method**: `GET`
- **Route**: `/api/profiles/:id/pdf` (also alias `/api/pdf/:id`)
- **Access**: Public
- **Responses**:
  - `200 OK`: Streams `application/pdf` binary with `Content-Disposition: inline`.

---

## 3. Post Endpoints (`/api/posts`)

### 3.1 List Feed Posts
- **Method**: `GET`
- **Route**: `/api/posts`
- **Access**: Public
- **Query Parameters**: `page`, `limit`
- **Responses**:
  - `200 OK`: Returns array of non-deleted posts sorted in reverse chronological order.

### 3.2 Create Post
- **Method**: `POST`
- **Route**: `/api/posts`
- **Access**: Protected
- **Request Body**:
  ```json
  {
    "content": "Excited to share our team just launched our new microservices cluster!",
    "mediaUrl": "https://res.cloudinary.com/.../post.png"
  }
  ```
- **Responses**:
  - `201 Created`: Returns newly created post document.
  - `400 Bad Request`: Post content is required.

### 3.3 Get Single Post
- **Method**: `GET`
- **Route**: `/api/posts/:id`
- **Access**: Public
- **Responses**:
  - `200 OK`: Returns post document with populated author.
  - `404 Not Found`: Post does not exist or has been soft-deleted.

### 3.4 Edit Own Post
- **Method**: `PUT`
- **Route**: `/api/posts/:id`
- **Access**: Protected (Author only)
- **Request Body**:
  ```json
  {
    "content": "Updated content with additional technical clarifications."
  }
  ```
- **Responses**:
  - `200 OK`: Returns updated post.
  - `400 Bad Request`: Empty content.
  - `403 Forbidden`: Non-author attempt to edit post.
  - `404 Not Found`: Post not found.

### 3.5 Soft-Delete Post
- **Method**: `DELETE`
- **Route**: `/api/posts/:id`
- **Access**: Protected (Author only)
- **Responses**:
  - `200 OK`: Marks post as soft-deleted (`isDeleted = true`).
  - `403 Forbidden`: Non-author attempt to delete post.

### 3.6 Toggle Like
- **Method**: `POST` (or `PUT`)
- **Route**: `/api/posts/:id/like`
- **Access**: Protected
- **Responses**:
  - `200 OK`: Returns `{ success: true, isLiked: boolean, likesCount: number }`.

### 3.7 Add Comment
- **Method**: `POST`
- **Route**: `/api/posts/:id/comment`
- **Access**: Protected
- **Request Body**:
  ```json
  {
    "content": "Great milestone! Looking forward to hearing more."
  }
  ```
- **Responses**:
  - `201 Created`: Returns newly created comment.

### 3.8 List Post Comments
- **Method**: `GET`
- **Route**: `/api/posts/:id/comments`
- **Access**: Public
- **Responses**:
  - `200 OK`: Returns array of comments for post with author details.

### 3.9 Edit Comment
- **Method**: `PUT`
- **Route**: `/api/posts/:id/comment/:commentId`
- **Access**: Protected (Comment author only)

### 3.10 Delete Comment
- **Method**: `DELETE`
- **Route**: `/api/posts/:id/comment/:commentId`
- **Access**: Protected (Comment author or Post author)

---

## 4. Connection Endpoints (`/api/connections`)

### 4.1 Send Connection Request
- **Method**: `POST`
- **Route**: `/api/connections/request`
- **Access**: Protected
- **Request Body**: `{ "recipientId": "<userId>" }`
- **Responses**:
  - `201 Created`: Created pending connection.
  - `400 Bad Request`: Request to self or duplicate request.

### 4.2 Accept Connection Request
- **Method**: `POST` (or `PUT`)
- **Route**: `/api/connections/:id/accept` (or `/api/connections/accept/:id`)
- **Access**: Protected (Recipient only)
- **Responses**:
  - `200 OK`: Connection status updated to `'accepted'`.
  - `403 Forbidden`: Non-recipient attempt to accept.

### 4.3 Reject Connection Request
- **Method**: `POST` (or `PUT`)
- **Route**: `/api/connections/:id/reject`
- **Access**: Protected (Recipient only)
- **Responses**:
  - `200 OK`: Connection status updated to `'rejected'`.

### 4.4 List Active Connections
- **Method**: `GET`
- **Route**: `/api/connections`
- **Access**: Protected
- **Responses**:
  - `200 OK`: Returns all accepted mutual connections for user.

### 4.5 List Pending Requests
- **Method**: `GET`
- **Route**: `/api/connections/pending`
- **Access**: Protected
- **Responses**:
  - `200 OK`: Returns `{ incoming: [...], outgoing: [...] }`.

---

## 5. Media Upload Endpoints (`/api/media`)

### 5.1 Upload Media File
- **Method**: `POST`
- **Route**: `/api/media/upload`
- **Access**: Public / Protected
- **Body**: `multipart/form-data` with field `file` or `image` (max 5MB; JPEG, PNG, WEBP, GIF only; SVG strictly rejected for XSS prevention)
- **Responses**:
  - `200 OK`: Returns `{ success: true, url: string, filename: string, storage: "cloudinary"|"local" }`.
  - `400 Bad Request`: File size exceeded, invalid MIME type, or SVG file uploaded.
  - `500 / 502`: Storage configuration error in production if Cloudinary is missing or fails.
