/*
  # Create categories table

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `icon` (text, not null)
      - `color` (text, not null)
      - `is_default` (boolean, default true)
      - `user_id` (uuid, nullable - null for default categories, user id for custom categories)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `categories` table
    - Allow all users to view default categories (is_default = true)
    - Allow authenticated users to view their own custom categories
    - Allow authenticated users to create their own custom categories
    - Allow authenticated users to update their own custom categories
    - Allow authenticated users to delete their own custom categories

  3. Default Data
    - Insert default categories for all users
*/

CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  is_default boolean DEFAULT true,
  user_id uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view default categories"
  ON categories FOR SELECT
  TO authenticated
  USING (is_default = true OR user_id = auth.uid());

CREATE POLICY "Users can create custom categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false)
  WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND is_default = false);

INSERT INTO categories (name, icon, color, is_default, user_id) VALUES
  ('Food', 'UtensilsCrossed', '#FF6B6B', true, null),
  ('Transport', 'Car', '#4ECDC4', true, null),
  ('Entertainment', 'Gamepad2', '#45B7D1', true, null),
  ('Shopping', 'ShoppingBag', '#F7DC6F', true, null),
  ('Bills', 'Receipt', '#95A5A6', true, null),
  ('Healthcare', 'Heart', '#E74C3C', true, null),
  ('Education', 'GraduationCap', '#3498DB', true, null),
  ('Others', 'MoreHorizontal', '#9B59B6', true, null);
