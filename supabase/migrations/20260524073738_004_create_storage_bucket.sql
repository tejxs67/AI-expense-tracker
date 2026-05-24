/*
  # Create storage bucket for expense attachments

  1. New Storage Bucket
    - Create a storage bucket named 'expense-attachments'
    - Enable public access for viewing attachments
    - Set up RLS policies for uploading/deleting attachments

  2. Security
    - Allow authenticated users to upload files to their own folder
    - Allow authenticated users to view their own files
    - Allow public access for viewing attachments (for simplicity in this college project)
*/

-- This is handled through Supabase dashboard, but we document the setup here
-- The bucket creation and policies would be set in the Supabase UI under Storage

SELECT 'Storage bucket setup instructions: Create a bucket named expense-attachments in Supabase Dashboard' as info;
