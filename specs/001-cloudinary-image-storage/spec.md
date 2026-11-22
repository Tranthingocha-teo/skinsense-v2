# Feature Specification: Cloudinary image storage

**Feature**: `001-cloudinary-image-storage` · **Created**: 2026-11-21 · **Status**: Implemented (written after the fact from the agy session `eb8b2b12` goal "ảnh là lên Cloudinary rồi lấy link về hiển thị")

## User Scenarios & Testing

### User Story 1 - Face photo stored on Cloudinary (P1)
A signed-in user captures a face Photo in the mobile app. The image is uploaded to Cloudinary and the Photo row keeps the returned https link in `storage_path`.

**Independent Test**: capture a Photo; the `photos.storage_path` value starts with `https://res.cloudinary.com/`; History and Photo detail show it.

**Acceptance Scenarios**
1. **Given** a signed-in user, **When** they save a capture, **Then** the image is uploaded to folder `skin-photos` and the row is created with the https link.
2. **Given** the upload fails, **When** saving, **Then** no row is created and the user sees an error.
3. **Given** an older Photo whose `storage_path` is a Supabase path, **When** History loads, **Then** it still displays through a signed URL.
4. **Given** a Photo on Cloudinary, **When** the user deletes it, **Then** the row is deleted (the Cloudinary image is NOT destroyed; see limitations).

### User Story 2 - Avatar on Cloudinary (P2)
On mobile, a user edits their profile, taps the avatar, picks an image; it uploads to folder `avatars` and the link is saved as `avatarUrl` through `/api/profile`.

**Acceptance Scenarios**
1. **Given** edit mode, **When** the user picks an image and saves, **Then** `avatarUrl` is the Cloudinary link and shows on reload.

### User Story 3 - Shop product image and clinical export (P2)
A shop picks a product image (uploaded to Cloudinary on save). A clinical record export attaches the latest skin Photo's link as `skinPhotoUrl`.

### Edge Cases
- Permission to the photo library denied → message, no crash.
- `expo-image-picker` missing in the installed dev client → message "cần build lại app".

## Requirements

- **FR-001**: Photo capture on mobile MUST upload to Cloudinary and store the https link in `photos.storage_path`.
- **FR-002**: Mobile readers of `storage_path` MUST accept both an https link and a legacy Supabase path.
- **FR-003**: Mobile avatar upload MUST go through `uploadImageRemote` and persist via `avatarUrl`.
- **FR-004**: Scope is the mobile app only. `apps/web` MUST NOT be changed by this feature (owner decision 2026-11-21).

**Key entities**: Photo (`storage_path`: https link or legacy path), Profile (`avatarUrl`).

## Known limitations
- Web still reads `storage_path` as a Supabase path, so Photos captured on mobile after this change do not display on web until web is updated (Constitution II gap, accepted by owner).
- Deleting a Photo does not remove the Cloudinary image (needs a server route in web, out of scope).
- Cloudinary links are public: anyone holding a link can view the face photo (Constitution IV). Mitigation not decided: private/authenticated delivery type vs. accepting public links.
- Photos already in Supabase are not migrated.
- Not verified on a physical device; the dev client must be rebuilt for `expo-image-picker`.

## Success Criteria
- SC-001: `tsc --noEmit` clean in mobile; mobile 170 tests pass.
- SC-002: A new Photo captured on mobile displays in mobile History, Detail and Trends.
