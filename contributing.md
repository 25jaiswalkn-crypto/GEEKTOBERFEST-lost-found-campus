# Contributing to Lost & Found Campus

Thanks for helping improve Lost & Found Campus!

The project aims to make it easier for students to report lost belongings, find reported items, and coordinate the return of misplaced property. Contributions that improve usability, reliability, accessibility, and security are welcome.

## Before You Start

- Check open issues and pull requests before beginning work.
- Discuss large features or changes to the data model with the maintainers first.
- Avoid duplicating an issue that is already being worked on.
- Keep your changes small enough to review and test independently.

## Development Setup

The application uses React, Vite, Tailwind CSS, Node.js, Express, and MongoDB.

### Prerequisites

- Node.js and npm
- MongoDB or MongoDB Atlas
- Git

### 1. Fork and clone

Fork the repository on GitHub, then run:

```bash
git clone https://github.com/<your-username>/lost-found-campus.git
cd lost-found-campus
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

Create a `.env` file using the variables described in the root `README.md`, including the MongoDB connection string and JWT secret.

Start the backend:

```bash
npm run dev
```

### 3. Install frontend dependencies

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend API base URL is configured in `frontend/src/services/api.js`. Make sure it points to your local backend.

For image uploads, follow the existing Multer configuration. Do not commit uploaded personal images or local environment files.

## Branching Guidelines

Create a new branch for every issue:

```bash
git checkout -b fix/claim-validation
git checkout -b feat/item-pagination
git checkout -b docs/contribution-guide
```

Use these prefixes where appropriate:

- `feat/` — new functionality
- `fix/` — bug fixes
- `docs/` — documentation
- `refactor/` — internal improvements
- `test/` — tests

## Coding Guidelines

### Frontend

- Reuse existing React components and API utilities.
- Keep forms accessible and provide useful validation feedback.
- Handle loading, empty, success, and error states.
- Make layouts usable on mobile devices.
- Avoid duplicating search and filtering logic across components.

### Backend

- Validate request data on the server.
- Check authentication and ownership before editing or deleting reports.
- Ensure users can manage claims only when authorized.
- Keep item status and claim status consistent.
- Validate uploaded image types and sizes.
- Return clear, consistent error responses.
- Never expose secrets or sensitive claim information in public responses.

### General

- Follow the existing naming conventions and folder structure.
- Avoid unrelated changes in a contribution.
- Update documentation when behavior or configuration changes.
- Do not commit `node_modules`, local uploads, environment files, or generated build output.

## Testing Your Changes

Before submitting a pull request:

- Build the frontend:

  ```bash
  npm run build
  ```

- Test the affected backend routes and frontend pages.
- Check that users cannot edit or delete another user's item.
- Verify claim submission, approval, rejection, and item-status transitions when relevant.
- Test upload validation if your changes involve images.
- Check browser console and server logs.

Run commands from the appropriate `frontend` or `backend` directory. Use the scripts configured in each directory's `package.json`.

If automated tests are not configured for the affected functionality, explain the manual testing you performed.

## Commit Messages

Use clear, descriptive commit messages:

```text
feat: add item pagination
fix: validate claim ownership
docs: improve local setup guide
refactor: extract reusable filter component
test: cover item deletion permissions
```

## Pull Request Process

1. Push your branch to your fork.
2. Open a pull request against the designated base branch.
3. Reference the issue using `Closes #<issue-number>` when appropriate.
4. Describe the change and its purpose.
5. Include steps to test the change.
6. Add screenshots for visible UI changes.
7. Address review comments before requesting final approval.

Keep pull requests focused and avoid committing credentials, personal data, or unrelated files.

## Reporting Issues

For bugs, include the steps to reproduce the problem, expected behavior, actual behavior, and any relevant error messages.

For feature requests, describe the user problem and proposed solution.

Please do not upload real identity documents, private messages, or sensitive evidence about lost property into public issues.

## Security

Lost & Found Campus handles user accounts, item reports, uploaded images, and claim messages. Never commit secrets or real user data. Report vulnerabilities privately to the maintainers.

## Questions

If you are unsure how a feature should behave, discuss it with the maintainers before implementing a large change.

Thanks for contributing!
