-- New table for available languages
CREATE TABLE "languages" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar(255) NOT NULL UNIQUE,
    "code" varchar(16) NOT NULL UNIQUE
);

-- New table addtions
ALTER TABLE "users" ADD COLUMN "last_worksheet_id" integer;