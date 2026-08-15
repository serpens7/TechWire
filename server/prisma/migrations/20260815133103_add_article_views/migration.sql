-- CreateTable
CREATE TABLE "article_views" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "article_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_views_articleId_viewedAt_idx" ON "article_views"("articleId", "viewedAt");

-- CreateIndex
CREATE INDEX "article_views_viewedAt_idx" ON "article_views"("viewedAt");

-- AddForeignKey
ALTER TABLE "article_views" ADD CONSTRAINT "article_views_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
