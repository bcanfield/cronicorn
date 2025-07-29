import { sql } from "drizzle-orm";
import { type Migration } from "drizzle-orm/postgres-js";

export const up: Migration = async (db) => {
    await db.execute(sql`
    CREATE TABLE "api_key" (
      "id" text PRIMARY KEY NOT NULL,
      "userId" text NOT NULL,
      "name" text NOT NULL,
      "key" text NOT NULL,
      "secret" text NOT NULL,
      "lastUsedAt" timestamp,
      "expiresAt" timestamp,
      "revoked" boolean DEFAULT false,
      "createdAt" timestamp NOT NULL,
      "updatedAt" timestamp NOT NULL,
      "scopes" text[],
      "description" text,
      CONSTRAINT "api_key_key_unique" UNIQUE("key")
    );

    ALTER TABLE "api_key" ADD CONSTRAINT "api_key_userId_user_id_fk" 
      FOREIGN KEY ("userId") REFERENCES "public"."user"("id") 
      ON DELETE cascade ON UPDATE no action;
  `);
};

export const down: Migration = async (db) => {
    await db.execute(sql`
    DROP TABLE "api_key";
  `);
};
