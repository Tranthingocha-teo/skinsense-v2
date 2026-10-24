# 12: Signed release pipeline and runbook

Parent: [spec](../spec.md)

**What to build:** The release build is configured for an EAS-managed release keystore and produces a signed APK that the landing page's existing download link points to. Nothing needs the owner's keystore: the recipient creates their own, adds its SHA-1 to their Google OAuth client, and follows the runbook. Dev builds keep the debug keystore. The pipeline is verified as far as possible without credentials. Detail in release-gates tickets 02, 03 and 06.

**Blocked by:** 10 (final-polish-sweep)

**Status:** ready-for-agent

- [ ] Release profile and dev profile are separate and documented
- [ ] Runbook covers keystore creation, the SHA-1 step, build, upload, tag and verification, including uninstalling a debug-signed build first
- [ ] A dry run or local build confirms the configuration is valid
- [ ] Release-gates 02, 03 and 06 are marked done or handed to ticket 22 with exact steps
