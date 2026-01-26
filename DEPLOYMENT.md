# Deployment Guide for SkillShare (AWS)

This guide outlines how to deploy your full-stack application (React Client + Node.js Server) to AWS.

## Architecture Overview

- **Database**: MongoDB Atlas (Cloud Database)
- **Backend**: AWS App Runner (Managed Container Service for Node.js) - *Provides automatic HTTPS*
- **Frontend**: AWS Amplify (Static Web Hosting for React/Vite)

---

## Prerequisites

1.  **GitHub Repository**: Push your code (`client` and `server` folders) to a GitHub repository.
2.  **AWS Account**: You need an active AWS account.
3.  **MongoDB Atlas**: You should have your cluster set up and a connection string ready.

---

## Step 1: Prepare Database (MongoDB Atlas)

1.  Log in to MongoDB Atlas.
2.  Go to **Network Access**.
3.  Add IP Address: `0.0.0.0/0` (Allows access from anywhere, required for AWS App Runner unless using VPC peering).
4.  Go to **Database Access** and ensure you have a database user with read/write permissions.
5.  Get your **Connection String** (e.g., `mongodb+srv://<user>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`).

---

## Step 2: Deploy Backend (AWS App Runner)

We use App Runner because it automatically provides an HTTPS URL, which is required for your secure Frontend to talk to the Backend.

1.  Log in to the **AWS Console** and search for **App Runner**.
2.  **Create an App Runner service**.
3.  **Source**:
    -   Select **Source code repository**.
    -   Connect your **GitHub** account.
    -   Select your **Repository**.
    -   Branch: `main` (or master).
    -   **Source directory**: Select **Directory** and choose `server` (Important!).
4.  **Configuration**:
    -   **Runtime**: Node.js 16 (or latest available LTS).
    -   **Build command**: `npm install`
    -   **Start command**: `npm start`
    -   **Port**: `5000`
5.  **Environment Variables**:
    -   Add `MONGO_URI`: `your_mongodb_connection_string`
    -   Add `PORT`: `5000`
    -   Add `CLIENT_URL`: `https://main.d...amplifyapp.com` (You will update this later after deploying frontend, or set to `*` temporarily).
6.  **Create & Deploy**.
    -   Wait for deployment to finish (5-10 mins).
    -   Copy the **Default domain** (e.g., `https://xyz.awsapprunner.com`). This is your **Backend URL**.

---

## Step 3: Deploy Frontend (AWS Amplify)

1.  Search for **AWS Amplify** in AWS Console.
2.  **Create new app** -> **Gen 1** (or "Host web app").
3.  Select **GitHub** and authorize.
4.  Select your **Repository** and **Branch**.
5.  **Build Settings**:
    -   Check the box **"Monorepo"**? -> Amplify usually detects this. If it asks for the app root, enter `client`.
    -   If it doesn't automatically detect the Monorepo structure:
        -   Click **Edit** on the Build settings.
        -   Set `appRoot` to `client`.
        -   Ensure the build command is `npm run build` and output directory is `dist`.
6.  **Environment Variables**:
    -   Key: `VITE_API_URL`
    -   Value: Your **Backend URL** from Step 2 (e.g., `https://xyz.awsapprunner.com/api`).
        -   *Note*: Ensure you append `/api` if that is how your routes are set up (which they are in `server/index.js`).
7.  **Save and Deploy**.

---

## Step 4: Final Configuration

1.  Once Frontend is deployed, copy the **Amplify Domain** (e.g., `https://main.d1234.amplifyapp.com`).
2.  Go back to **AWS App Runner** -> **Configuration** -> **Environment variables**.
3.  Update (or Add) `CLIENT_URL` to your new **Amplify Domain**.
    -   This ensures CORS allows your frontend to connect to the backend sockets.
4.  **Save changes** (App Runner will redeploy).

---

## Troubleshooting

-   **Mixed Content Error**: If you see errors like "accessing insecure content", ensure both your Frontend and Backend are on **HTTPS**. App Runner provides this by default. Do not use a raw EC2 HTTP IP address.
-   **Socket Connection Fail**: Open the Browser Console (F12). If `socket.io` fails to connect, check if `VITE_API_URL` is correct and does NOT include a trailing slash optionally, though your code handles some replacement. Best to set `VITE_API_URL` to `https://xyz.awsapprunner.com/api`.
-   **Mongo Connection Error**: Check MongoDB Atlas "Network Access" IP Whitelist (`0.0.0.0/0`).
