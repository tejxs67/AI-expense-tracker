/*
  # Create budgets table

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to categories)
      - `amount` (decimal, not null)
      - `month` (integer, not null - 1-12)
      - `year` (integer, not null)
      - `user_id` (uuid, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `budgets` table
    - Allow authenticated users to view their own budgets
    - Allow authenticated users to create budgets
    - Allow authenticated users to update their own budgets
    - Allow authenticated users to delete their own budgets

  3. Indexes
    - Index on user_id for faster queries
    - Index on category_id for category filtering
    - Unique constraint on (user_id, category_id, month, year) to prevent duplicate budgets
*/

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
