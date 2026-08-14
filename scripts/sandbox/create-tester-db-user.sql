-- Grants para sandbox_tester (el rol lo crea create-tester-db-user.sh)
GRANT USAGE ON SCHEMA public TO sandbox_tester;
GRANT USAGE ON SCHEMA security TO sandbox_tester;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sandbox_tester;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA security TO sandbox_tester;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sandbox_tester;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA security TO sandbox_tester;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sandbox_tester;
ALTER DEFAULT PRIVILEGES IN SCHEMA security
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sandbox_tester;
