-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "username" DROP NOT NULL,
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL;
