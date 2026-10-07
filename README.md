# User Management & Authentication

A beginner-friendly full-stack Node.js application using:

- Node.js + Express.js
- Handlebars (HBS) + HTML/CSS
- jQuery + AJAX
- MongoDB native `mongodb` driver — **no Mongoose**
- JWT authentication
- bcrypt password hashing
- HTTP-only cookies

Runs on `http://localhost:3000`.

## 1. Requirements

Install:

- Node.js 18+
- MongoDB Community Server, or a MongoDB Atlas URI
- npm

## 2. Install

```bash
npm install
```

Copy the environment file:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Update `.env` with your MongoDB URI and a strong JWT secret.

## 3. Start MongoDB

If MongoDB is installed locally, make sure the MongoDB service is running.

Default URI:

```text
mongodb://127.0.0.1:27017
```

## 4. Create an admin

The seed script creates an admin account:

```bash
npm run seed:admin
```

Optional admin credentials can be supplied through environment variables:

```text
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@12345
```

The seed script intentionally does not store plaintext passwords. It hashes the password with bcrypt first.

## 5. Run the app

Development:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## 6. Project structure

```text
user-management-auth/
├── app.js
├── package.json
├── .env.example
├── README.md
├── config/
│   └── db.js
├── controllers/
│   ├── adminController.js
│   ├── authController.js
│   └── userController.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   └── userModel.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── pageRoutes.js
│   └── userRoutes.js
├── scripts/
│   └── seedAdmin.js
├── public/
│   ├── css/style.css
│   └── js/common.js
└── views/
    ├── layouts/main.hbs
    ├── partials/navbar.hbs
    ├── home/
    ├── auth/
    ├── user/
    └── admin/
```

## 7. Important concepts

### MongoDB native driver

Instead of Mongoose models, `config/db.js` creates a `MongoClient`. The application gets the `users` collection directly:

```js
usersCollection().findOne({ email });
```

This means you work with MongoDB documents and queries directly. The unique email index is created with:

```js
createIndex({ email: 1 }, { unique: true });
```

### Handlebars

Express uses `express-handlebars` as the view engine. The main layout is `views/layouts/main.hbs`, and the navbar is a partial:

```hbs
{{> navbar}}
```

Server data can be printed with:

```hbs
{{user.name}}
```

A small helper is used for an equality check:

```hbs
{{#if (eq user.role 'admin')}}
  ...
{{/if}}
```

### AJAX

The admin panel does not reload the page for CRUD operations. jQuery sends requests such as:

```js
$.ajax({
  url: '/api/users/' + id,
  method: 'PUT',
  contentType: 'application/json',
  data: JSON.stringify(payload)
});
```

The server returns JSON, and the table is refreshed with the response.

### bcrypt

Passwords are never saved directly. Registration and admin/user creation hash passwords:

```js
const hashedPassword = await bcrypt.hash(password, 12);
```

Login compares the submitted password against the stored hash:

```js
await bcrypt.compare(password, user.password);
```

### JWT authentication

After login, the server signs a JWT containing the user ID and role:

```js
jwt.sign(
  { userId: user._id.toString(), role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);
```

The token is stored in an HTTP-only cookie. Browser JavaScript cannot read an HTTP-only cookie, which reduces exposure to token theft through client-side scripts.

### Authentication middleware

`requireAuth` reads the cookie, verifies the JWT, then loads the current user from MongoDB. This is important because authorization should use current database state rather than trusting only the token.

### Admin authorization

`requireAdmin` first authenticates the request and then checks:

```js
if (req.user.role !== 'admin') {
  return res.status(403).json({ message: 'Admin access required.' });
}
```

All admin CRUD API routes use this middleware.

## 8. Routes

### Pages

| Method | Route | Purpose |
|---|---|---|
| GET | `/` | Home |
| GET | `/login` | Login page |
| GET | `/register` | Registration page |
| GET | `/dashboard` | Protected user dashboard |
| GET | `/admin` | Protected admin panel |

### Authentication API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login + JWT cookie |
| POST | `/api/auth/logout` | Clear auth cookie |

### User API

| Method | Route | Auth |
|---|---|---|
| GET | `/api/users/me` | Logged-in user |
| GET | `/api/users?search=...` | Admin |
| POST | `/api/users` | Admin |
| PUT | `/api/users/:id` | Admin |
| DELETE | `/api/users/:id` | Admin |

### Admin API

| Method | Route | Auth |
|---|---|---|
| GET | `/api/admin/stats` | Admin |

## 9. Security notes

- Passwords are bcrypt hashes, never plaintext.
- User API responses remove the `password` field.
- JWT is stored in an HTTP-only cookie.
- JWT secret is loaded from `.env`.
- Admin endpoints require both authentication and admin role.
- Users cannot delete their own admin account from the admin UI.
- Production should use HTTPS, so the auth cookie is marked `secure` when `NODE_ENV=production`.
- For a production application, also consider CSRF protection, rate limiting, input validation, security headers, password reset/email verification, audit logging, and stronger session/token rotation strategies.

## 10. Learning flow

A good order for learning this project is:

1. Read `app.js` and understand Express middleware.
2. Read `views/layouts/main.hbs` and the page views.
3. Read `config/db.js` and `models/userModel.js` to learn the native MongoDB driver.
4. Read `authController.js` to understand bcrypt + JWT.
5. Read `authMiddleware.js` to understand protected routes.
6. Read `admin/index.hbs` to understand jQuery AJAX CRUD.
7. Change one feature at a time and test it.
