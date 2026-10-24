CREATE TABLE "photo_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid DEFAULT auth.uid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "photo_tags_label_length" CHECK (char_length("photo_tags"."label") between 1 and 24)
);
--> statement-breakpoint
ALTER TABLE "photo_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_tags" ADD CONSTRAINT "photo_tags_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "photo_tags_photo_label_unique" ON "photo_tags" USING btree ("photo_id",lower("label"));--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_note_length" CHECK (char_length("photos"."note") <= 500);--> statement-breakpoint
CREATE POLICY "photo_tags: owner only" ON "photo_tags" AS PERMISSIVE FOR ALL TO "authenticated" USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()) and exists (select 1 from photos p where p.id = photo_id and p.user_id = (select auth.uid())));