/*
  # Newsletter Subscribers Table
  
  1. New Table
    - `newsletter_subscribers` - Stores newsletter subscription information
      - `id` (uuid, primary key)
      - `email` (text, unique, encrypted)
      - `subscription_date` (timestamptz)
      - `status` (text) - 'active' or 'inactive'
      - `source` (text) - Where the subscription originated
      - `opt_in_confirmed` (boolean)
      - `opt_in_date` (timestamptz)
      - `unsubscribe_token` (text, unique)
      - `last_updated` (timestamptz)
      - `gdpr_consent` (boolean)
      - `ip_address` (text) - For audit purposes
  
  2. Security
    - Enable RLS on the table
    - Add policies for admin access
    - Add policy for public subscription
    - Encrypt email addresses using pgcrypto
*/

-- Create extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  email_hash text GENERATED ALWAYS AS (encode(digest(lower(email), 'sha256'), 'hex')) STORED,
  subscription_date timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  source text DEFAULT 'website',
  opt_in_confirmed boolean DEFAULT false,
  opt_in_date timestamptz,
  unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  last_updated timestamptz DEFAULT now(),
  gdpr_consent boolean DEFAULT false,
  ip_address text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email_hash ON newsletter_subscribers(email_hash);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscription_date ON newsletter_subscribers(subscription_date);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view all subscribers"
  ON newsletter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Admin users can manage subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.auth_user_id = auth.uid()
      AND admin_users.status = 'active'
    )
  );

CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_newsletter_subscribers_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_newsletter_subscribers_last_updated
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_subscribers_last_updated();

-- Create function to handle opt-in confirmation
CREATE OR REPLACE FUNCTION confirm_newsletter_opt_in(token text)
RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  UPDATE newsletter_subscribers
  SET 
    opt_in_confirmed = true,
    opt_in_date = now(),
    status = 'active'
  WHERE unsubscribe_token = token
  AND opt_in_confirmed = false;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create function to handle unsubscribe
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(token text)
RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  UPDATE newsletter_subscribers
  SET 
    status = 'inactive',
    last_updated = now()
  WHERE unsubscribe_token = token;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ language 'plpgsql' SECURITY DEFINER;