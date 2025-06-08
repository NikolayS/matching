-- Create verification_codes table for SMS verification
CREATE TABLE verification_codes (
    id SERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX idx_verification_codes_phone_code ON verification_codes(phone_number, code);
CREATE INDEX idx_verification_codes_expires ON verification_codes(expires_at);

-- Enable RLS (but we'll use service key in edge functions to bypass it)
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create a cleanup function to remove expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM verification_codes 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run cleanup every hour (if pg_cron is available)
-- SELECT cron.schedule('cleanup-verification-codes', '0 * * * *', 'SELECT cleanup_expired_verification_codes();'); 