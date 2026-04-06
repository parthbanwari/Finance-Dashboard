# Finance Dashboard

Track income, expenses, categories, and analytics in one clean dashboard with role-based access.

## Live Demo

- Website: [Finance Tracker](https://finance-dashboard-frontend-fawn.vercel.app/)
- Quick login: use **your email** + password **`DEMO1234`**

## Why this project

- Simple personal finance tracking
- Clear visual analytics for better decisions
- Role-based access for safer data operations
- Mobile-friendly interface

## Highlights

- Transactions: create, edit, delete, filter, paginate
- Categories: add, duplicate prevention, delete with themed confirmation popup
- Analytics: summary KPIs, category split, running balance, recent transactions
- Team (admin): manage user roles

## Roles

- **Viewer**: read-only
- **Analyst**: add/edit transactions and categories
- **Admin**: full access, including team management and destructive actions

## Quick Local Setup

### Backend (`backend/`)

```bash
python -m venv .venv
# activate venv
pip install -r requirements.txt
python manage.py runserver
```

### Frontend (`frontend/`)

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` by default.

## API (short overview)

Base URL: `/api/v1`

- Auth: `/auth/token/`, `/auth/token/refresh/`
- Users: `/users/me/`, `/users/`
- Transactions: `/transactions/`, `/transactions/categories/`
- Analytics: `/analytics/summary/` and related summary routes

Docs:

- Swagger: `/api/docs/`
- ReDoc: `/api/redoc/`
- Schema: `/api/schema/`

## Important Notes

- Transaction delete is a **soft delete** (hidden from normal views, not hard-erased immediately).
- Category delete can fail if transactions still reference that category.

## Security (for GitHub)

- Never commit `.env`
- Never expose real secrets, DB URIs, or private credentials
- Keep environment values configurable via `.env.example`
