-- Add fee column to withdrawal_requests table
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2) DEFAULT 0.00;

-- Optional: Update existing records to have 0 fee if needed (handled by default)
nothing done
