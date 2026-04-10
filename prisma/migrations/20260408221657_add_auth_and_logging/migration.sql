-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "BookedClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studioName" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "classDate" TEXT NOT NULL,
    "bookedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attended" TEXT NOT NULL DEFAULT 'pending',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailToken" TEXT NOT NULL,
    CONSTRAINT "BookedClass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManualClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "studioName" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "classDate" TEXT NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ManualClass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BookedClass_emailToken_key" ON "BookedClass"("emailToken");
