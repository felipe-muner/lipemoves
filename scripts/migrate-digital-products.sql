CREATE TABLE IF NOT EXISTS digital_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(100) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  description text,
  stripe_price_id varchar(255) NOT NULL,
  file_path varchar(500) NOT NULL,
  price_cents integer NOT NULL,
  currency varchar(10) NOT NULL DEFAULT 'brl',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS digital_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES digital_products(id) ON DELETE RESTRICT,
  email varchar(255) NOT NULL,
  name varchar(255),
  download_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  stripe_session_id varchar(255) UNIQUE,
  stripe_payment_intent_id varchar(255),
  amount_paid_cents integer NOT NULL,
  currency varchar(10) NOT NULL,
  download_count integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 10,
  expires_at timestamp NOT NULL,
  delivered_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
