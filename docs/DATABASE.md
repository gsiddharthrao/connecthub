# ConnectHub — Database Architecture & Schema Specification

## 1. Overview & Cloud Setup

ConnectHub uses **MongoDB Atlas** as its cloud persistent data store managed through the **Mongoose** Object-Document Mapper (ODM).

### Production Configuration:
- Connection URI: `MONGODB_URI` environment variable using MongoDB SRV connection string:
  ```text
  mongodb+srv://<user>:<password>@<cluster>.mongodb.net/connecthub?retryWrites=true&w=majority
  ```
- Fast-fail guard: The server strictly terminates (`process.exit(1)`) on boot if `NODE_ENV === 'production'` and `MONGODB_URI` is not configured.
- Connection Pool:
  - `maxPoolSize`: 10 (parallel connections per worker process)
  - `minPoolSize`: 2 (warm baseline pool)
  - `socketTimeoutMS`: 45000ms
  - `serverSelectionTimeoutMS`: 10000ms
  - `family`: 4 (forces IPv4 DNS resolution for cloud routing reliability)

---

## 2. Entity Relationship Model (ERD)

```
       +------------------+
       |       User       |
       +--------+---------+
                | 1:1
                v
       +------------------+
       |     Profile      |
       +------------------+

       +------------------+         1:N         +------------------+
       |       User       | ------------------< |       Post       |
       +--------+---------+                     +--------+---------+
                |                                        |
                | 1:N                                    | 1:N
                v                                        v
       +------------------+                     +------------------+
       |    Connection    |                     |     Comment      |
       +------------------+                     +------------------+
```

---

## 3. Schemas, Constraints & Indexes

### 3.1 User Schema (`server/src/models/User.js`)
Stores core identity and authentication credentials.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | Auto-generated primary key | Unique identifier |
| `name` | String | Required, trim, min: 2, max: 50 | User full name |
| `email` | String | Required, unique, lowercase, regex validated | Email address (unique index) |
| `password` | String | Required, min: 6, `select: false` | 10-round bcrypt hash |
| `avatar` | String | Default: Unsplash placeholder | Profile image URL |
| `role` | String | Enum: `['user', 'admin']`, default: `'user'` | Role-based authorization |
| `createdAt` | Date | Auto-populated | Record creation timestamp |
| `updatedAt` | Date | Auto-populated | Record update timestamp |

**Indexes**:
- `email: 1` (Unique index, case-normalized)

**Security Hooks**:
- `pre('save')`: Hashes modified password using `bcrypt.genSalt(10)` and `bcrypt.hash()`.
- `toJSON()`: Strips `password` and `__v` from all JSON serialization outputs.

---

### 3.2 Profile Schema (`server/src/models/Profile.js`)
Rich professional profile associated 1-to-1 with a User.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `user` | ObjectId | Ref: `'User'`, Required, Unique | References associated User |
| `headline` | String | Trim, max: 140, default: `''` | Professional headline |
| `summary` | String | Trim, max: 3000, default: `''` | Career summary / About |
| `location` | String | Trim, default: `''` | Geographic location |
| `website` | String | Trim, default: `''` | Personal portfolio or company URL |
| `skills` | [String] | Array of trimmed strings | Key professional skills |
| `experience`| [Object] | Subdocument array | Job positions, companies, dates |
| `education` | [Object] | Subdocument array | Schools, degrees, fields of study |
| `social` | Object | Nested object | LinkedIn, GitHub, Twitter handles |

**Indexes**:
- `user: 1` (Unique index)
- `skills: 1` (Multikey index for fast skills queries)
- Text Index: `{ headline: 'text', summary: 'text', location: 'text' }` (Full-text search)

---

### 3.3 Post Schema (`server/src/models/Post.js`)
User status updates, multimedia shares, and activity feeds.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `user` | ObjectId | Ref: `'User'`, Required | Post author |
| `content` | String | Required, trim, max: 2000 | Text content of post |
| `image` | String | Default: `''` | Primary media URL |
| `mediaUrl` | String | Default: `''` | Synchronized media URL |
| `likes` | [ObjectId] | Ref: `'User'` | Array of user IDs who liked post |
| `likesCount`| Number | Default: 0, min: 0 | Atomic counter for likes |
| `commentsCount` | Number | Default: 0, min: 0 | Counter for active comments |
| `isDeleted` | Boolean | Default: `false`, indexed | Soft-deletion flag |
| `deletedAt` | Date | Default: `null` | Soft-deletion timestamp |

**Indexes**:
- `user: 1` (Fast author post retrieval)
- `isDeleted: 1` (Filters feed queries to active posts only)
- `createdAt: -1` (Enables reverse-chronological feed sorting)

---

### 3.4 Connection Schema (`server/src/models/Connection.js`)
Bidirectional professional relationship tracking.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `requester`| ObjectId | Ref: `'User'`, Required | User sending the connection invite |
| `recipient`| ObjectId | Ref: `'User'`, Required | Target user receiving the invite |
| `status` | String | Enum: `['pending', 'accepted', 'rejected']` | Current state of invitation |

**Indexes**:
- `{ requester: 1, recipient: 1 }` (Unique compound index preventing duplicate invites)
- `{ requester: 1, status: 1 }` (Optimizes pending outgoing lookups)
- `{ recipient: 1, status: 1 }` (Optimizes incoming invitation queries)

---

### 3.5 Comment Schema (`server/src/models/Comment.js`)
Threaded discussions on posts.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `post` | ObjectId | Ref: `'Post'`, Required | Post reference |
| `user` | ObjectId | Ref: `'User'`, Required | Comment author |
| `content` | String | Required, trim, max: 1000 | Comment body text |
| `text` | String | Synchronized with `content` | Backward-compatibility alias |

**Indexes**:
- `post: 1, createdAt: 1` (Compound index for chronological comment rendering)
- `user: 1` (User comment history lookups)

---

## 4. Atomic Updates & Concurrency Control

1. **Like Toggling**:
   Likes are toggled using atomic MongoDB operations (`findOneAndUpdate` with `$pull` and `$inc`) to prevent race conditions during high concurrent traffic:
   ```javascript
   // Atomic Unlike
   await Post.findOneAndUpdate(
     { _id: id, likes: req.user._id },
     { $pull: { likes: req.user._id }, $inc: { likesCount: -1 } },
     { new: true }
   );
   ```

2. **Soft-Delete Architecture**:
   Posts are soft-deleted by setting `isDeleted = true` and recording `deletedAt`. All public feed and ID lookups include `{ isDeleted: { $ne: true } }`, preserving data integrity for audits while instantly hiding deleted posts from public APIs.
