CREATE TYPE "CosmeticType" AS ENUM ('SKIN', 'HAT', 'TRAIL', 'EFFECT');
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "coins" INTEGER NOT NULL DEFAULT 500,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "level" INTEGER NOT NULL DEFAULT 1,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Score" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "gameId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "coinsAwarded" INTEGER NOT NULL,
  "xpAwarded" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Score_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Score_gameId_score_idx" ON "Score"("gameId", "score");
CREATE INDEX "Score_userId_createdAt_idx" ON "Score"("userId", "createdAt");

CREATE TABLE "Cosmetic" (
  "id" TEXT NOT NULL,
  "type" "CosmeticType" NOT NULL,
  "name" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "rarity" "Rarity" NOT NULL,
  "icon" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Cosmetic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Inventory" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "cosmeticId" TEXT NOT NULL,
  "ownedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Inventory_userId_cosmeticId_key" ON "Inventory"("userId", "cosmeticId");

CREATE TABLE "Season" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PassReward" (
  "id" TEXT NOT NULL,
  "seasonId" TEXT NOT NULL,
  "tier" INTEGER NOT NULL,
  "coins" INTEGER NOT NULL DEFAULT 0,
  "cosmeticId" TEXT,
  CONSTRAINT "PassReward_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PassReward_seasonId_tier_key" ON "PassReward"("seasonId", "tier");

CREATE TABLE "PassClaim" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rewardId" TEXT NOT NULL,
  "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PassClaim_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PassClaim_userId_rewardId_key" ON "PassClaim"("userId", "rewardId");

CREATE TABLE "DailyChallenge" (
  "id" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "gameId" TEXT,
  "target" INTEGER NOT NULL,
  "rewardCoins" INTEGER NOT NULL,
  "rewardXp" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DailyChallenge_dateKey_challengeId_key" ON "DailyChallenge"("dateKey", "challengeId");

CREATE TABLE "ChallengeProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "dateKey" TEXT NOT NULL,
  "value" INTEGER NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "ChallengeProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ChallengeProgress_userId_challengeId_dateKey_key" ON "ChallengeProgress"("userId", "challengeId", "dateKey");

ALTER TABLE "Score" ADD CONSTRAINT "Score_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "Cosmetic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PassReward" ADD CONSTRAINT "PassReward_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PassReward" ADD CONSTRAINT "PassReward_cosmeticId_fkey" FOREIGN KEY ("cosmeticId") REFERENCES "Cosmetic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PassClaim" ADD CONSTRAINT "PassClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PassClaim" ADD CONSTRAINT "PassClaim_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "PassReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeProgress" ADD CONSTRAINT "ChallengeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
