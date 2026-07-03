const postgres = require('postgres');
const sql = postgres('postgresql://postgres.tuqxtvpxprkivmdfcjyw:ribdIt-xinmo8-nexzyk@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true');
sql`SELECT 1`.then(console.log).catch(console.error).finally(() => sql.end());
