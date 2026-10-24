# 17: Scan the tree and history for secrets

Parent: [spec](../spec.md)

**What to build:** The working tree and the full git history are scanned for keys, tokens and passwords. Ignored env files stay ignored. A report lists what was found (names and locations only, never values) and what the owner must rotate, since rotation cannot be delegated.

**Blocked by:** 02 (audit-ticket-truth)

**Status:** done (scan and report: secrets-report.md). Rotation list handed to owner: ready-for-human.

- [x] Scan covers working tree and all history
- [x] Report lists findings with commit and location, no secret values
- [x] Ignore rules keep env files out of the repo; gap: no root `*.jks`/`*.keystore` rule (see report)
- [ ] (ready-for-human, owner action) Rotation list is handed to the owner as ready-for-human
