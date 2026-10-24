# Supabase Setup Guide: From Zero to Production

This guide walks through configuring a fresh, free-tier Supabase project for SkinSense v2.

---

## 1. Create a Supabase Project

1. Go to [database.new](https://database.new) and create a new project.
2. Choose your preferred region and note your database password.
3. Once initialized, navigate to **Project Settings** -> **API** to copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **anon / public key** (`eyJ...`)
   - **service_role key** (keep secret; only for edge function deployment / administration)

---

## 2. Apply Database Migrations

SkinSense maintains version-controlled Drizzle migrations under `packages/domain/drizzle`:

- `0000_init.sql`: Base tables (`photos`, `readings`, `routine_items`, `routine_entries`, `spots`) with Row Level Security (RLS).
- `0001_routine_items_unique_label.sql`: Routine labels index.
- `0002_photos_storage_owner_policy.sql`: Storage RLS owner policy.
- `0003_feedback.sql`: Feedback submission table.
- `0004_notes_and_tags.sql`: Photo diary notes, tags, and junction table.

### Option A: SQL Editor (Recommended for Quick Setup)
1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the SQL files in numeric order from `packages/domain/drizzle/0000_init.sql` through `0004_notes_and_tags.sql`.

### Option B: Drizzle CLI
```bash
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
cd packages/domain
bun drizzle-kit migrate
```

---

## 3. Storage Bucket Configuration

SkinSense stores private face photos in a dedicated Supabase Storage bucket:

1. In Supabase Dashboard, go to **Storage** -> **Create a new bucket**.
2. Name the bucket: `photos`
3. Toggle **Private bucket** to **ON** (photos must never be public).
4. Apply the storage RLS policy:
```sql
create policy "Users manage own photos"
on storage.objects for all
using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. Deploy Delete-Account Edge Function

The `delete-account` edge function enables complete GDPR-compliant account wipe:

1. Install Supabase CLI: `bun add -g supabase`
2. Link your project: `supabase link --project-ref <your-project-ref>`
3. Deploy function:
```bash
supabase functions deploy delete-account --no-verify-jwt
```

---

## 5. Verify Setup

Run the built-in diagnostic and test seeder:

```bash
bun run doctor
bun run seed
```
All checks should report green or passing!
