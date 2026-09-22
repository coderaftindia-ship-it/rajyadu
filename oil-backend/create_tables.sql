-- =============================================
-- RAJYADU OLI - Database Schema
-- PostgreSQL
-- =============================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    phone_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image_url VARCHAR(255)
);

-- 3. Sub-Categories
CREATE TABLE IF NOT EXISTS sub_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id),
    sub_category_id BIGINT REFERENCES sub_categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    short_description TEXT,
    description TEXT,
    price NUMERIC(19,2) NOT NULL,
    original_price NUMERIC(19,2),
    rating DOUBLE PRECISION,
    review_count INTEGER,
    size VARCHAR(255),
    sale_offer VARCHAR(255),
    tags_csv VARCHAR(255),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    featured BOOLEAN NOT NULL DEFAULT false,
    bestseller BOOLEAN NOT NULL DEFAULT false,
    new_launch BOOLEAN NOT NULL DEFAULT false,
    ingredients TEXT,
    benefits TEXT,
    how_to_use TEXT,
    image_url VARCHAR(255)
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(64) PRIMARY KEY,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(255),
    shipping_address TEXT,
    shipping_city VARCHAR(255),
    shipping_state VARCHAR(255),
    shipping_pincode VARCHAR(255),
    subtotal NUMERIC(12,2),
    shipping NUMERIC(12,2),
    total NUMERIC(12,2),
    payment_method VARCHAR(32),
    payment_status VARCHAR(32),
    cashfree_order_id VARCHAR(128),
    delivery_provider VARCHAR(32),
    tracking_id VARCHAR(128),
    tracking_url TEXT,
    status VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES orders(id),
    product_id BIGINT,
    product_name VARCHAR(255),
    variant VARCHAR(255),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2),
    image_url VARCHAR(255)
);

-- 7. OTPs
CREATE TABLE IF NOT EXISTS otps (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false
);

-- 8. Sliders
CREATE TABLE IF NOT EXISTS sliders (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    image_url VARCHAR(255) NOT NULL
);

-- 9. Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(255),
    file_url VARCHAR(255),
    last_updated TIMESTAMP
);

-- 10. Terms and Conditions
CREATE TABLE IF NOT EXISTS terms_and_conditions (
    id BIGSERIAL PRIMARY KEY,
    section_title VARCHAR(255) NOT NULL,
    section_content TEXT,
    section_order INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_updated TIMESTAMP
);
