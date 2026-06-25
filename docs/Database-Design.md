# SmartERP Database Design

---

# Introduction

The SmartERP database is designed using a relational database model.

The project uses **Supabase**, which is built on **PostgreSQL**, to store and manage all business data.

The database is normalized to reduce redundancy and maintain data consistency.

The MVP version focuses only on the essential modules required for accounting, inventory, and billing.

---

# Database Technology

Database Provider

- Supabase

Database Engine

- PostgreSQL

Database Type

- Relational Database

---

# Database Design Principles

The SmartERP database follows the principles of relational database design to ensure consistency, scalability, and maintainability.

The following design principles are used:

* Every table uses a UUID as the Primary Key.
* Relationships are maintained using Foreign Keys.
* Business data is separated into independent modules.
* All monetary values are stored using DECIMAL data type.
* Every table includes `created_at` and `updated_at` timestamps.
* Duplicate records are prevented using unique constraints where required.
* The database is normalized up to Third Normal Form (3NF).


# Database Naming Convention

## Table Names

All table names use plural nouns.

Example

users

companies

customers

suppliers

items

sales_vouchers

purchase_vouchers

voucher_items

ledger_entries

---

## Column Names

Snake Case

Example

company_id

purchase_price

selling_price

financial_year

created_at

updated_at

---

## Primary Key

Every table contains

id

UUID

---

## Foreign Key

Foreign keys reference the parent table.

Example

company_id

references

companies(id)

---

# Database Tables

---

## 1. Users

Purpose

Stores authentication information.

Columns

| Column | Data Type | Description |
|----------|------------|-------------|
| id | UUID | Primary Key |
| name | VARCHAR(100) | User Name |
| email | VARCHAR(255) | Unique Email |
| password | TEXT | Encrypted Password |
| created_at | TIMESTAMP | Record Creation |
| updated_at | TIMESTAMP | Last Update |

Relationship

One User

↓

Many Companies

---

## 2. Companies

Purpose

Stores company information.

Columns

| Column | Data Type |
|----------|------------|
| id | UUID |
| user_id | UUID |
| name | VARCHAR(255) |
| gst_no | VARCHAR(20) |
| financial_year | VARCHAR(20) |
| address | TEXT |
| state | VARCHAR(100) |
| phone | VARCHAR(20) |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Relationship

Company

↓

Customers

↓

Suppliers

↓

Items

↓

Sales

↓

Purchases

---

## 3. Customers

Purpose

Stores customer information.

Columns

| Column | Data Type |
|----------|------------|
| id | UUID |
| company_id | UUID |
| name | VARCHAR(255) |
| mobile | VARCHAR(20) |
| address | TEXT |
| opening_balance | DECIMAL |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Relationship

One Company

↓

Many Customers

---

## 4. Suppliers

Purpose

Stores supplier information.

Columns

| Column | Data Type |
|----------|------------|
| id | UUID |
| company_id | UUID |
| name | VARCHAR(255) |
| mobile | VARCHAR(20) |
| address | TEXT |
| opening_balance | DECIMAL |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## 5. Items

### Purpose

Stores inventory products available for purchase and sale.

### Columns

| Column           | Data Type     | Description             |
| ---------------- | ------------- | ----------------------- |
| id               | UUID          | Primary Key             |
| company_id       | UUID          | References Companies    |
| name             | VARCHAR(255)  | Item Name               |
| sku              | VARCHAR(50)   | Stock Keeping Unit      |
| hsn_code         | VARCHAR(20)   | HSN Code                |
| unit             | VARCHAR(20)   | PCS, KG, BOX, LTR       |
| purchase_price   | DECIMAL(10,2) | Purchase Price          |
| selling_price    | DECIMAL(10,2) | Selling Price           |
| gst_rate         | DECIMAL(5,2)  | GST Percentage          |
| opening_quantity | INTEGER       | Opening Stock           |
| current_quantity | INTEGER       | Current Available Stock |
| minimum_quantity | INTEGER       | Minimum Stock Alert     |
| created_at       | TIMESTAMP     | Record Creation         |
| updated_at       | TIMESTAMP     | Last Update             |

### Relationship

One Company

↓

Many Items

## 6. Purchase Vouchers

### Purpose

Stores purchase transactions from suppliers.

### Columns

| Column       | Data Type     | Description             |
| ------------ | ------------- | ----------------------- |
| id           | UUID          | Primary Key             |
| company_id   | UUID          | References Companies    |
| supplier_id  | UUID          | References Suppliers    |
| voucher_no   | VARCHAR(50)   | Unique Voucher Number   |
| voucher_date | DATE          | Purchase Date           |
| invoice_no   | VARCHAR(50)   | Supplier Invoice Number |
| total_amount | DECIMAL(10,2) | Total Amount            |
| gst_amount   | DECIMAL(10,2) | GST Amount              |
| grand_total  | DECIMAL(10,2) | Final Amount            |
| created_at   | TIMESTAMP     | Record Creation         |
| updated_at   | TIMESTAMP     | Last Update             |

## 7. Sales Vouchers

### Purpose

Stores sales transactions.

### Columns

| Column       | Data Type     | Description              |
| ------------ | ------------- | ------------------------ |
| id           | UUID          | Primary Key              |
| company_id   | UUID          | References Companies     |
| customer_id  | UUID          | References Customers     |
| voucher_no   | VARCHAR(50)   | Unique Voucher Number    |
| voucher_date | DATE          | Sales Date               |
| invoice_no   | VARCHAR(50)   | Generated Invoice Number |
| total_amount | DECIMAL(10,2) | Total Amount             |
| gst_amount   | DECIMAL(10,2) | GST Amount               |
| grand_total  | DECIMAL(10,2) | Final Amount             |
| created_at   | TIMESTAMP     | Record Creation          |
| updated_at   | TIMESTAMP     | Last Update              |

## 8. Voucher Items

Purpose

Stores items inside purchase and sales vouchers.

Columns

| Column | Data Type |
|----------|------------|
| id | UUID |
| voucher_id | UUID |
| voucher_type | VARCHAR(20) |
| item_id | UUID |
| quantity | INTEGER |
| rate | DECIMAL |
| amount | DECIMAL |

---

## 9. Ledger Entries

Purpose

Stores accounting entries for customers and suppliers.

Columns

| Column | Data Type |
|----------|------------|
| id | UUID |
| company_id | UUID |
| party_type | VARCHAR(20) |
| party_id | UUID |
| voucher_type | VARCHAR(20) |
| voucher_id | UUID |
| debit | DECIMAL |
| credit | DECIMAL |
| balance | DECIMAL |
| created_at | TIMESTAMP |

---

# Relationships

Users

1 → Many Companies

Companies

1 → Many Customers

Companies

1 → Many Suppliers

Companies

1 → Many Items

Companies

1 → Many Sales Vouchers

Companies

1 → Many Purchase Vouchers

Customers

1 → Many Sales Vouchers

Suppliers

1 → Many Purchase Vouchers

Sales Voucher

1 → Many Voucher Items

Purchase Voucher

1 → Many Voucher Items

Items

1 → Many Voucher Items

Companies

1 → Many Ledger Entries

---

# Stock Calculation

Current Stock

=

Opening Stock

+

Purchase Quantity

-

Sales Quantity

---

# Outstanding Calculation

Customer Outstanding

=

Sales

-

Receipt

Supplier Outstanding

=

Purchase

-

Payment

---

# Database Constraints

Email must be unique.

SKU must be unique within a company.

GST Number should be unique.

Quantity cannot be negative.

Purchase Price cannot be negative.

Selling Price cannot be negative.

Voucher Number should be unique within a company.

---

# Future Tables

The following tables will be added after the MVP.

- groups
- stock_groups
- units
- gst_records
- reports
- audit_logs
- bank_transactions
- payments
- receipts
- journals
- credit_notes
- debit_notes

---

# Database Summary

Total MVP Tables

1. users
2. companies
3. customers
4. suppliers
5. items
6. purchase_vouchers
7. sales_vouchers
8. voucher_items
9. ledger_entries

Total Tables

9

Database

Supabase PostgreSQL

Architecture

Relational Database

Normalization

Third Normal Form (3NF)