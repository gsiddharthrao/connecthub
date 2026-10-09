# ConnectHub Production Deployment Guide

This guide walks you step-by-step through configuring a real cloud database (MongoDB Atlas) and deploying **ConnectHub** for real users on **Netlify** (frontend) and **Render / Railway** (backend), as well as Docker options.

---

## Architecture Overview

```
                                      ┌─────────────────────────────────┐
                                      │         Cloud Services          │
                                      │                                 │
                                      │  ┌───────────────────────────┐  │
                                      │  │       MongoDB Atlas       │  │
                                      │  │    (Cloud Data Cluster)   │  │
                                      │  └─────────────▲─────────────┘  │
                                      │                │                │
                                      │  ┌─────────────┴─────────────┐  │
                                      │  │        Cloudinary         │  │
                                      │  │     (Media Storage)       │  │
                                      │  └─────────────▲─────────────┘  │
                                      └────────────────┼────────────────┘
                                                       │
               HTTPS API Calls                         │ Mongoose / Stream
┌──────────────────────────────┐        ┌──────────────┴───────────────┐
│       Frontend Client        ├───────►│         Backend API          │
│          (Netlify)           │◄───────┤       (Render / Railway)     │
│                              │  CORS  │                              │
│   Next.js 14 + Redux + UI    │        │  Express + JWT + REST + PDF  │
└──────────────────────────────┘        └──────────────────────────────┘
```

---

## Step 1: Cloud Database Setup (MongoDB Atlas — Free)

ConnectHub uses MongoDB for user profiles, posts, comments, and connections. Follow these steps to get a free cloud database:

1. Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Click **Create Deployment** and choose the **M0 (Free)** shared cluster in your preferred region.
3. Under **Security Quickstart**:
   - **Database User**: Create a user (e.g., username `connecthub_admin` with a secure password). Save these credentials!
   - **IP Access List**: Go to **Network Access** → **Add IP Address** → choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
     *(This is required so cloud hosting providers like Render and Netlify can connect to your database).*
4. Under **Database** → Click **Connect** → choose **Drivers** (Node.js).
5. Copy the connection string. It will look like this:
   ```text
   mongodb+srv://connecthub_admin:<password>@cluster0.abcde.mongodb.net/connecthub?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password and ensure the database name at the end is `/connecthub`.

---

## Step 2: Cloud Media Storage Setup (Cloudinary — Free)

ConnectHub uploads avatars and post images directly to Cloudinary (with fallback to local storage if omitted):

1. Sign up for a free account at [cloudinary.com](https://cloudinary.com).
2. On your Cloudinary Dashboard, copy:
   - **Cloud Name** (e.g. `dxy8abc12`)
   - **API Key** (e.g. `123456789012345`)
   - **API Secret** (e.g. `abcdef1234567890_ghijklmnop`)

---

## Step 3: Deploy Backend API (Render.com — Free Web Service)

Deploy the Express REST API backend first so you have your production API URL ready:

1. Push your repository to **GitHub** or **GitLab**.
2. Sign in to [render.com](https://render.com) and click **New +** → **Web Service**.
3. Select your repository.
4. Configure the Web Service settings:
   - **Name**: `connecthub-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. In **Environment Variables**, add:
   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGODB_URI` | *Your MongoDB Atlas connection string from Step 1* |
   | `JWT_SECRET` | *A random 64-character secret string* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | `https://your-app-name.netlify.app` *(update with your Netlify URL after Step 4)* |
   | `CLOUDINARY_CLOUD_NAME` | *Your Cloudinary cloud name* |
   | `CLOUDINARY_API_KEY` | *Your Cloudinary API key* |
   | `CLOUDINARY_API_SECRET` | *Your Cloudinary API secret* |
6. Click **Deploy Web Service**.
7. Once deployed, note down your Render URL:
   `https://connecthub-api.onrender.com`
   *(Your API base will be: `https://connecthub-api.onrender.com/api`)*.

> **Health Check**: Open `https://connecthub-api.onrender.com/api/health` in your browser. You should see:
> `{"success": true, "status": "healthy", "message": "ConnectHub API and Database are operational", "database": {"status": "connected"}}`

---

## Step 4: Deploy Frontend (Netlify — Free)

The repository already includes [`client/netlify.toml`](file:///d:/connecthub/client/netlify.toml) pre-configured with the `@netlify/plugin-nextjs` runtime.

1. Sign in to [netlify.com](https://www.netlify.com).
2. Click **Add new site** → **Import an existing project** → select your Git repository.
3. Configure the build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/.next` (handled automatically by Netlify Next.js plugin)
4. Under **Site configuration** → **Environment variables**, add:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://connecthub-api.onrender.com/api` |
   | `INTERNAL_API_URL` | `https://connecthub-api.onrender.com/api` |
   | `NODE_VERSION` | `20` |
5. Click **Deploy Site**.
6. When deployment finishes, Netlify provides your live site URL:
   `https://your-app-name.netlify.app`
7. **Important**: Go back to your Render backend dashboard and update `CLIENT_URL` to match your live Netlify domain so CORS allows requests.

---

## Alternative Deployment Options

### Option A: 1-Click Frontend Deployment on Vercel
1. Import repository on [vercel.com](https://vercel.com).
2. Set Root Directory to `client`.
3. Add environment variable `NEXT_PUBLIC_API_URL=https://connecthub-api.onrender.com/api`.
4. Deploy!

### Option B: Backend Deployment on Railway.app
1. Create a new project on [railway.app](https://railway.app) from your GitHub repo.
2. Railway detects [`server/Procfile`](file:///d:/connecthub/server/Procfile) and starts `node src/server.js`.
3. Set your environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`) in the Railway dashboard.

### Option C: Complete Single-Command Docker Deployment (VPS / Self-Hosted)
Run the entire platform (MongoDB + Backend + Next.js frontend) with one command on any Ubuntu, Debian, or cloud VPS:

```bash
# Clone repository
git clone <your-repo-url>
cd connecthub

# Start all 3 services in background
docker compose up -d --build
```

- **Frontend**: Available at `http://your-server-ip:3000`
- **Backend API**: Available at `http://your-server-ip:5000/api`
- **MongoDB**: Automatically provisioned with persistent volume `mongo_data`

---

## Production Security & Reliability Features

ConnectHub includes built-in safeguards for production environments:

1. **IPv4 Cloud DNS Routing**: Mongoose option `family: 4` prevents IPv6 timeout issues common on cloud platforms.
2. **Reverse Proxy Trust**: `app.set('trust proxy', 1)` correctly parses client IP addresses behind Netlify and Render CDNs.
3. **Multi-Domain CORS**: `CLIENT_URL` accepts comma-separated origins (e.g. `https://my-site.netlify.app,https://my-domain.com`).
4. **Graceful Process Shutdown**: Listens to `SIGTERM` and `SIGINT` to cleanly close HTTP listeners and MongoDB connection pools before process exit.
5. **Live Health Monitoring**: Endpoint `GET /api/health` monitors database connection state and uptime.
6. **Graceful Storage Fallbacks**: If Cloudinary credentials are omitted or fail, media safely saves to local disk (`/uploads`).
