# RentNest 🏠 — Backend

"Find & List Rental Properties with Ease"

RentNest is a REST API for a rental property marketplace. Landlords list properties and
manage rental requests; tenants browse listings, request rentals, pay online, and leave
reviews; admins moderate users, properties, and categories.

## Tech Stack

- **Runtime:** Node.js (ESM) + TypeScript, run via [`tsx`](https://github.com/privatenumber/tsx)
- **Framework:** Express 5
- **Database:** PostgreSQL (Prisma Postgres) via **Prisma ORM 7**
- **Auth:** JWT (access + refresh tokens, httpOnly cookies), bcrypt password hashing
- **Payments:** Stripe Checkout + webhooks
- **Validation / error handling:** centralized `catchAsync` + `globalErrorHandler`

## Project Structure

```
src/
  app.ts                  # Express app, middleware, route mounting
  server.ts               # Entry point — connects Prisma, starts the HTTP server
  config/                 # Typed environment variable access
  lib/prisma.ts           # Prisma client singleton
  middlewares/            # auth, notFound, globalErrorHandler
  utils/                  # catchAsync, sendResponse, jwt helpers
  modules/
    auth/                 # register, login, refresh, me
    user/                 # profile get/update
    category/             # category CRUD (admin)
    property/             # public browse + detail
    landlord/              # landlord property CRUD + incoming requests
    rental/                # rental request lifecycle
    payment/               # Stripe checkout, webhook, confirm, history
    review/                 # post-completion reviews
    admin/                  # users, properties, rentals oversight
generated/prisma/         # Prisma-generated client (TypeScript source, do not edit)
prisma/                   # schema + migrations
api/index.ts              # Vercel serverless entry (not used for Render/Railway)
```

Each module follows a **route → controller → service** layering: routes only wire
middleware + controller functions, controllers translate HTTP ⇄ service calls, services
hold all Prisma/business logic.

## Roles & Permissions

| Role | Key Permissions |
|---|---|
| **Tenant** | Browse listings, submit rental requests, pay, leave reviews, manage profile |
| **Landlord** | Create/manage listings, approve/reject requests, view rental history |
| **Admin** | Manage all users (ban/unban), oversee listings & requests, manage categories |

Role is selected at registration (`POST /api/auth/register`).

## Getting Started

### 1. Prerequisites
- Node.js 20+
- A PostgreSQL database (this project targets [Prisma Postgres](https://www.prisma.io/postgres), any Postgres works)
- A [Stripe](https://stripe.com) account (test mode is fine for development)

### 2. Install dependencies
```bash
npm install
```
`postinstall` automatically runs `prisma generate`.

### 3. Configure environment variables
Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

NODE_ENV=development
PORT=5000
APP_URL="http://localhost:3000"

BCRYPT_SALT_ROUNDS=10

JWT_ACCESS_SECRET="replace-with-a-long-random-string"
JWT_REFRESH_SECRET="replace-with-a-different-long-random-string"
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Generate strong JWT secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `APP_URL` is used both for CORS (`Access-Control-Allow-Origin`) and as the base for
> Stripe checkout `success_url`/`cancel_url` — it must match your frontend's exact origin
> (no trailing slash).

### 4. Set up the database
```bash
npx prisma migrate deploy   # apply existing migrations
# or, while iterating on the schema locally:
npx prisma migrate dev
```

### 5. Run the dev server
```bash
npm run dev
```
Server starts at `http://localhost:5000`.

### 6. (Optional) Forward Stripe webhooks locally
```bash
stripe listen --forward-to localhost:5000/api/payments/webhook
```
Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` in `.env` and restart the server.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with file-watching (development) |
| `npm run build` | Type-check the project with `tsc` (no emit relied upon at runtime) |
| `npm run start` | Run production server via `tsx` |
| `npm run stripe:webhook` | Forward Stripe webhook events to local server |

## API Reference

Base URL: `/api`

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh-token` | Public (requires refresh cookie) |
| GET | `/auth/me` | Authenticated |

### Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/users/me` | Authenticated |
| PUT | `/users/my-profile` | Authenticated |

### Categories
| Method | Endpoint | Access |
|---|---|---|
| GET | `/categories` | Public |
| POST | `/categories` | Admin |
| PATCH | `/categories/:id` | Admin |
| DELETE | `/categories/:id` | Admin |

### Properties (public)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/properties` | Public — filters: `searchTerm`, `categoryId`, `city`, `location`, `minPrice`, `maxPrice`, `page`, `limit`, `sortBy`, `sortOrder` |
| GET | `/properties/:id` | Public |

### Landlord
| Method | Endpoint | Access |
|---|---|---|
| GET | `/landlord/properties/mine` | Landlord |
| POST | `/landlord/properties` | Landlord |
| PUT | `/landlord/properties/:id` | Landlord (owner) |
| DELETE | `/landlord/properties/:id` | Landlord (owner) |
| GET | `/landlord/requests` | Landlord |
| PATCH | `/landlord/requests/:id` | Landlord — body: `{ "status": "APPROVED" \| "REJECTED" \| "COMPLETED" }` |

### Rental Requests
| Method | Endpoint | Access |
|---|---|---|
| POST | `/rentals` | Tenant |
| GET | `/rentals` | Authenticated — scoped to caller's role |
| GET | `/rentals/:id` | Authenticated (participant) |

### Payments
| Method | Endpoint | Access |
|---|---|---|
| POST | `/payments/create` | Tenant — creates a Stripe Checkout session for an approved request |
| POST | `/payments/webhook` | Stripe (raw body, signature-verified) |
| POST | `/payments/confirm` | Manual fallback confirmation |
| GET | `/payments` | Authenticated |
| GET | `/payments/:id` | Authenticated |

### Reviews
| Method | Endpoint | Access |
|---|---|---|
| POST | `/reviews` | Tenant — only after the related rental is `COMPLETED` and paid |
| GET | `/reviews/property/:propertyId` | Public |

### Admin
| Method | Endpoint | Access |
|---|---|---|
| GET | `/admin/users` | Admin — filters: `searchTerm`, `role`, `activeStatus`, `page`, `limit` |
| PATCH | `/admin/users/:id` | Admin — body: `{ "activeStatus": "ACTIVE" \| "BLOCKED" }` |
| GET | `/admin/properties` | Admin |
| GET | `/admin/rentals` | Admin |

## Rental Request Lifecycle

```
PENDING → APPROVED → (payment) → ACTIVE → COMPLETED
        ↘ REJECTED
```

Property `status` is kept in sync automatically: `RESERVED` while a request is
`APPROVED`/`ACTIVE`, back to `AVAILABLE` once `COMPLETED`.

## Deployment

This is a traditional long-running Express server — deploys cleanly to **Render** or
**Railway** without modification.

**Render:**
- Build Command: `npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build`
- Start Command: `npm run start`
- Set all variables from the `.env` section above (with production values), plus `NODE_ENV=production`

After deploying:
1. Point `APP_URL` at your deployed frontend's exact origin.
2. Create a production Stripe webhook endpoint at `https://<your-backend>/api/payments/webhook`
   and update `STRIPE_WEBHOOK_SECRET` with the new signing secret.
3. Update the frontend's `NEXT_PUBLIC_API_URL` to point at the deployed backend.

An `api/index.ts` + `vercel.json` are also included for Vercel serverless deployment, if
preferred — see project notes for the trade-offs (cold starts, connection limits).

## Notes / Known Limitations

- Only **Stripe** is implemented as a payment provider (the original spec allows Stripe
  *or* SSLCommerz — either satisfies the requirement).
- `POST /api/payments/confirm` does not verify caller ownership of the payment; treat it
  as a trusted fallback endpoint alongside the signed Stripe webhook, not a public API.