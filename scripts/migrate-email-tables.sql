DO $$ BEGIN
  CREATE TYPE subscriber_status AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE email_send_status AS ENUM ('queued', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS email_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  name varchar(255),
  status subscriber_status NOT NULL DEFAULT 'active',
  source varchar(100),
  unsubscribe_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  subscribed_at timestamp NOT NULL DEFAULT now(),
  unsubscribed_at timestamp
);

CREATE TABLE IF NOT EXISTS email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(100) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  delay_hours integer NOT NULL DEFAULT 24,
  subject varchar(255) NOT NULL,
  preheader varchar(255),
  body_markdown text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 0,
  next_send_at timestamp NOT NULL,
  completed_at timestamp,
  enrolled_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id uuid NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  sequence_step_id uuid REFERENCES email_sequence_steps(id) ON DELETE SET NULL,
  subject varchar(255) NOT NULL,
  status email_send_status NOT NULL DEFAULT 'queued',
  resend_id varchar(255),
  error_message text,
  sent_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);
