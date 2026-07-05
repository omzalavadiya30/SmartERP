/*
|--------------------------------------------------------------------------
| SmartERP Database Schema
|--------------------------------------------------------------------------
|
| Module : Authentication
| Table  : users
|
|--------------------------------------------------------------------------
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);