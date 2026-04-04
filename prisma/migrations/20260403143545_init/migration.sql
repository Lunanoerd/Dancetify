-- CreateTable
CREATE TABLE "DanceClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studioName" TEXT NOT NULL,
    "studioWebsite" TEXT NOT NULL,
    "bookingUrl" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'All levels',
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT,
    "price" TEXT,
    "notes" TEXT,
    "lastScraped" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
