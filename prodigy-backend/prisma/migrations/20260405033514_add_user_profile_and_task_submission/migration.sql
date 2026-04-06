-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "joinedSocials" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "paymentAmount" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "collegeName" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "highestQualification" TEXT,
ADD COLUMN     "passingYear" TEXT;

-- CreateTable
CREATE TABLE "task_submissions" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task1GithubUrl" TEXT,
    "task1LinkedinUrl" TEXT,
    "task2GithubUrl" TEXT,
    "task2LinkedinUrl" TEXT,
    "task3GithubUrl" TEXT,
    "task3LinkedinUrl" TEXT,
    "task4GithubUrl" TEXT,
    "task4LinkedinUrl" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentAmount" INTEGER NOT NULL DEFAULT 12900,
    "paymentId" TEXT,
    "paymentOrderId" TEXT,
    "paidAt" TIMESTAMP(3),
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "eligibleForLor" BOOLEAN NOT NULL DEFAULT false,
    "eligibleForCert" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_submissions_applicationId_key" ON "task_submissions"("applicationId");

-- CreateIndex
CREATE INDEX "task_submissions_applicationId_idx" ON "task_submissions"("applicationId");

-- CreateIndex
CREATE INDEX "task_submissions_userId_idx" ON "task_submissions"("userId");

-- CreateIndex
CREATE INDEX "task_submissions_paymentStatus_idx" ON "task_submissions"("paymentStatus");

-- AddForeignKey
ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
