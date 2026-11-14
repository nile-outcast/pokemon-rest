CREATE TABLE "abilities" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pokemon_abilities" (
	"pokemon_id" integer NOT NULL,
	"ability_id" integer NOT NULL,
	"slot" smallint NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pokemon_abilities_pokemon_id_slot_pk" PRIMARY KEY("pokemon_id","slot")
);
--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "color" SET NOT NULL;--> statement-breakpoint
-- Временные defaults нужны, чтобы NOT NULL применился к уже сидированным строкам.
-- После пере-сида значения перезаписываются сидером, а default убирается.
ALTER TABLE "pokemon" ADD COLUMN "hp" smallint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pokemon" ADD COLUMN "special_attack" smallint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pokemon" ADD COLUMN "special_defense" smallint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pokemon" ADD COLUMN "generation_id" smallint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "hp" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "special_attack" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "special_defense" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pokemon" ALTER COLUMN "generation_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "pokemon_abilities" ADD CONSTRAINT "pokemon_abilities_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokemon_abilities" ADD CONSTRAINT "pokemon_abilities_ability_id_abilities_id_fk" FOREIGN KEY ("ability_id") REFERENCES "public"."abilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "abilities_name_unique" ON "abilities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pokemon_abilities_ability_id_idx" ON "pokemon_abilities" USING btree ("ability_id");