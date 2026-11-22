# Implementation Plan: Cloudinary image storage

**Spec**: [spec.md](spec.md)

## Approach
Mobile only. Reuse the existing `POST /api/upload/cloudinary` (Bearer auth) unchanged. No schema change: `photos.storage_path` (text) holds either a legacy Supabase path or an https link; readers branch on `^https?://`.

## Constitution Check
- II (one contract): GAP. Web not changed by owner decision; recorded in spec limitations.
- IV (privacy): public-link risk and no Cloudinary delete documented. Open.
- V (verify): tsc + unit tests; device run pending.

## Changes
| Area | File | Change |
|---|---|---|
| Mobile | `lib/photos.ts`, `lib/history.ts`, `lib/trends.ts`, `lib/api.ts` | upload on capture; readers accept https |
| Mobile | `components/role-profile.tsx` | avatar picker → Cloudinary → `avatarUrl` |
| Mobile | `components/shop-portal.tsx`, `today.tsx`, `app.json`, `licenses.json` | product image picker; clinical `skinPhotoUrl`; `expo-image-picker` plugin |

## Risks
- Public delivery URLs for face photos.
- Mobile-captured Photos invisible on web until web is updated.
