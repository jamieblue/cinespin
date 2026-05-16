-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "lastLoginDate" TIMESTAMP(3),
ALTER COLUMN "createdDate" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Films" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tmdbId" INTEGER,
    "imdbId" TEXT,
    "overview" TEXT,
    "releaseYear" INTEGER NOT NULL,
    "tmdbRating" DECIMAL(65,30),
    "tmdbVoteCount" TEXT,
    "imdbRating" DECIMAL(65,30),
    "imdbVoteCount" TEXT,
    "metacriticRating" INTEGER,
    "metacriticVoteCount" TEXT,
    "posterPath" TEXT,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Films_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmGenres" (
    "id" SERIAL NOT NULL,
    "filmId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmGenres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lists" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "privacyType" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilmLists" (
    "id" SERIAL NOT NULL,
    "listId" INTEGER NOT NULL,
    "filmId" INTEGER NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "updatedDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmLists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Films_tmdbId_key" ON "Films"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Films_imdbId_key" ON "Films"("imdbId");

-- CreateIndex
CREATE UNIQUE INDEX "FilmGenres_filmId_genreId_key" ON "FilmGenres"("filmId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Lists_slug_key" ON "Lists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FilmLists_listId_filmId_key" ON "FilmLists"("listId", "filmId");

-- AddForeignKey
ALTER TABLE "FilmGenres" ADD CONSTRAINT "FilmGenres_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Films"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmGenres" ADD CONSTRAINT "FilmGenres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lists" ADD CONSTRAINT "Lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmLists" ADD CONSTRAINT "FilmLists_listId_fkey" FOREIGN KEY ("listId") REFERENCES "Lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilmLists" ADD CONSTRAINT "FilmLists_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Films"("id") ON DELETE CASCADE ON UPDATE CASCADE;
