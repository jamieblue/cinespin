-- CreateTable
CREATE TABLE "Genres" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genres_name_key" ON "Genres"("name");
