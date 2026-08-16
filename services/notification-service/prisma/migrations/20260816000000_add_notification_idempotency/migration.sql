-- Keep the oldest copy of each historical notification before enforcing event idempotency.
DELETE FROM "Notification" AS duplicate
USING (
    SELECT "id",
           ROW_NUMBER() OVER (
               PARTITION BY "userId", "message", "type"
               ORDER BY "id"
           ) AS row_number
    FROM "Notification"
) AS ranked
WHERE duplicate."id" = ranked."id"
  AND ranked.row_number > 1;

ALTER TABLE "Notification" ADD COLUMN "sourceEventId" TEXT;
CREATE UNIQUE INDEX "Notification_sourceEventId_key" ON "Notification"("sourceEventId");
