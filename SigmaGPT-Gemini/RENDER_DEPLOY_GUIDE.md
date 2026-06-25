# SigmaGPT — Render Deployment Guide

## Overview

SigmaGPT has two parts:
- Backend: Node.js/Express API (Render Web Service)
- Frontend: React/Vite app (Render Static Site)

---

## Step 1 — Upload to GitHub

Push your project to a GitHub repository from your local machine, then connect it to Render in the steps below.

---

## Step 2 — Deploy the Backend (Web Service)

1. Go to https://render.com -> New -> Web Service
2. Connect your GitHub repo
3. Settings:
   - Name: sigmagpt-backend
   - Root Directory: Backend
   - Environment: Node
   - Build Command: npm install
   - Start Command: node server.js
4. Environment Variables to add:
   - MONGODB_URI   -> your MongoDB Atlas connection string
   - GEMINI_API_KEY -> your Google Gemini API key
   - JWT_SECRET    -> any long random string
   - PORT          -> 8080
5. Click Create Web Service and wait for the deploy
6. Copy the URL shown (e.g. https://sigmagpt-backend.onrender.com)

---

## Step 3 — Deploy the Frontend (Static Site)

1. Go to https://render.com -> New -> Static Site
2. Connect your GitHub repo
3. Settings:
   - Name: sigmagpt-frontend
   - Root Directory: Frontend
   - Build Command: npm install && npm run build
   - Publish Directory: dist
4. Environment Variables to add:
   - VITE_API_URL -> backend URL from Step 2
     Example: https://sigmagpt-backend.onrender.com
5. Click Create Static Site and wait for the deploy

---

## Done!

Your app will be live at the Static Site URL Render provides.

---

## Important Notes

MongoDB: Use MongoDB Atlas (https://cloud.mongodb.com) which has a free tier.
In Atlas > Network Access, whitelist all IPs (0.0.0.0/0) so Render can connect.

Free tier cold starts: On Render free plan the backend sleeps after 15 min of
inactivity. The first request after sleeping takes 30-60 seconds. Upgrade to a
paid plan to avoid cold starts.
