-- Grant service_role access to porton schema
-- Required for edge functions that use the service role key (e.g. send-notification)
GRANT USAGE ON SCHEMA porton TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA porton TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA porton TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA porton GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA porton GRANT ALL ON SEQUENCES TO service_role;
