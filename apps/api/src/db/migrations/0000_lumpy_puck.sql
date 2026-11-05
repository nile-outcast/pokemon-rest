CREATE TABLE "pokemon" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"attack" smallint NOT NULL,
	"defense" smallint NOT NULL,
	"base_experience" smallint NOT NULL,
	"sprite_url" text
);
--> statement-breakpoint
CREATE TABLE "pokemon_types" (
	"pokemon_id" integer NOT NULL,
	"type_id" integer NOT NULL,
	"slot" smallint NOT NULL,
	CONSTRAINT "pokemon_types_pokemon_id_slot_pk" PRIMARY KEY("pokemon_id","slot")
);
--> statement-breakpoint
CREATE TABLE "types" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pokemon_types" ADD CONSTRAINT "pokemon_types_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_types" ADD CONSTRAINT "pokemon_types_type_id_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_name_unique" ON "pokemon" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pokemon_attack_idx" ON "pokemon" USING btree ("attack");--> statement-breakpoint
CREATE INDEX "pokemon_experience_idx" ON "pokemon" USING btree ("base_experience");--> statement-breakpoint
CREATE INDEX "pokemon_types_type_id_idx" ON "pokemon_types" USING btree ("type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "types_name_unique" ON "types" USING btree ("name");
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX "pokemon_name_trgm_idx" ON "pokemon" USING gin ("name" gin_trgm_ops);