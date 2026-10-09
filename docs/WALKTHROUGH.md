# ConnectHub — Platform Walkthrough & Verification Guide

This walkthrough covers all essential developer and user verification workflows for **ConnectHub**.

---

## 1. Quick Start (Local Verification)

### Step 1: Install Dependencies
```bash
npm run install:all
```
Installs root, server, and client npm dependencies in one step.

### Step 2: (Optional) Opt-in Development Seeder
To populate sample profiles, connections, and initial posts for development:
```bash
npm run seed
```
*(Note: Production startup strictly forbids automatic fake data population; seeding is opt-in).*

### Step 3: Start Concurrently in Development Mode
```bash
npm run dev
```
- Express REST API starts on `http://localhost:5000`
- Next.js Web App starts on `http://localhost:3000`

---

## 2. Step-by-Step User Journey Verification

### Journey 1: User Registration & Onboarding
1. Navigate to `http://localhost:3000/register`.
2. Fill out **Full Name** (e.g., "Elena Rostova"), **Email** ("elena@techcorp.io"), and **Password** ("Password123!").
3. Click **Create Account**.
4. The client issues `POST /api/auth/register`, receives a signed JWT token, persists it in `localStorage`, updates Redux auth state, and redirects to the feed.

### Journey 2: Rich Profile Customization & Photo Upload
1. Click the **Profile** icon in the navigation bar (`http://localhost:3000/profile`).
2. Hover over the avatar and click the camera badge button, or click **Edit Profile**.
3. In the profile modal:
   - Click **Upload Photo** to pick an image from your computer (uploaded via `POST /api/media/upload` and hosted on Cloudinary or local disk).
   - Enter your **Headline** (e.g., "Principal Distributed Systems Engineer").
   - Add **Skills** (e.g., "Node.js, MongoDB, Distributed Systems, Next.js").
   - Add a career **Experience** item with title, company, dates, and description.
4. Click **Save Changes**. The UI immediately updates and synchronizes globally via Redux.

### Journey 3: Professional Networking & Connection Lifecycle
1. Open an incognito browser window or second browser.
2. Register a second user (e.g., "Marcus Vance", `marcus@techcorp.io`).
3. In Marcus's window, navigate to **My Network** (`http://localhost:3000/network`).
4. In the search bar or suggestions list, find "Elena Rostova" and click **Connect**.
   - An invitation is sent via `POST /api/connections/request` with status `pending`.
5. Switch back to Elena's window and refresh or visit **My Network** -> **Invitations**.
6. Elena sees Marcus's invitation. Click **Accept**.
   - Mutual connection status updates to `accepted` via `POST /api/connections/:id/accept`.
   - Marcus now appears under Elena's **My Connections** tab with mutual connection counts incremented.

### Journey 4: Multimedia Post Creation & Live Image Attachment
1. On the main feed (`http://localhost:3000`), click **Start a post**.
2. Type an update (e.g., "Excited to share our team's architecture benchmarks for distributed stream processing!").
3. Click **Add Image / Media** -> **Upload File**. Select an image diagram from your computer.
   - The file is streamed to the backend, stored in Cloudinary/local storage, and rendered as a preview thumbnail with a quick-remove option.
4. Click **Post**. The post appears instantly at the top of the feed stream.

### Journey 5: Inline Post Editing (Own Post Only)
1. On the post Elena just published, locate the action buttons in the top right of the card.
2. Click the **Edit (Pencil)** icon.
3. The card content transforms into an inline editing textarea.
4. Update the text: "Excited to share our benchmarks! (Updated with slide deck links)".
5. Click **Save**. The post updates in real-time in Redux and persists in MongoDB via `PUT /api/posts/:id`.
6. Notice that other users (like Marcus) only see like and share actions—they cannot see edit or delete buttons for Elena's posts.

### Journey 6: Social Interactions (Atomic Likes & Discussion Comments)
1. Switch to Marcus's session on the feed.
2. Click the **Like** button on Elena's post.
   - The thumbs-up icon fills with brand color and the counter increments atomically to `1 Like`.
3. Click **Comment** -> Type "Congratulations Elena, inspiring work!" -> Click **Comment**.
   - The comment thread immediately expands and updates in the feed.
4. Marcus can click **Edit** on his comment to revise the text, or **Delete** to remove it.
5. Elena (as post author) has moderation privileges to delete any inappropriate comments on her post.

### Journey 7: Soft-Deletion
1. In Elena's session, click the **Trash** icon on her post and confirm deletion.
2. The post is soft-deleted (`isDeleted: true` with `deletedAt` timestamp).
3. The post disappears immediately from the active feed for all users. Direct URL lookups now return `404 Not Found`.

### Journey 8: Public SSR Previews (Social Sharing)
1. Copy the public URL of Elena's profile (`http://localhost:3000/profile/<elenaUserId>`).
2. Open this link in an unauthenticated / private browser window.
3. The page renders via Next.js `getServerSideProps` with server-side rendered HTML and OpenGraph metadata (`og:title`, `og:description`, `og:image`).

### Journey 9: Automated PDF Resume Generation
1. On Elena's profile page, click **Export PDF Resume** (or access `http://localhost:5000/api/profiles/<elenaUserId>/pdf`).
2. The backend dynamically generates a formatted, professional PDF document via PDFKit streaming back a valid `%PDF-` document with user name, contact, career experiences, and skills.

---

## 3. Automated Verification Commands

Run the full automated test suite (7 suites, 122 tests):
```bash
npm test
```

Run the production build (Node verification + Next.js build):
```bash
npm run build
```

Run the automated 20-flow smoke test harness:
```bash
node scripts/smoke_test.js
```
*(Ensure `npm run dev` is running concurrently in another terminal)*.
