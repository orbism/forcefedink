import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" ALTER COLUMN "shipping_disclaimer" SET DEFAULT 'Editions ship together when the run closes.';
  ALTER TABLE "site_settings" ADD COLUMN "about_bio" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "about_portrait_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "shipping_body" jsonb;
  ALTER TABLE "site_settings" ADD COLUMN "shipping_image_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_about_portrait_id_media_id_fk" FOREIGN KEY ("about_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_shipping_image_id_media_id_fk" FOREIGN KEY ("shipping_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_about_about_portrait_idx" ON "site_settings" USING btree ("about_portrait_id");
  CREATE INDEX "site_settings_shipping_shipping_image_idx" ON "site_settings" USING btree ("shipping_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_about_portrait_id_media_id_fk";
  
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_shipping_image_id_media_id_fk";
  
  DROP INDEX "site_settings_about_about_portrait_idx";
  DROP INDEX "site_settings_shipping_shipping_image_idx";
  ALTER TABLE "site_settings" ALTER COLUMN "shipping_disclaimer" SET DEFAULT 'All prints in a drop ship together once the run closes.';
  ALTER TABLE "site_settings" DROP COLUMN "about_bio";
  ALTER TABLE "site_settings" DROP COLUMN "about_portrait_id";
  ALTER TABLE "site_settings" DROP COLUMN "shipping_body";
  ALTER TABLE "site_settings" DROP COLUMN "shipping_image_id";`)
}
