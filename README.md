# SkillShare 🎓
**Connect, Learn, and Grow with Peers on Campus.**

Welcome to **SkillShare**, a peer-to-peer skill exchange platform designed exclusively for university students. Whether you want to master C++, learn the guitar, or get help with complex academic topics, SkillShare connects you with talented peers on your campus.

> **Built with the MERN Stack + Real-time capabilities.**

## 📋 Table of Contents
- [SkillShare 🎓](#skillshare-)
  - [📋 Table of Contents](#-table-of-contents)
  - [🌟 About The Project](#-about-the-project)
  - [🔥 Key Features](#-key-features)
  - [💻 Tech Stack](#-tech-stack)
  - [🚀 Getting Started](#-getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Configuration](#configuration)
  - [📖 Usage Guide](#-usage-guide)
  - [🛡️ Security & Payments](#-security--payments)
  - [📬 Contact](#-contact)

## 🌟 About The Project
SkillShare is a marketplace for skills. It empowers students to monetize their expertise and provides learners with affordable, accessible peer tutoring. 

Unlike traditional tutoring platforms, SkillShare is built for the campus ecosystem, fostering a community of trust and collaboration. It features an integrated video meeting system, a secure escrow payment model to ensure fair transactions, and a real-time chat for seamless communication.

## 🔥 Key Features

- **🔎 Smart Search & Discovery**: Find skills by category (Academic, Programming, Music, etc.) or use the advanced search with literal string matching (perfect for "C++", "C#").
- **💰 Secure Escrow Payments**: Payments are held in escrow via Razorpay and released to the provider only after the session is successfully completed.
- **🎥 Integrated Video Calls**: High-quality video sessions powered by ZegoCloud, built right into the platform. No external links needed.
- **💬 Real-Time Chat**: Chat with your tutor/student about the session using Socket.io.
- **📅 Booking Management**: Easy-to-use dashboard to track upcoming, pending, and completed sessions.
- **👛 Wallet System**: Built-in wallet to manage earnings, with support for withdrawal requests.
- **⭐ Reputation System**: Verified reviews and ratings to help you choose the best tutors.
- **🛡️ Admin Dashboard**: Comprehensive tools for platform moderation, banning users, and managing disputes.

## 💻 Tech Stack

**Frontend:**
- **Framework:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Auth:** [Clerk](https://clerk.com/)
- **Real-time:** [Socket.io Client](https://socket.io/)
- **Video:** [ZegoCloud UIKit](https://www.zegocloud.com/)
- **Notifications:** Sonner
- **Animation:** Framer Motion

**Backend:**
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) + Mongoose
- **Payments:** [Razorpay](https://razorpay.com/)
- **Scheduling:** Node Cron
- **Webhooks:** Svix

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
- Node.js 18+ installed on your machine.
- MongoDB instance (Local or Atlas).
- Accounts (and API Keys) for:
    - Clerk (Authentication)
    - Razorpay (Payments)
    - ZegoCloud (Video SDK)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/skillshare.git
   cd skillshare
   ```

2. **Install Dependencies (Monorepo)**
   We use `concurrently` to manage authorized client and server start-up, but you should install dependencies for both.
   ```bash
   # Root install
   npm install

   # Client install
   cd client
   npm install

   # Server install
   cd ../server
   npm install
   ```

### Configuration

1. **Server Configuration**: Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   
   # Authentication
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   WEBHOOK_SECRET=your_clerk_webhook_secret

   # Payments
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Client URL
   CLIENT_URL=http://localhost:5173
   ```

2. **Client Configuration**: Create a `.env` file in the `client` directory:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_API_URL=http://localhost:5000/api
   VITE_ZEGO_APP_ID=your_zego_app_id
   VITE_ZEGO_SERVER_SECRET=your_zego_server_secret
   ```

3. **Start the Application**:
   Return to the root directory and run:
   ```bash
   npm start
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

## 📖 Usage Guide

1. **Sign Up**: Create an account using your email (via Clerk).
2. **Explore**: Browse the marketplace. Use filters to sort by Price (Low to High), Rating, or Category.
3. **Offer a Skill**: Go to your profile and "Create Skill". Set your price and description.
4. **Book a Session**: Click on a skill, select a time (collaborative scheduling), and pay upfront.
5. **Attend**: When the time comes, join the video room directly from the dashboard.
6. **Release Funds**: After the session, the payment is released to the provider's wallet.

## 🛡️ Security & Payments
This platform acts as a secure intermediary.
- **Escrow**: Student payments are not sent directly to the provider. They are held securely until the service is delivered.
- **Refunds**: If a provider is a "No Show", students can claim an instant refund via the dashboard.

## 📬 Contact
Email: `manojkuna2005@gmail.com`  
Project Link: https://skill-share-flame.vercel.app/
