-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "displayName" TEXT,
    "showName" BOOLEAN NOT NULL DEFAULT true,
    "bio" TEXT,
    "ageBand" TEXT,
    "region" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "reliabilityScore" INTEGER NOT NULL DEFAULT 100,
    "isIdentityVerified" BOOLEAN NOT NULL DEFAULT false,
    "zkPassportNullifier" TEXT,
    "verificationProvider" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "type" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "walletAddress" TEXT NOT NULL,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "ownerUserId" TEXT,
    "lastMonthlyUpdate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityLink" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "EntityLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "entityId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "totalBountyUsdc" DECIMAL(20,6) NOT NULL DEFAULT 0,
    "defaultSplitJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stake" (
    "id" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "txHash" TEXT,
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "memo" TEXT,
    "txHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResolutionDecision" (
    "id" TEXT NOT NULL,
    "stakeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResolutionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "outcomeId" TEXT NOT NULL,
    "proofText" TEXT NOT NULL,
    "proofFiles" TEXT[],
    "proofTxHashes" TEXT[],
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedById" TEXT,
    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountUsdc" DECIMAL(20,6) NOT NULL,
    "memo" TEXT,
    "txHash" TEXT,
    "userId" TEXT,
    "entityId" TEXT,
    "outcomeId" TEXT,
    "stakeId" TEXT,
    "donationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoteSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_providerId_key" ON "User"("providerId");
CREATE UNIQUE INDEX "User_zkPassportNullifier_key" ON "User"("zkPassportNullifier");
CREATE UNIQUE INDEX "Entity_slug_key" ON "Entity"("slug");
CREATE INDEX "EntityLink_entityId_idx" ON "EntityLink"("entityId");
CREATE INDEX "Outcome_entityId_idx" ON "Outcome"("entityId");
CREATE INDEX "Outcome_status_idx" ON "Outcome"("status");
CREATE UNIQUE INDEX "Stake_txHash_key" ON "Stake"("txHash");
CREATE INDEX "Stake_outcomeId_userId_idx" ON "Stake"("outcomeId", "userId");
CREATE INDEX "Stake_status_deadlineAt_idx" ON "Stake"("status", "deadlineAt");
CREATE UNIQUE INDEX "Donation_txHash_key" ON "Donation"("txHash");
CREATE INDEX "Donation_entityId_idx" ON "Donation"("entityId");
CREATE INDEX "Donation_userId_idx" ON "Donation"("userId");
CREATE INDEX "ResolutionDecision_stakeId_idx" ON "ResolutionDecision"("stakeId");
CREATE INDEX "Deliverable_outcomeId_idx" ON "Deliverable"("outcomeId");
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");
CREATE INDEX "LedgerEntry_type_idx" ON "LedgerEntry"("type");
CREATE INDEX "LedgerEntry_outcomeId_idx" ON "LedgerEntry"("outcomeId");
CREATE INDEX "LedgerEntry_entityId_idx" ON "LedgerEntry"("entityId");
CREATE INDEX "VoteSession_userId_status_idx" ON "VoteSession"("userId", "status");
CREATE INDEX "VoteSession_expiresAt_idx" ON "VoteSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "Entity" ADD CONSTRAINT "Entity_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EntityLink" ADD CONSTRAINT "EntityLink_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Stake" ADD CONSTRAINT "Stake_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Stake" ADD CONSTRAINT "Stake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ResolutionDecision" ADD CONSTRAINT "ResolutionDecision_stakeId_fkey" FOREIGN KEY ("stakeId") REFERENCES "Stake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResolutionDecision" ADD CONSTRAINT "ResolutionDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_outcomeId_fkey" FOREIGN KEY ("outcomeId") REFERENCES "Outcome"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_stakeId_fkey" FOREIGN KEY ("stakeId") REFERENCES "Stake"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoteSession" ADD CONSTRAINT "VoteSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
