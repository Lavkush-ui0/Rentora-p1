# 🚀 Rentora — Complete Production Hosting Guide

This guide provides step-by-step instructions for deploying **Rentora** (Supabase PostgreSQL + Render Backend + Vercel Frontend).

---

## 🏗️ Architecture Overview

```
+---------------------------------+       +------------------------------------+       +------------------------+
|       Vercel (Frontend)         | ----> |     Render.com (Backend API)       | ----> |  Supabase (PostgreSQL) |
| https://rentora-test-client.    |       | https://rentora-test.onrender.com  |       |   12 Relational Tables |
| vercel.app                      |       |                                    |       |   Row-Level Security   |
+---------------------------------+       +------------------------------------+       +------------------------+
                                                            |
                                                   (Socket.IO WebSockets)
```

### Why host the backend on Render with Supabase & Vercel?
- **Supabase** provides a high-performance cloud PostgreSQL database with relational tables, foreign key constraints, and instant querying.
- **Render.com** provides a continuous Node.js server environment ideal for Express APIs and real-time **Socket.IO WebSockets**.
- **Vercel** delivers global CDN edge caching for the fast Vite React frontend.

---

## 📍 Step 1: Configure Supabase Database

1. Sign in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Create a new project (e.g. `rentora-db`).
3. Open the **SQL Editor** in the left navigation sidebar.
4. Open the [`supabase_setup.sql`](file:///supabase_setup.sql) file from this repository, paste it into the editor, and click **Run**.
   * *This creates all 12 tables (`users`, `categories`, `listings`, `rental_requests`, `conversations`, `messages`, `otps`, `reports`, `reviews`, `notifications`, `product_interchanges`).*
5. Go to **Project Settings** > **API**:
   - Copy **Project URL** (`https://xxxx.supabase.co`) $\rightarrow$ `SUPABASE_URL`
   - Copy **service_role (secret)** or **anon (public)** key $\rightarrow$ `SUPABASE_KEY`

---

## 📍 Step 2: Deploy Backend to Render.com

1. Sign in to [Render.com](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `Lavkush-ui0/rentora-test`.
4. Configure Web Service Settings:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variables:

| Key | Value / Example |
|---|---|
| `PORT` | `5001` |
| `NODE_ENV` | `production` |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_KEY` | `eyJhbGciOi...` (service_role secret key) |
| `CLIENT_URL` | `https://rentora-test-client.vercel.app` |
| `JWT_ACCESS_SECRET` | *(64-char random secret)* |
| `JWT_REFRESH_SECRET` | *(64-char random secret)* |
| `ALLOWED_EMAIL_DOMAIN` | `niet.co.in` |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster...` |
| `JWT_ACCESS_SECRET` | `your_super_secret_access_key_123` |
| `JWT_REFRESH_SECRET` | `your_super_secret_refresh_key_456` |
| `CLIENT_URL` | `https://niet-rentora.vercel.app` *(update after Step 3)* |
| `ALLOWED_EMAIL_DOMAIN` | `niet.co.in` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your-email@gmail.com` |
| `SMTP_PASS` | `your-app-password` |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` *(optional)* |
| `CLOUDINARY_API_KEY` | `your_api_key` |
| `CLOUDINARY_API_SECRET` | `your_api_secret` |

6. Click **Create Web Service**. Render will build and host your backend at e.g., `https://rentora-backend.onrender.com`.

---

## 📍 Step 3: Deploy Frontend to Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository: `Lavkush-ui0/Rentora-p1`.
4. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select **`client`**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://rentora-backend.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://rentora-backend.onrender.com` |

6. Click **Deploy**. Vercel will build the frontend and provide a URL like `https://rentora-frontend.vercel.app`.

*Note: The project already includes `client/vercel.json` configured for client-side SPA routing fallbacks (`/explore`, `/my-rentals`, etc.).*

---

## 📍 Step 4: Sync & Verify Connection

1. Return to **Render.com** > `rentora-backend` > **Environment**.
2. Ensure `CLIENT_URL` matches your exact Vercel URL:
   `https://niet-rentora.vercel.app`
3. Click **Save Changes** (Render will auto-redeploy).
4. Test application registration, login, real-time Socket.IO chat, and notifications on your live Vercel URL!

---

🎉 **Congratulations! Your Rentora Platform is now fully hosted in production.**
