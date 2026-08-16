# 🚀 Rentora — Complete Production Hosting Guide

This guide provides step-by-step instructions for deploying **Rentora** (MongoDB Atlas + Render Backend + Vercel Frontend).

---

## 🏗️ Architecture Overview

```
+---------------------------------+       +------------------------------------+       +------------------------+
|       Vercel (Frontend)         | ----> |     Render.com (Backend API)       | ----> |   MongoDB Atlas (DB)   |
| https://rentora-client.vercel.app|       | https://rentora-backend.onrender.com|       |    Database Storage    |
+---------------------------------+       +------------------------------------+       +------------------------+
                                                            |
                                                   (Socket.IO WebSockets)
```

### Why host the backend separately from MongoDB & Vercel?
- **MongoDB Atlas** is purely a database service — it does not run Node.js code or server logic.
- **Vercel** uses short-lived Serverless Functions, which break persistent **Socket.IO WebSocket** connections required for Rentora's real-time chat and notifications.
- **Render.com** (or Railway) provides a continuous Node.js server environment ideal for Express APIs and WebSockets.

---

## 📍 Step 1: Configure MongoDB Atlas (Database)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. **Network Access (IP Whitelist):**
   - Go to **Security > Network Access**.
   - Click **Add IP Address** -> Choose **Allow Access from Anywhere** (`0.0.0.0/0`).
   - *This allows Render & Vercel to securely connect to your MongoDB cluster.*
3. **Database Access:**
   - Go to **Security > Database Access**.
   - Create a database user (e.g., `rentora_admin`) and copy the password.
4. **Connection String:**
   - Go to **Database > Connect > Drivers**.
   - Copy the MongoDB connection URI string:
     `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rentora?retryWrites=true&w=majority`

---

## 📍 Step 2: Deploy Backend to Render.com (Free Node.js Host)

1. Sign up at [Render.com](https://render.com/).
2. Click **New +** > **Web Service**.
3. Connect your GitHub account and choose repository: `Lavkush-ui0/Rentora-p1`.
4. Configure Web Service Settings:
   - **Name**: `rentora-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add Environment Variables (in **Environment** tab):

| Key | Value / Example |
|---|---|
| `PORT` | `5001` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster...` |
| `JWT_ACCESS_SECRET` | `your_super_secret_access_key_123` |
| `JWT_REFRESH_SECRET` | `your_super_secret_refresh_key_456` |
| `CLIENT_URL` | `https://rentora-frontend.vercel.app` *(update after Step 3)* |
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
   `https://rentora-frontend.vercel.app`
3. Click **Save Changes** (Render will auto-redeploy).
4. Test application registration, login, real-time Socket.IO chat, and notifications on your live Vercel URL!

---

🎉 **Congratulations! Your Rentora Platform is now fully hosted in production.**
