# 15: Backend from zero: migrations, seed data and doctor command

Parent: [spec](../spec.md)

**What to build:** A developer who creates an empty Supabase project can bring it to the state the app expects with committed files and commands: apply the domain migrations and the storage owner policy, create the private photos bucket, deploy the delete-account function, and seed a test user with a sample photo, spots and routine entries. A doctor command reports what is installed, which variables are set, whether the backend is reachable and whether the schema is applied.

**Blocked by:** 14 (env-example-and-demo-mode)

**Status:** ready-for-agent

- [ ] One documented command sequence takes an empty project to a working schema, bucket and function
- [ ] Seed command creates a user whose screens show real data without real photos
- [ ] Doctor command prints a clear pass or fail for tools, variables, reachability and schema
- [ ] Verified against a throwaway or local Supabase if one can be created without the owner's accounts; otherwise the gap is stated

## Audit 2026-10-17

- Added by audit: skin-diary-v1 03 left a two-account RLS smoke test open (no spec exists in apps/web/e2e; only schema.test.ts). Include it here: a Playwright spec with two seeded test users that each see zero rows of the other's, run against the recipient's fresh backend.
