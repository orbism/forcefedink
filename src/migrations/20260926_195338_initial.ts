import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_drops_status" AS ENUM('upcoming', 'live', 'soldout', 'archived');
  CREATE TYPE "public"."enum_originals_status" AS ENUM('available', 'reserved', 'sold');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('prints', 'shipping', 'originals', 'commissions', 'general');
  CREATE TYPE "public"."enum_enquiries_type" AS ENUM('print', 'original', 'commission', 'general');
  CREATE TABLE "artworks_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "artworks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"year" numeric,
  	"medium" varchar,
  	"dimensions" varchar,
  	"process" jsonb,
  	"series_id" integer,
  	"featured" boolean DEFAULT false,
  	"motif_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "series" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"blurb" varchar,
  	"cover_id" integer,
  	"order" numeric DEFAULT 0,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "drops_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "drops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"artwork_id" integer NOT NULL,
  	"edition_size" numeric NOT NULL,
  	"editions_sold" numeric DEFAULT 0 NOT NULL,
  	"price" numeric,
  	"released" timestamp(3) with time zone,
  	"print_details_paper" varchar,
  	"print_details_size" varchar,
  	"print_details_signed" boolean DEFAULT true,
  	"print_details_numbered" boolean DEFAULT true,
  	"ship_note" varchar,
  	"status" "enum_drops_status" DEFAULT 'upcoming' NOT NULL,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "originals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"artwork_id" integer NOT NULL,
  	"price" numeric,
  	"dimensions" varchar,
  	"framed" boolean,
  	"status" "enum_originals_status" DEFAULT 'available' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_full_url" varchar,
  	"sizes_full_width" numeric,
  	"sizes_full_height" numeric,
  	"sizes_full_mime_type" varchar,
  	"sizes_full_filesize" numeric,
  	"sizes_full_filename" varchar
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'general',
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "enquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_enquiries_type" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"subject_title" varchar,
  	"subject_url" varchar,
  	"handled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscribers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"source" varchar,
  	"unsubscribed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"artworks_id" integer,
  	"series_id" integer,
  	"drops_id" integer,
  	"originals_id" integer,
  	"media_id" integer,
  	"faqs_id" integer,
  	"enquiries_id" integer,
  	"subscribers_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_socials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"href" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_text" varchar,
  	"announcement_href" varchar,
  	"hero_tagline" varchar,
  	"hero_intro" varchar,
  	"hero_band_id" integer,
  	"shipping_disclaimer" varchar DEFAULT 'All prints in a drop ship together once the run closes.' NOT NULL,
  	"footer_note" varchar,
  	"audio_id" integer,
  	"audio_title" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "commissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"open" boolean DEFAULT false,
  	"blurb" jsonb,
  	"waitlist" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "artworks_images" ADD CONSTRAINT "artworks_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks_images" ADD CONSTRAINT "artworks_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_series_id_series_id_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_motif_id_media_id_fk" FOREIGN KEY ("motif_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "artworks" ADD CONSTRAINT "artworks_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "series" ADD CONSTRAINT "series_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "series" ADD CONSTRAINT "series_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "drops_images" ADD CONSTRAINT "drops_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "drops_images" ADD CONSTRAINT "drops_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."drops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "drops" ADD CONSTRAINT "drops_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "drops" ADD CONSTRAINT "drops_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "originals" ADD CONSTRAINT "originals_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_artworks_fk" FOREIGN KEY ("artworks_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_series_fk" FOREIGN KEY ("series_id") REFERENCES "public"."series"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_drops_fk" FOREIGN KEY ("drops_id") REFERENCES "public"."drops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_originals_fk" FOREIGN KEY ("originals_id") REFERENCES "public"."originals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiries_fk" FOREIGN KEY ("enquiries_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscribers_fk" FOREIGN KEY ("subscribers_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_socials" ADD CONSTRAINT "site_settings_socials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_band_id_media_id_fk" FOREIGN KEY ("hero_band_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_audio_id_media_id_fk" FOREIGN KEY ("audio_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "artworks_images_order_idx" ON "artworks_images" USING btree ("_order");
  CREATE INDEX "artworks_images_parent_id_idx" ON "artworks_images" USING btree ("_parent_id");
  CREATE INDEX "artworks_images_image_idx" ON "artworks_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "artworks_slug_idx" ON "artworks" USING btree ("slug");
  CREATE INDEX "artworks_series_idx" ON "artworks" USING btree ("series_id");
  CREATE INDEX "artworks_motif_idx" ON "artworks" USING btree ("motif_id");
  CREATE INDEX "artworks_meta_meta_image_idx" ON "artworks" USING btree ("meta_image_id");
  CREATE INDEX "artworks_updated_at_idx" ON "artworks" USING btree ("updated_at");
  CREATE INDEX "artworks_created_at_idx" ON "artworks" USING btree ("created_at");
  CREATE UNIQUE INDEX "series_slug_idx" ON "series" USING btree ("slug");
  CREATE INDEX "series_cover_idx" ON "series" USING btree ("cover_id");
  CREATE INDEX "series_meta_meta_image_idx" ON "series" USING btree ("meta_image_id");
  CREATE INDEX "series_updated_at_idx" ON "series" USING btree ("updated_at");
  CREATE INDEX "series_created_at_idx" ON "series" USING btree ("created_at");
  CREATE INDEX "drops_images_order_idx" ON "drops_images" USING btree ("_order");
  CREATE INDEX "drops_images_parent_id_idx" ON "drops_images" USING btree ("_parent_id");
  CREATE INDEX "drops_images_image_idx" ON "drops_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "drops_slug_idx" ON "drops" USING btree ("slug");
  CREATE INDEX "drops_artwork_idx" ON "drops" USING btree ("artwork_id");
  CREATE INDEX "drops_meta_meta_image_idx" ON "drops" USING btree ("meta_image_id");
  CREATE INDEX "drops_updated_at_idx" ON "drops" USING btree ("updated_at");
  CREATE INDEX "drops_created_at_idx" ON "drops" USING btree ("created_at");
  CREATE UNIQUE INDEX "originals_artwork_idx" ON "originals" USING btree ("artwork_id");
  CREATE INDEX "originals_updated_at_idx" ON "originals" USING btree ("updated_at");
  CREATE INDEX "originals_created_at_idx" ON "originals" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_full_sizes_full_filename_idx" ON "media" USING btree ("sizes_full_filename");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "enquiries_updated_at_idx" ON "enquiries" USING btree ("updated_at");
  CREATE INDEX "enquiries_created_at_idx" ON "enquiries" USING btree ("created_at");
  CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");
  CREATE INDEX "subscribers_updated_at_idx" ON "subscribers" USING btree ("updated_at");
  CREATE INDEX "subscribers_created_at_idx" ON "subscribers" USING btree ("created_at");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_artworks_id_idx" ON "payload_locked_documents_rels" USING btree ("artworks_id");
  CREATE INDEX "payload_locked_documents_rels_series_id_idx" ON "payload_locked_documents_rels" USING btree ("series_id");
  CREATE INDEX "payload_locked_documents_rels_drops_id_idx" ON "payload_locked_documents_rels" USING btree ("drops_id");
  CREATE INDEX "payload_locked_documents_rels_originals_id_idx" ON "payload_locked_documents_rels" USING btree ("originals_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_enquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiries_id");
  CREATE INDEX "payload_locked_documents_rels_subscribers_id_idx" ON "payload_locked_documents_rels" USING btree ("subscribers_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_socials_order_idx" ON "site_settings_socials" USING btree ("_order");
  CREATE INDEX "site_settings_socials_parent_id_idx" ON "site_settings_socials" USING btree ("_parent_id");
  CREATE INDEX "site_settings_hero_hero_band_idx" ON "site_settings" USING btree ("hero_band_id");
  CREATE INDEX "site_settings_audio_idx" ON "site_settings" USING btree ("audio_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "artworks_images" CASCADE;
  DROP TABLE "artworks" CASCADE;
  DROP TABLE "series" CASCADE;
  DROP TABLE "drops_images" CASCADE;
  DROP TABLE "drops" CASCADE;
  DROP TABLE "originals" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "enquiries" CASCADE;
  DROP TABLE "subscribers" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_socials" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "commissions" CASCADE;
  DROP TYPE "public"."enum_drops_status";
  DROP TYPE "public"."enum_originals_status";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_enquiries_type";`)
}
