# 22: Recipient launch checklist

Parent: [spec](../spec.md)

**What to build:** The steps that need the recipient's own accounts, hardware or production credentials, in order, each linking its runbook: create the Supabase, Google, Vercel and Expo accounts; apply the backend; run the doctor command; create the release keystore and build the signed APK; run the QA checklist on a real phone; run the Lighthouse audit against production; publish the release. The owner separately rotates any secret from ticket 17.

**Blocked by:** 21 (clean-clone-dry-run-and-done-report)

**Status:** ready-for-human

- [ ] Every step has a runbook link and an expected evidence line
- [ ] The recipient has ticked each step and attached the evidence
