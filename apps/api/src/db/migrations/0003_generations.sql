CREATE TABLE "generations" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "generations_name_unique" ON "generations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "pokemon_generation_id_idx" ON "pokemon" USING btree ("generation_id");