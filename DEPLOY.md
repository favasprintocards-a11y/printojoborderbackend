# Deployment Guide

This project consists of two parts:
1. **Server (Backend)**: Node.js + Express + SQLite
2. **Client (Frontend)**: React + Vite

Here is how to deploy them to **Render** and **Vercel**.

## ⚠️ Important Warning: Data Persistence
This application currently uses **SQLite** (a file-based database) and local file storage for uploads. 
**On free cloud hosting like Render:**
- **The Database will be reset** every time the server restarts or you deploy changes.
- **Uploaded files will be deleted** every time the server restarts.

**Solution:**
- For a real production app, you should migrate to **PostgreSQL** (for DB) and **AWS S3/Cloudinary** (for files).
- For a simple demo, you can proceed as is, but be aware that data is temporary.

---

## Step 1: Push Code to GitHub
1. Create a new empty repository on GitHub (do NOT add README, .gitignore, or license).
2. Open a terminal in this project folder.
3. Run the following commands (replace `<YOUR_REPO_URL>` with the URL from GitHub):
   ```bash
   git remote add origin <YOUR_REPO_URL>
   git branch -M main
   git push -u origin main
   ```
   *(Note: Git has been installed and the repository initialized for you. You just need to connect it to GitHub.)*

## Step 2: Deploy Backend to Render
1. Create an account on [Render.com](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository.
4. **Configuration**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Instance Type**: Free
5. Click **Deploy Web Service**.
6. Once deployed, Render will give you a **URL** (e.g., `https://printo-backend.onrender.com`). **Copy this URL.**

## Step 3: Deploy Frontend to Vercel
1. Create an account on [Vercel.com](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. **Configuration**:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: Click "Edit" and select `client`.
5. **Environment Variables**:
   - Add a new variable:
     - **Name**: `VITE_API_URL`
     - **Value**: The URL you copied from Render (e.g., `https://printo-backend.onrender.com`).
     - *Note: Do not include a trailing slash `/` at the end.*
6. Click **Deploy**.

## Step 4: Finalize
Once Vercel deploys, your app is live!
- Open the Vercel URL.
- Test by adding a client or job.
- *Remember: Data will reset if the backend restarts.*
