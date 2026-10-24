-- Owner-folder access to the private `photos` bucket: objects live at
-- `${auth.uid()}/${photoId}.jpg` (spec.md "Backend"), so the first path
-- segment is the owner. Custom migration: drizzle can't model storage.objects.
CREATE POLICY "photos: owner folder" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = (select auth.uid())::text)
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);
