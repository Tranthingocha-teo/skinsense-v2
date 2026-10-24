# 19: Export

**What to build:** a user exports their Photos, zone readings, spots, routine history, Notes and Tags into one .zip built on the device, sees the photo count and estimated size first, follows progress, can cancel, and gets a retry on failure. Spec: Domain package additions, Features (export); stories 86–89.

**Blocked by:** 15.

**Status:** ready-for-agent

- [ ] Domain (test-first, Vitest): rows for zone readings, spots, routine entries (label snapshots, ADR 0004), Notes and Tags with a stable column order, ISO local dates and CSV escaping; file names inside the zip
- [ ] The zip holds the original JPEGs and the CSV files and adds photos one at a time rather than holding every photo in memory (library chosen here)
- [ ] Before starting: photo count, estimated size and export contents (Checkbox)
- [ ] Progress counts photos and export can be cancelled; failure shows an error with retry
- [ ] Android saves through the system file picker/Downloads; web triggers a browser download
- [ ] Cài đặt gains the export row on both apps
- [ ] CONTEXT.md gains **Export**
- [ ] Screen tests on both apps: summary, progress, cancel, error
- [ ] Playwright: the downloaded zip contains the expected files; Maestro: export saves a file
- [ ] Light and dark screenshots match the Export, ExportProgress and ExportError artboards (Android, Web, Phone); differences noted here

## Audit 2026-10-17

- Status: ready-for-agent
- Evidence: No export code on either app; the export row in settings.tsx is only a comment.
- Left: Whole ticket: data export on web and Android. Covered by handoff-completion 08.
