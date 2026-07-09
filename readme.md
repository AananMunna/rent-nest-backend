# 🏠 RentNest

**Find & List Rental Properties with Ease**

RentNest is a backend REST API for a rental property marketplace connecting tenants and landlords. Landlords list and manage properties; tenants browse, request, and pay for rentals; admins moderate the platform.

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Roles & Permissions](#-roles--permissions)
- [Application Flows](#-application-flows)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🔎 Overview

RentNest streamlines the rental process end-to-end:

- **Landlords** list properties, control availability, and approve/reject rental requests.
- **Tenants** discover listings, submit requests, pay securely, and leave reviews.
- **Admins** oversee users, listings, and platform-wide moderation.

The API is stateless, JWT-authenticated, and built around clear role-based access control (RBAC).

---

## ✨ Features

### Public
- Browse all available rental properties
- Search & filter by location, price range, property type, and amenities
- View detailed property listings

### Tenant
- Register / login
- Submit rental requests
- Pay via **Stripe** or **SSLCommerz** after approval
- View payment history & status
- View rental request history (pending / approved / rejected)
- Leave reviews after a completed rental
- Manage profile

### Landlord
- Register / login
- Create, edit, and remove property listings
- Set property availability
- Approve or reject rental requests
- View rental history and tenant reviews

### Admin
- View and manage all users (ban / unban)
- View all listings and rental requests
- Manage property categories

---

## 🛠️ Tech Stack

| Layer            | Technology                          |
|-------------------|--------------------------------------|
| Runtime           | Node.js (v18+)                      |
| Framework         | Express.js                          |
| Database          | MongoDB with Mongoose ODM           |
| Authentication    | JSON Web Tokens (JWT) + bcrypt      |
| Payments          | Stripe API, SSLCommerz API          |
| Validation        | Joi / express-validator             |
| File Storage      | Cloudinary / local storage (config.)|
| Environment Mgmt  | dotenv                              |
| API Testing       | Postman / Thunder Client            |
| Logging           | Morgan / Winston                    |

> Update this table to match your actual implementation if it differs.

---

## 🏗️ Architecture

```
Client (Web/Mobile)
        │
        ▼
   Express REST API
        │
   ┌────┴─────┐
   │Middleware │ → Auth (JWT), Role Guard, Validation, Error Handler
   └────┬─────┘
        │
   ┌────┴─────┐
   │Controllers│ → Business logic per resource
   └────┬─────┘
        │
   ┌────┴─────┐
   │  Models   │ → Mongoose schemas
   └────┬─────┘
        │
        ▼
    MongoDB Atlas
```

External integrations: **Stripe** / **SSLCommerz** for payments.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18.x` or higher
- npm or yarn
- MongoDB (local instance or MongoDB Atlas)
- Stripe account (test keys) and/or SSLCommerz sandbox credentials

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/rentnest.git
cd rentnest

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# then fill in your own values (see below)

# 4. Run the development server
npm run dev

# 5. (Optional) Seed the database
npm run seed
```

The API will be available at `http://localhost:5000` by default.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/rentnest

# Auth
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false

# Client
CLIENT_URL=http://localhost:3000
```

> Never commit `.env` to version control. `.env.example` should list keys without values.

---

## 📡 API Documentation

Base URL: `/api`

### Authentication

| Method | Endpoint             | Access | Description                    |
|--------|-----------------------|--------|---------------------------------|
| POST   | `/auth/register`     | Public | Register new user (tenant/landlord) |
| POST   | `/auth/login`        | Public | Login user, return JWT         |
| GET    | `/auth/me`           | Private| Get current authenticated user |

### Properties (Public)

| Method | Endpoint               | Access | Description                                  |
|--------|-------------------------|--------|-----------------------------------------------|
| GET    | `/properties`          | Public | Get all properties with filters (location, price, type) |
| GET    | `/properties/:id`      | Public | Get property details                         |
| GET    | `/categories`          | Public | Get all property categories                  |

### Landlord Management

| Method | Endpoint                        | Access   | Description                              |
|--------|----------------------------------|----------|--------------------------------------------|
| POST   | `/landlord/properties`          | Landlord | Create new property listing               |
| PUT    | `/landlord/properties/:id`      | Landlord | Update property listing                   |
| DELETE | `/landlord/properties/:id`      | Landlord | Remove property listing                   |
| GET    | `/landlord/requests`            | Landlord | Get all rental requests for their properties |
| PATCH  | `/landlord/requests/:id`        | Landlord | Approve or reject a rental request        |

### Rental Requests

| Method | Endpoint            | Access | Description                        |
|--------|----------------------|--------|--------------------------------------|
| POST   | `/rentals`          | Tenant | Submit a rental request             |
| GET    | `/rentals`          | Private| Get user's rental requests          |
| GET    | `/rentals/:id`      | Private| Get rental request details          |

### Payments (Stripe / SSLCommerz)

| Method | Endpoint             | Access | Description                                       |
|--------|-----------------------|--------|-----------------------------------------------------|
| POST   | `/payments/create`   | Tenant | Create a payment intent/session for an approved rental |
| POST   | `/payments/confirm`  | Public*| Confirm/verify payment (webhook or callback)       |
| GET    | `/payments`          | Private| Get user's payment history                         |
| GET    | `/payments/:id`      | Private| Get payment details                                 |

\* Webhook endpoints are typically public but verified via signature.

### Reviews

| Method | Endpoint      | Access | Description                          |
|--------|----------------|--------|----------------------------------------|
| POST   | `/reviews`    | Tenant | Create review (after completed rental) |

### Admin

| Method | Endpoint                  | Access | Description                    |
|--------|----------------------------|--------|----------------------------------|
| GET    | `/admin/users`            | Admin  | Get all users                  |
| PATCH  | `/admin/users/:id`        | Admin  | Update user status (ban/unban) |
| GET    | `/admin/properties`       | Admin  | Get all properties             |
| GET    | `/admin/rentals`          | Admin  | Get all rental requests        |

### Sample Request/Response

**POST `/api/auth/register`**

```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "tenant"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "665f1a2b3c4d5e6f7a8b9c0d",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "tenant"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

All authenticated routes require:

```
Authorization: Bearer <token>
```

---

## 🗄️ Database Schema

### Users
| Field       | Type     | Notes                          |
|-------------|----------|----------------------------------|
| _id         | ObjectId | Primary key                    |
| name        | String   | Required                       |
| email       | String   | Required, unique                |
| password    | String   | Hashed (bcrypt)                 |
| role        | Enum     | `tenant` \| `landlord` \| `admin` |
| status      | Enum     | `active` \| `banned`            |
| createdAt   | Date     |                                  |

### Properties
| Field         | Type      | Notes                     |
|---------------|-----------|----------------------------|
| _id           | ObjectId  | Primary key                |
| landlordId    | ObjectId  | Ref → Users                |
| title         | String    |                             |
| description   | String    |                             |
| categoryId    | ObjectId  | Ref → Categories           |
| price         | Number    | Per month                  |
| location      | String    |                             |
| amenities     | [String]  |                             |
| images        | [String]  | URLs                       |
| available     | Boolean   | Default `true`              |
| createdAt     | Date      |                             |

### Categories
| Field | Type     | Notes                        |
|-------|----------|-------------------------------|
| _id   | ObjectId | Primary key                   |
| name  | String   | e.g. `Apartment`, `Studio`     |

### RentalRequests
| Field             | Type     | Notes                                          |
|-------------------|----------|--------------------------------------------------|
| _id               | ObjectId | Primary key                                     |
| tenantId          | ObjectId | Ref → Users                                     |
| propertyId        | ObjectId | Ref → Properties                                |
| status            | Enum     | `pending` \| `approved` \| `rejected` \| `active` \| `completed` |
| moveInDate        | Date     |                                                  |
| createdAt         | Date     |                                                  |

### Payments
| Field             | Type     | Notes                                    |
|-------------------|----------|--------------------------------------------|
| _id               | ObjectId | Primary key                               |
| transactionId     | String   | Unique                                    |
| rentalRequestId   | ObjectId | Ref → RentalRequests                      |
| amount            | Number   |                                             |
| method            | String   | e.g. `card`, `mobile_banking`             |
| provider          | Enum     | `stripe` \| `sslcommerz`                  |
| status            | Enum     | `pending` \| `completed` \| `failed`      |
| paidAt            | Date     |                                             |

### Reviews
| Field       | Type     | Notes                          |
|-------------|----------|----------------------------------|
| _id         | ObjectId | Primary key                    |
| tenantId    | ObjectId | Ref → Users                    |
| propertyId  | ObjectId | Ref → Properties                |
| rating      | Number   | 1–5                              |
| comment     | String   |                                  |
| createdAt   | Date     |                                  |

---

## 👥 Roles & Permissions

| Role      | Description                       | Key Permissions                                                   |
|-----------|-------------------------------------|----------------------------------------------------------------------|
| Tenant    | Users looking for rental properties | Browse listings, submit rental requests, leave reviews, manage profile |
| Landlord  | Property owners who list rentals    | Create/manage listings, approve/reject requests, view tenant history  |
| Admin     | Platform moderators                 | Manage all users, oversee all listings & requests, manage categories  |

Role is selected at registration and enforced via middleware on protected routes.

---

## 🔄 Application Flows

### Tenant Journey
`Register → Browse Properties → View Details → Submit Request → Await Approval → Make Payment (Stripe/SSLCommerz) → Leave Review`

### Landlord Journey
`Register → Create Listings → View Requests → Approve/Reject → Manage Properties`

### Rental Request Lifecycle
```
PENDING ──approve──▶ APPROVED ──payment──▶ ACTIVE ──▶ COMPLETED
   │
   └──reject──▶ REJECTED
```

---

## 📁 Project Structure

```
rentnest/
├── src/
│   ├── config/          # DB connection, env config
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, role guard, error handler, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Payment providers, business logic
│   ├── utils/           # Helpers (JWT, hashing, etc.)
│   └── app.js           # Express app setup
├── tests/                # Unit & integration tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

Recommended: use Postman/Thunder Client collections for manual API verification, and Jest + Supertest for automated integration tests.

---

## 📦 Deployment

1. Set `NODE_ENV=production` and configure production environment variables.
2. Use a process manager such as **PM2** or deploy via a container (Docker).
3. Point `MONGO_URI` to a production MongoDB Atlas cluster.
4. Configure production Stripe/SSLCommerz keys and webhook URLs.
5. Recommended hosts: Render, Railway, Vercel (serverless functions), or a VPS behind Nginx.

```bash
# Example with PM2
npm install -g pm2
pm2 start src/app.js --name rentnest-api
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please follow existing code style and include tests for new functionality.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📬 Contact

**Project Maintainer:** Your Name
📧 your.email@example.com
🔗 [GitHub](https://github.com/<your-username>) · [LinkedIn](https://linkedin.com/in/<your-profile>)

---

<p align="center">Built with ❤️ for the RentNest project</p>