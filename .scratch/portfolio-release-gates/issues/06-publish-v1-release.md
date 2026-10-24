# 06: Publish v1.0.0 to skinsense-releases

**What to build:** the QA-passed release-signed APK is published as v1.0.0, marked Latest, in the public `dinh144/skinsense-releases` repo, and the landing page download link serves it with no web code change. Spec gate 2, stories 10, 14–16.

**Blocked by:** 05 (go)

**Status:** ready-for-agent

- [ ] Release tagged v1.0.0, marked Latest; the asset keeps the fixed name the landing page links to
- [ ] Release notes: what the app does, supported Android versions and architecture (arm64-v8a), and "uninstall the Preview first" because the signature changed
- [ ] The "Preview (2026-09-14)" release stays up unchanged
- [ ] The landing page download link downloads the v1.0.0 APK (signer certificate checked on the downloaded file)

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: No v1.0.0 release recorded; the landing page still points at the owner's skinsense-releases repo.
- Left: Publish the signed APK. Covered by handoff-completion 12 and 16 (owner identities) and 22.
