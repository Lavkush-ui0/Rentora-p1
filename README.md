# Rentora — Student-to-Student Rental Marketplace (NIET Exclusive)

Rentora is a production-quality, responsive MERN full-stack web application designed exclusively for **NIET students** to rent academic materials, lab equipment, books, gadgets, and campus items directly from fellow classmates.

---

## 🌟 Key Features

1. **NIET Domain Restricted Auth**: Registration requires a `@niet.co.in` email address.
2. **Offline Payment Architecture**: All transactions (rental fees & security deposits) are settled directly between students offline. Rentora handles requests, status transitions, and campus reputation without payment gateways.
3. **Item Discovery & Search**: Full-text search on titles/descriptions with price range, category, condition filters, and sorting.
4. **Rental Lifecycle State Machine**: Strictly managed status workflow (`PENDING` -> `ACCEPTED` -> `ACTIVE` -> `COMPLETED`, with `CANCELLED` / `REJECTED` handling).
5. **Real-time Messaging & Notifications**: Powered by Socket.IO for chat messages, typing indicators, and instant notification triggers.
6. **Student Reputation & Reviews**: Post-completion 1–5 star reviews and user rating score calculations.
7. **Campus Discovery Engine**: Homepage sections for Top Demanded, Trending This Week, Budget Friendly, and Top Rated Students.
8. **Admin Moderation Panel**: Role-based access control allowing admins to block users, take down listings, manage categories, and handle student reports.
9. **Dark Mode & Responsive UI**: Built with Tailwind CSS, supporting seamless light/dark theme persistence and mobile navigation drawer.

---

## 📁 Repository Structure

```
rentora/
├── client/                 # Frontend React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, ProductCard, etc.)
│   │   ├── context/        # Auth, Theme, and Socket context providers
│   │   ├── layouts/        # Main responsive layout wrapper
│   │   ├── pages/          # Home, Explore, ListingDetails, ListItem, MyListings, RentalRequests, Messages, Profile, AdminDashboard, Notifications, Settings, Login, Register
│   │   ├── routes/         # ProtectedRoute guard with role checking
│   │   └── services/       # Axios API client service modules
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/                 # Backend Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/         # Database and Cloudinary configuration
│   │   ├── controllers/    # Express controllers (Auth, Listing, Rental, Chat, Discovery, Admin, Review, Notification)
│   │   ├── middleware/     # Auth, Zod validation, Multer upload, Error handling
│   │   ├── models/         # Mongoose schemas (User, Category, Listing, RentalRequest, Chat, Review, Notification, Report)
│   │   ├── routes/         # Modular REST API routes
│   │   ├── scripts/        # Seeding script for sample data & initial admin
│   │   ├── services/       # Socket.IO, Cloudinary, and Notification helper services
│   │   ├── tests/          # Supertest & Jest integration test suite
│   │   └── validators/     # Zod request validation schemas
│   └── tsconfig.json
├── .env.example            # Environment configuration template
└── package.json            # Monorepo NPM workspace configuration
```

---

## 🚀 Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance OR **MongoDB Atlas Connection URI**

### 2. Environment Setup
Copy `.env.example` to `.env` in the root folder:

```bash
cp .env.example .env
```

Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/rentora?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key
ALLOWED_EMAIL_DOMAIN=niet.co.in
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Installation
Install all dependencies for root, server, and client workspaces:

```bash
npm install
```

### 4. Database Seeding
Populate initial categories, demo users, sample listings, and default admin account:

```bash
npm run seed
```


### 5. Running Dev Servers
Run both backend Express server and Vite frontend client concurrently:

```bash
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🧪 Testing & Building

### Run Backend Integration Tests
Executes Jest test suite validating auth, domain restriction, listing search, rental state transitions, and review scoring:

```bash
npm run test:server
```

### Production Build
Compiles TypeScript for server and builds optimized Vite bundle for client:

```bash
npm run build
```

---

## 🔒 Security & Best Practices

- **Token Security**: Short-lived Access Tokens (15 min) paired with HTTP-only, SameSite Refresh Cookies (7 days).
- **Security Headers**: Express protected with `helmet()` and CORS credentials controls.
- **Input Validation**: All requests parsed and sanitized using `Zod` schemas.
- **Image Fallback**: Integrated Cloudinary service with mock fallback support if API keys are omitted.
<img width="1470" height="782" alt="Screenshot 2026-08-25 at 8 49 51 PM" src="https://github.com/user-attachments/assets/f30416b1-fe60-4615-ac28-6b7fde31bbd4" />
<img width="1236" height="790" alt="Screenshot 2026-08-25 at 8 50 54 PM" src="https://github.com/user-attachments/assets/44e6cba5-a7ca-4260-8e80-f818fb90af88" />

