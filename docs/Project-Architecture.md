# SmartERP Project Architecture

---

# Introduction

SmartERP follows a modular three-tier architecture.

The application is divided into three independent layers:

1. Presentation Layer (Frontend)
2. Business Logic Layer (Backend)
3. Database Layer

This architecture makes the application scalable, maintainable, secure, and easy to extend.

---

# High-Level Architecture

                    User
                      │
                      ▼
          Next.js Frontend (React)
                      │
        REST API (HTTP/HTTPS)
                      │
                      ▼
          Express.js Backend API
                      │
        Business Logic & Validation
                      │
                      ▼
         Supabase PostgreSQL Database

---

# Technology Stack

## Frontend

- Next.js
- React.js
- Tailwind CSS
- ShadCN UI
- TanStack Table
- React Hook Form

---

## Backend

- Node.js
- Express.js

---

## Database

- Supabase
- PostgreSQL

---

## Authentication

- JWT Authentication

---

## Documents

- PDFKit

---

## Reports

- ExcelJS

---

# Application Layers

## 1. Presentation Layer

The Presentation Layer is responsible for interacting with the user.

Responsibilities

- Display pages
- Forms
- Tables
- Dashboard
- Keyboard Navigation
- Reports

Technology

- Next.js
- React
- Tailwind CSS

---

## 2. Business Layer

The backend handles all business logic.

Responsibilities

- Authentication
- Customer Management
- Supplier Management
- Inventory
- Voucher Processing
- Invoice Generation
- Report Generation

Technology

- Node.js
- Express.js

---

## 3. Database Layer

The database stores all business information.

Responsibilities

- Customers
- Suppliers
- Items
- Companies
- Vouchers
- Ledger Entries

Technology

- Supabase PostgreSQL

---

# Request Flow

User

↓

Frontend

↓

REST API

↓

Express.js

↓

Supabase Database

↓

Response

↓

Frontend

↓

User

---

# Authentication Flow

Login

↓

Email & Password

↓

Express Server

↓

Verify User

↓

Generate JWT

↓

Return Token

↓

Protected Routes

---

# Purchase Voucher Flow

Supplier

↓

Purchase Voucher

↓

Voucher Items

↓

Stock Increase

↓

Ledger Entry

↓

Database

---

# Sales Voucher Flow

Customer

↓

Sales Voucher

↓

Voucher Items

↓

Stock Decrease

↓

Ledger Entry

↓

Invoice Generation

↓

Database

---

# Reporting Flow

Database

↓

Backend

↓

Generate Report

↓

Frontend

↓

Display Report

↓

Export PDF / Excel

---

# Module Structure

Authentication

↓

Company

↓

Customer

↓

Supplier

↓

Items

↓

Purchase Voucher

↓

Sales Voucher

↓

Reports

---

# Advantages

- Modular Architecture
- Easy Maintenance
- High Scalability
- Secure Authentication
- Easy Deployment
- Cloud Ready
- Keyboard Friendly