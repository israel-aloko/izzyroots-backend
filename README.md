# IzzyRoots — Backend

REST API powering **IzzyRoots**, a single-seller e-commerce platform for organic and heirloom vegetable seeds. Built with Node.js, Express, and MongoDB, it handles authentication, the product catalogue, checkout and Paystack payments, order tracking, reviews, and a customer support/refund workflow for the [IzzyRoots frontend](#related-repository).

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Security Notes](#security-notes)
- [Deployment](#deployment)
- [Related Repository](#related-repository)

---

## Features

- **Authentication** — local email/password login with bcrypt hashing, Google Sign-In, and JWT sessions in httpOnly cookies
- **Email-verified registration** — OTP sent via Nodemailer before an account is created; same OTP pattern used for password resets
- **Product catalogue** — products with pack-size variants, categories, active/inactive states, and Cloudinary-hosted images
- **Search** — keyword product search
- **Delivery zones** — per-state delivery fee configuration used at checkout
- **Orders** — delivery or pickup fulfilment, line-item snapshots (price/name locked in at purchase time), full status lifecycle
- **Payments** — Paystack integration with server-side transaction verification, amount-integrity checks, and idempotency protection against double-processing
- **Reviews** — one rating + comment per customer per product, with aggregate rating tracking on the product
- **Support tickets** — returns, refunds, wrong items, spoiled deliveries, and general enquiries, with image evidence uploads and admin-triggered Paystack refunds
- **Admin API** — full management of products, categories, delivery zones, orders, users, support tickets, and FAQs, gated by role-based middleware
- **Guest messaging** — a contact/enquiry endpoint that doesn't require an account

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB, via Mongoose |
| Auth | JWT (httpOnly cookies), bcrypt, Google OAuth (`google-auth-library`) |
| Payments | Paystack REST API |
| Media | Cloudinary (`multer-storage-cloudinary`) |
| Email | Nodemailer |
| Dev tooling | nodemon |



## Project Structure

```
izzyroots-backend/
├── src/
│   ├── config/               # Cloudinary configuration
│   ├── controllers/           # auth, registration, admin-auth, search
│   ├── middleware/             # isAuthenticated, isAdmin, upload middlewares
│   ├── models/                 # User, Product, Category, Order, Review,
│   │                             DeliveryZone, SupportTicket, FAQ, VerificationToken
│   ├── routes/                  # one router per resource (+ admin-prefixed variants)
│   ├── services/                 # loginService, registerService, emailService
│   └── index.js                   # app setup, DB connection, route mounting
├── .env                             # local environment variables (not committed)
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB connection string (local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- Paystack, Cloudinary, and Google Cloud (OAuth) accounts for the relevant integrations

### Installation

```bash
git clone <backend-repo-url>
cd izzyroots-backend
npm install
```

### Environment Setup

Create a `.env` file in the project root (see [Environment Variables](#environment-variables) below), then start the dev server:

```bash
npm run dev
```

This runs `nodemon src/index.js`, restarting automatically on file changes. By default the API listens on the port set in `.env` (falls back to `3000` if unset).

> The `package.json` currently only defines a `dev` script. For a production deployment (e.g. on Render), set the service's start command to `node src/index.js`, or add a `"start": "node src/index.js"` script yourself.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret key used to sign and verify JWTs |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, used to verify Google Sign-In tokens |
| `PAYSTACK_SECRET_KEY` | Paystack secret key, used for server-side payment verification and refunds |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MAIL_USERNAME` | SMTP username used by Nodemailer to send OTP/reset emails |
| `MAIL_PASSWORD` | SMTP password / app password for the above account |
| `NODE_ENV` | `development` or `production` |

**Never commit `.env` to source control.** It's already listed in `.gitignore`.

**Before deploying:** the CORS configuration in `src/index.js` currently whitelists only local development origins (`localhost` and a LAN IP). Update this to include your production frontend domain (e.g. your Vercel URL) before going live, ideally by reading it from an environment variable instead of hard-coding it.

## API Reference

All routes are prefixed as shown. Admin routes (`/api/admin/*`) require a valid JWT belonging to a user with the `admin` role.

<details>
<summary><strong>Auth & Registration</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Local email/password login |
| POST | `/auth/google` | Google Sign-In (customer) |
| POST | `/auth/forgot-password` | Request a password-reset OTP |
| POST | `/auth/verify-reset-otp` | Verify a password-reset OTP |
| POST | `/auth/reset-password` | Set a new password after OTP verification |
| POST | `/api/register` | Register a new account (sends OTP) |
| POST | `/api/verify` | Verify registration OTP and create the account |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/google-login` | Admin Google Sign-In |
| GET | `/api/admin/me` | Current admin's profile (admin only) |
| POST | `/api/admin/logout` | Admin logout |

</details>

<details>
<summary><strong>Products & Categories</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | List active products |
| GET | `/api/products/:id` | Get a single product |
| GET | `/api/search` | Search products by keyword |
| GET | `/api/categories` | List active categories |
| GET | `/api/admin/products` | List all products, incl. inactive (admin) |
| POST | `/api/admin/products` | Create a product with image upload (admin) |
| PUT | `/api/admin/products/:id` | Update a product (admin) |
| DELETE | `/api/admin/products/:id` | Deactivate a product (admin) |
| PATCH | `/api/admin/products/:id/activate` | Reactivate a product (admin) |
| DELETE | `/api/admin/products/:id/permanent` | Permanently delete a product (admin) |
| GET / POST / PUT / DELETE | `/api/admin/categories` | Manage categories (admin) |

</details>

<details>
<summary><strong>Delivery, Orders & Payments</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/delivery-zones` | List active delivery zones (public) |
| GET / POST / PUT / DELETE | `/api/admin/delivery-zones` | Manage delivery zones (admin) |
| POST | `/api/orders` | Create a new order |
| GET | `/api/orders/mine` | List the current customer's orders |
| GET | `/api/orders/:id` | Get an order's detail (owner) |
| GET | `/api/orders/admin/all` | List all orders (admin) |
| GET | `/api/orders/admin/user/:userId` | List a user's orders (admin) |
| GET | `/api/orders/admin/:id` | Get any order's detail (admin) |
| PATCH | `/api/orders/admin/:id/status` | Update order status (admin) |
| PATCH | `/api/orders/admin/:id/notify-pickup-ready` | Notify customer a pickup order is ready (admin) |
| POST | `/api/payments/verify` | Verify a Paystack transaction and finalize the order |

</details>

<details>
<summary><strong>Reviews, Support Tickets & FAQs</strong></summary>

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reviews/product/:productId` | List reviews for a product |
| GET | `/api/reviews/product/:productId/mine` | Get the current user's review for a product |
| GET | `/api/reviews/top` | List top-rated reviews |
| POST / PATCH / DELETE | `/api/reviews` | Submit, edit, or delete own review |
| POST | `/api/support-tickets` | Raise a support ticket with image upload |
| POST | `/api/support-tickets/guest-message` | Send a general enquiry as a guest |
| GET | `/api/support-tickets/mine` | List current customer's tickets |
| POST | `/api/support-tickets/:id/images` | Attach further images to a ticket |
| GET / PATCH | `/api/admin/support-tickets` | List/filter and update tickets (admin) |
| POST | `/api/admin/support-tickets/:id/refund` | Trigger a Paystack refund (admin) |
| GET | `/api/faqs` | List FAQs (public) |
| GET / POST / PATCH / DELETE | `/api/admin/faqs` | Manage FAQs (admin) |
| GET / PUT / DELETE | `/api/admin/users` | Manage users (admin) |

</details>

## Security Notes

- Passwords are hashed with bcrypt; plaintext passwords are never stored.
- JWTs are stored in httpOnly cookies, not accessible to client-side JavaScript.
- Payments are verified server-side against Paystack's API — the client-reported result is never trusted directly, and both an amount-integrity check and an idempotency guard protect against tampering and double-processing.
- OTPs for registration and password reset are time-limited and validated server-side via MongoDB TTL indexes, not the client.
- Admin routes are protected by role-checking middleware (`isAdmin`) in addition to authentication (`isAuthenticated`).

## Deployment

The API is deployed to [Render](https://render.com) as a managed web service, auto-deploying from this repository on push. Environment variables are configured directly in the Render dashboard rather than committed to the repo. The database runs on [MongoDB Atlas](https://www.mongodb.com/atlas), and images are served via [Cloudinary](https://cloudinary.com).

## Related Repository

Frontend (React/Vite): `<frontend-repo-url>`

---

<p align="center">Built by Aloko Israel Nda</p>
