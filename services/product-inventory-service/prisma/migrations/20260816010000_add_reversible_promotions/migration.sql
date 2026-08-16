-- Promotions are separate from catalog prices so a cancellation restores prices exactly.
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "discountPercentage" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);
