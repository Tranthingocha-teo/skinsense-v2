# 19: README and from-zero setup guides

Parent: [spec](../spec.md)

**What to build:** A root README and per-service guides take a stranger from clone to a running web app, a running Android app and a signed release on their own accounts: Supabase, Google OAuth for web and Android, Vercel, EAS, the keep-alive job, the releases repo, the release runbook, the architecture overview and links to the ADRs and research notes. Guides name what to create and which values go where, never secret values.

**Blocked by:** 12 (signed-release-pipeline), 15 (backend-from-zero), 16 (remove-owner-identities)

**Status:** ready-for-agent

- [ ] README reaches a running web app and Android app using only its own instructions
- [ ] Each service guide lists what to create, the values to copy and the free-tier limits that matter
- [ ] Release runbook, operations note (keep-alive, uptime) and architecture links are present
- [ ] No secret values appear anywhere
