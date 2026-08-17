import dataSource from './src/database/data-source';

async function run() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  try {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_users" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_dcd0c8a4b10af9c986e510b9ecc" UNIQUE ("email"))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_seo" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "url" varchar NOT NULL, "title" varchar NOT NULL, "canonicalUrl" varchar NOT NULL DEFAULT (''), "description" varchar NOT NULL DEFAULT (''), "keywords" varchar NOT NULL DEFAULT (''), "image" varchar NOT NULL DEFAULT (''), "author" varchar NOT NULL DEFAULT (''), "robots" varchar NOT NULL DEFAULT (''), "viewport" varchar NOT NULL DEFAULT (''), "ogTitle" varchar NOT NULL DEFAULT (''), "ogDescription" varchar NOT NULL DEFAULT (''), "ogImage" varchar NOT NULL DEFAULT (''), "ogType" varchar NOT NULL DEFAULT (''), "ogUrl" varchar NOT NULL DEFAULT (''), "ogSiteName" varchar NOT NULL DEFAULT (''), "ogLocale" varchar NOT NULL DEFAULT (''), "twitterCard" varchar NOT NULL DEFAULT (''), "twitterTitle" varchar NOT NULL DEFAULT (''), "twitterDescription" varchar NOT NULL DEFAULT (''), "twitterImage" varchar NOT NULL DEFAULT (''), "twitterSite" varchar NOT NULL DEFAULT (''), "twitterCreator" varchar NOT NULL DEFAULT (''), "structuredData" text NOT NULL DEFAULT (''), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_media" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "fileName" varchar NOT NULL, "thumbnail" varchar NOT NULL, "alt" varchar NOT NULL, "url" varchar NOT NULL, "thumbnailUrl" varchar NOT NULL, "fileSize" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_blogs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "topic" varchar NOT NULL, "author" varchar NOT NULL, "date" varchar NOT NULL, "readMinutes" varchar NOT NULL, "slug" varchar NOT NULL, "description" varchar NOT NULL, "content" text NOT NULL, "image" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "admin_blog_topics" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
    console.log("Tables created successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

run();
