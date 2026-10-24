# 16: Remove the owner's identities from the code

Parent: [spec](../spec.md)

**What to build:** Everything tied to the owner (Supabase project URL, OAuth client ids, Android package id, releases repo, download link, contact email, domain, repo URLs in docs and Maestro flows) moves into configuration, or is listed in one table naming each place to change. After the change the app still runs in demo mode and tests pass.

**Blocked by:** 14 (env-example-and-demo-mode)

**Status:** ready-for-agent

- [ ] No owner-specific URL, id or email is hard-coded outside configuration or the listed table
- [ ] One table lists every remaining owner-specific value and where to change it
- [ ] Typecheck and tests pass; demo mode unaffected
