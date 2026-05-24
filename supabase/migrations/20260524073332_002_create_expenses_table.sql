/*
  # Create expenses table

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `amount` (decimal, not null)
      - `description` (text, not null)
      - `category_id` (uuid, foreign key to categories)
      - `date` (date, not null)
      - `notes` (text, nullable)
      - `attachment_url` (text, nullable)
      - `is_recurring` (boolean, default false)
      - `recurring_frequency` (text, nullable - 'daily', 'weekly', 'monthly', 'yearly')
      - `user_id` (uuid, not null)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `expenses` table
    - Allow authenticated users to view their own expenses
    - Allow authenticated users to create expenses
    - Allow authenticated users to update their own expenses
    - Allow authenticated users to delete their own expenses

  3. Indexes
    - Index on user_id for faster queries
    - Index on date for date range queries
    - Index on category_id for category filtering
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  date date NOT NULL,
  notes text,
  attachment_url text,
  is_recurring boolean DEFAULT false,
  recurring_frequency text CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
