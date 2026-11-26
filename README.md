# SmartERP

SmartERP is a keyboard-first billing, inventory and accounting application for small businesses. A purchase receives stock and credits the supplier. A sale issues stock, posts its cost and revenue, records any payment, and produces a customer invoice.

## Run locally on Windows

Install Node.js 22.13 or newer. Open two PowerShell terminals in the repository. The local setup stores company data in the server directory and works without a cloud account.

**Terminal 1 — Express API and database**

```powershell
cd server
npm ci
npm run setup
npm run dev
```

The setup command creates the local configuration with a random JWT secret and applies the schema. Existing configuration is preserved. On later starts use `npm run dev`. The local database lives in `server/.smarterp-data`. To use an existing PostgreSQL or Supabase database, set `DATABASE_URL` in `server/.env` before running the migration. It takes precedence over `PGLITE_PATH`. The SQL connection role must own the SmartERP tables or have equivalent access. Browser clients reach the database through the authenticated Express API.

**Terminal 2 — Next.js frontend**

```powershell
cd client
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open [SmartERP on localhost](http://localhost:3000). Register, sign in, create a company, and choose **Open** on subsequent sign-ins. The API health endpoint is [localhost:5000/api/health](http://localhost:5000/api/health).

## First purchase and sale

1. Create a company with its address, state and financial-year start.
2. Under **Masters**, create a supplier, customer and stock item. For a keyboard, choose unit PCS, SKU KEY-001, purchase rate ₹500, selling rate ₹800 and opening stock zero. Use 0% GST for this example.
3. Press **F9**, select the supplier, enter 10 keyboards at ₹500, leave the settled amount at zero, and post.
4. Press **F8**, select the customer, enter 2 keyboards at ₹800, and record ₹600 settled into Cash.
5. Open **Gateway**. With no other activity, sales are ₹1,600, receivables ₹1,000, payables ₹5,000 and stock value ₹4,000. **Inventory → Stock summary** shows 8 keyboards. Open the invoice to print or download a PDF.

## Modules

| Workspace | Operations |
| --- | --- |
| Companies and access | Create, select, alter and delete companies. Up to five accessible companies per account. Owners manage company information and access. Operators post transactions and manage masters. Viewers inspect records and reports. Owners can create staff accounts or grant access to existing accounts. |
| Masters | Customer, supplier, cash, bank, asset, liability, income and expense accounts, ledger groups, stock groups, items and units. Party records include contact details, GSTIN and address. Items carry SKU, HSN, unit, purchase and selling rates, GST and reorder level. |
| Billing and vouchers | Sales, purchases, receipts, payments, contra transfers, journals with optional dated reversal, credit and debit notes, proforma invoices, quotations and estimates. Saved documents preserve party, tax, item and rate details. |
| Inventory | Opening balances, receipts and issues, stock transfers by location, reservation and release, damaged stock, adjustments, movement history and low-stock reporting. |
| Accounting and banking | Party statements, outstanding balances, trial balance, profit and loss, balance sheet, cash movements, cheque register and bank-statement clearance. |
| GST and reports | CGST, SGST and IGST line calculations, GST register, input/output summary and outward-supply working summary. Daily/monthly sales, top customers, purchase register, supplier summary and Excel exports. |
| Payroll | Post salary expenses against cash or bank and review the payroll register by employee/pay-period narration. |
| Administration and utilities | Team roles, company audit history, calculator, command search, financial-year selection and shortcut reference. |

See **Utilities → Keyboard shortcuts** for the key map. Tab and Shift+Tab move between fields. Ctrl+K opens command search. Browser-reserved shortcuts can vary by platform. All actions also have focusable controls.

## Accounting and inventory conventions

- Voucher posting locks the company row, allocates a number, and writes the voucher, stock movements and balanced postings in one PostgreSQL transaction. A repeated submission carrying the same request ID reuses the original result.
- Financial reports use signed decimal ledger postings. Debit is positive. Bills affect party balances by the unpaid amount after settlement. Quotations, estimates and proformas have no ledger or inventory effect.
- Stock issues use moving weighted-average cost within each location and stock bucket. Returns reference the original bill, check remaining returnable quantity, and retain its tax rate. Stock movement dates must follow or match the item's latest movement date.
- Opening entries are dated at the company's financial-year start. Stock is received into **Main** by default. Transfers and reservations preserve total quantity and value.
- Enter the supplying party's state, the place of supply and the applicable item GST rate. The implemented GST workflow covers ordinary intra-state CGST/SGST and inter-state IGST supplies. The outward summary is a working report for review. Statutory filing, e-invoicing/IRN, UTGST and special tax regimes require additional integration and validation.
- Account roles and company filters apply on the server. Dashboard data updates after posting and connected workspaces refresh on company changes. Existing sessions periodically reconnect to recheck access.

## Stack and layout

| Path | Implementation |
| --- | --- |
| `client/` | Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table and React Hook Form |
| `server/src/modules/auth/` | Express authentication, password hashing, JWT sessions and password recovery |
| `server/src/erp/` | Company-scoped REST API, voucher posting, reports, PDFKit invoices, ExcelJS exports and update stream |
| `server/database/` | PostgreSQL schema and transactional ERP tables, applied by `npm run migrate` |
| `server/test/` | HTTP integration workflow using an isolated PostgreSQL-compatible database |

## Test and build

```powershell
cd server
npm test
cd ../client
npm run lint
npm run build
```

The test creates a fresh in-memory database. To exercise native PostgreSQL, set `SMARTERP_TEST_DATABASE_URL` to a **fresh, disposable test database**. The test suite creates accounts and companies in that database.

## Deploy

1. **Supabase or PostgreSQL** — Create the production database. Obtain its server connection string. For Supabase, choose a direct connection or a session pooler suitable for the backend host. Use the provider's TLS settings.
2. **Render or Railway** — Deploy `server/` as a Node service. Install with `npm ci --omit=dev`. Run `npm run migrate` against the target database before starting with `npm start`. Set `NODE_ENV=production`, `DATABASE_URL`, a new random `JWT_SECRET`, and `FRONTEND_URL` to the exact frontend origin. Use `/api/health` for the health check.
3. **Vercel** — Import the repository and select `client/` as the root directory. Set `NEXT_PUBLIC_API_URL` to the public API origin followed by `/api` at build time. Deploy, then confirm the frontend origin matches the API configuration.
4. **Password recovery** — Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` on the API. Password-reset links use `FRONTEND_URL`. Billing supports PDF download and printing.

[Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres) · [Render Express deployment](https://render.com/docs/deploy-node-express-app) · [Vercel monorepos](https://vercel.com/docs/monorepos)
