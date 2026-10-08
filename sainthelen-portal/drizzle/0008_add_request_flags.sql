-- A flag the office can put on a request: "review with Msgr. Tom".
ALTER TABLE "request_stages" ADD COLUMN IF NOT EXISTS "flag" varchar(30);
ALTER TABLE "request_stages" ALTER COLUMN "stage" DROP NOT NULL;
