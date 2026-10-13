# Lost & Found Campus

Lost & Found Campus is a simple platform for reporting and finding items lost around college. Students can post details about lost or found belongings, browse reports, and submit claims when they believe an item belongs to them.

The goal is to make it easier for students to return misplaced belongings without relying entirely on class groups or campus announcements.

## Features

- Register and log in to an account
- Browse lost and found item reports
- Search items and filter by category, location, type, and status
- View item descriptions, dates, locations, and photos
- Report a lost or found item
- Submit a claim with a message explaining why the item belongs to you
- View claims on items you reported
- Approve or reject claims on your own items
- Edit or delete your own reports
- Mark your own items as recovered
- View a dashboard showing your reports and their status

## Tech Stack

**Frontend**
- React
- Vite
- React Router
- Tailwind CSS
- Axios

**Backend**
- Node.js
- Express
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs
- Multer for image uploads

## Getting Started

### Prerequisites

Install the following before running the project:

- Node.js and npm
- MongoDB locally or a MongoDB Atlas database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Geektoberfest/lost-found-campus.git
cd lost-found-campus
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
```

Replace the example values with your own configuration. Do not commit the `.env` file.

Start the backend:

```bash
npm run dev
```

The backend should run at `http://localhost:3000`.

### 3. Set up the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

The frontend API client currently uses `http://localhost:3000` as its base URL. If you change the backend port, update the base URL in `frontend/src/services/api.js` as well.

## Available Scripts

### Backend

Run these commands from `backend/`.

| Command | Description |
|---|---|
| `npm install` | Install backend dependencies |
| `npm run dev` | Start the development server with Nodemon |
| `npm start` | Start the backend server |

### Frontend

Run these commands from `frontend/`.

| Command | Description |
|---|---|
| `npm install` | Install frontend dependencies |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build |

## API Overview

The backend supports authentication, item management, and claim management.

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get the current user's details |

### Items

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/items` | Browse items with supported filters |
| GET | `/api/items/:id` | View item details |
| POST | `/api/items` | Report an item |
| PUT | `/api/items/:id` | Edit your own item |
| PATCH | `/api/items/:id/status` | Update your item's status |
| DELETE | `/api/items/:id` | Delete your own item |

### Claims

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/items/:itemId/claims` | Submit a claim |
| GET | `/api/items/:itemId/claims` | View claims on your own item |
| PATCH | `/api/claims/:id` | Approve or reject a claim |

Protected endpoints require a valid JWT Bearer token. Item creation uses multipart form data when an image is uploaded.

All backend endpoints use the `/api` prefix.

Optional item images must be JPEG, PNG, WebP, or GIF files no larger than 5 MB. Unsupported image types return `415`, and oversized images return `413`.

## Project Structure

```text
lost-found-campus/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── uploads/
│       └── app.js
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── services/
└── README.md
```

## Contributing

Contributions are welcome, especially improvements that make the platform easier to use and more reliable.

1. Check the existing issues before starting work.
2. Create a separate branch for your contribution.
3. Keep the change focused on one issue.
4. Test the affected frontend or backend functionality.
5. Open a pull request describing what changed and how it was tested.

If you plan to make a larger change, discuss the approach in an issue first.

## Development Notes

- Uploaded images are currently stored on the backend server's local filesystem. Deployments using ephemeral storage will need a persistent storage solution.
- The search and filtering interface can be improved without duplicating the logic already present in the item listing page.
- Claim status and item status should remain consistent when a claim is approved or rejected.
- Ownership checks must be enforced by the backend, not just by hiding buttons in the frontend.

## Security

Never commit database credentials, JWT secrets, or other private configuration. Keep passwords hashed, validate incoming data, and ensure that users can only edit, delete, or manage claims on items they are authorized to access.
