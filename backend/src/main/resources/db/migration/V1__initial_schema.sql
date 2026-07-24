CREATE TABLE admin_users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    created_at TIMESTAMP
);

CREATE TABLE product (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(19, 2) NOT NULL,
    discount_percent INTEGER,
    discount_price NUMERIC(19, 2),
    category VARCHAR(255) NOT NULL,
    image_url TEXT,
    highlighted BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE purchase_order (
    id UUID PRIMARY KEY,
    number VARCHAR(255),
    phone VARCHAR(255),
    email VARCHAR(255),
    tracking_code VARCHAR(255),
    shipping_option VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    subtotal NUMERIC(19, 2),
    shipping NUMERIC(19, 2),
    total NUMERIC(19, 2),
    status VARCHAR(255),
    payment VARCHAR(255),
    cep VARCHAR(255),
    street VARCHAR(255),
    address_number VARCHAR(255),
    complement VARCHAR(255),
    neighborhood VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255)
);

CREATE TABLE order_items (
    purchase_order_id UUID NOT NULL,
    product_id VARCHAR(255),
    name VARCHAR(255),
    price NUMERIC(19, 2),
    quantity INTEGER,
    CONSTRAINT fk_order_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id)
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    order_number VARCHAR(255),
    action VARCHAR(255),
    user_name VARCHAR(255),
    details TEXT,
    timestamp TIMESTAMP
);

CREATE TABLE faqs (
    id UUID PRIMARY KEY,
    question VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL
);

CREATE TABLE home_settings (
    id BIGINT PRIMARY KEY,
    hero_title VARCHAR(255),
    hero_description TEXT,
    hero_image TEXT
);

CREATE TABLE home_values (
    home_settings_id BIGINT NOT NULL,
    id VARCHAR(255),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    CONSTRAINT fk_home_values_home FOREIGN KEY (home_settings_id) REFERENCES home_settings(id)
);

CREATE TABLE home_settings_highlight_ids (
    home_settings_id BIGINT NOT NULL,
    highlight_ids VARCHAR(255),
    CONSTRAINT fk_home_highlights_home FOREIGN KEY (home_settings_id) REFERENCES home_settings(id)
);

CREATE TABLE about_settings (
    id BIGINT PRIMARY KEY,
    subtitle VARCHAR(255),
    title TEXT,
    image_url TEXT,
    paragraph1 TEXT,
    paragraph2 TEXT,
    paragraph3 TEXT,
    stat1_number VARCHAR(255),
    stat1_label VARCHAR(255),
    stat2_number VARCHAR(255),
    stat2_label VARCHAR(255),
    stat3_number VARCHAR(255),
    stat3_label VARCHAR(255),
    updated_at TIMESTAMP
);

CREATE TABLE institutional_settings (
    id BIGINT PRIMARY KEY,
    terms_content TEXT NOT NULL,
    exchanges_content TEXT NOT NULL,
    privacy_content TEXT NOT NULL,
    updated_at TIMESTAMP
);
