# SmartERP Entity Relationship Diagram

## Overview

The SmartERP database follows a relational database model.

Each user can own multiple companies.

Each company manages its own customers, suppliers, inventory items, vouchers and ledger entries.

The following ER Diagram represents the relationship between all MVP database tables.

---

## Relationship Flow

User

↓

Company

↓

Customers

↓

Sales Voucher

↓

Voucher Items

↓

Items

Company

↓

Suppliers

↓

Purchase Voucher

↓

Voucher Items

↓

Items

Company

↓

Ledger Entries

---

## Relationships

### User

One User

↓

Many Companies

---

### Company

One Company

↓

Many Customers

Many Suppliers

Many Items

Many Purchase Vouchers

Many Sales Vouchers

Many Ledger Entries

---

### Customer

One Customer

↓

Many Sales Vouchers

---

### Supplier

One Supplier

↓

Many Purchase Vouchers

---

### Voucher

One Voucher

↓

Many Voucher Items

---

### Item

One Item

↓

Many Voucher Items