<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

# 🏢 BariBhara - Backend (Server API)

### The Core Engine for Smart Rental Management

<div align="center">
  <a href="https://baribhara-server.onrender.com/">
    <img src="https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Deployed on Render" />
  </a>
</div>

<p align="center">
  A robust, scalable RESTful API built to handle property management, automated rent invoicing, secure authentication, and real-time sockets.
</p>

</div>

---

## 📖 Introduction

Welcome to the **BariBhara Backend Repository**. This server application powers the BariBhara platform using **Node.js, Express, and MongoDB**. It manages database interactions, automated background tasks (cron jobs), real-time notifications, and third-party integrations like Cloudinary and PDF generation.

## ✨ Key Features

- 🔐 **Role-Based Authentication:** Secure JWT-based access control for Admins, Landlords, and Tenants.
- 🕒 **Automated Billing Engine:** `node-cron` automatically generates monthly rent and utility invoices on the 1st of every month.
- 📄 **Dynamic PDF Generation:** Uses `PDFKit` to generate real-time printable rental invoices.
- 📡 **WebSockets & Real-Time:** `Socket.io` integration for instant push notifications and maintenance request alerts.
- 🖼️ **Cloud Storage:** Securely upload property images and Tenant NID documents to Cloudinary.
- 📊 **Analytics Integration:** Tracks property views, search queries, and SaaS subscription stats.

## ⚙️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JSON Web Tokens (JWT), bcryptjs
- **Real-Time:** Socket.io
- **Task Scheduling:** Node-Cron
- **Utilities:** PDFKit, Nodemailer, Multer

## 📁 Project Structure

```bash
server/
├── controller/             # Request handlers (User, Tenant, Property, Analytics)
├── middleware/             # Express middlewares (Auth, Role checks, Error Handling)
├── models/                 # Mongoose DB Schemas (Tenant, Unit, Invoice, User)
├── routes/                 # API endpoint definitions
├── services/               # Reusable business logic (Cron, Cloudinary, PDF, Email)
├── src/
│   └── app.ts              # Express App setup & Server entry point
├── .env                    # Environment variables
└── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or higher
- MongoDB Atlas Account (or Local MongoDB Server)
- Cloudinary Account (for media uploads)

### Installation

1. **Clone the repository and enter the server folder:**
   ```bash
   git clone https://github.com/CodeCommandBD/BariBhara-Server.git
   cd BariBhara-Server
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root of the server directory:
   ```env
   # Server Configuration
   PORT=4000
   NODE_ENV=development
   
   # Database
   MONGODB_URL=mongodb+srv://<username>:<password>@cluster...
   
   # Security
   SECRET_KEY=your_super_secret_jwt_key
   
   # Cloudinary (Media & Docs)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Web Push VAPID Keys
   VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:4000`*

## 🛠️ Build for Production
To compile the TypeScript code into JavaScript for production deployment:
```bash
npm run build
```
