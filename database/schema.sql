-- Java Lava — MySQL schema
-- Run: npm run db:setup

CREATE DATABASE IF NOT EXISTS javalava
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE javalava;

-- ── Forms & signups ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS merch_notifications (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(254) NOT NULL,
  product_id    VARCHAR(160) NOT NULL,
  variant_id    VARCHAR(120) NULL,
  variant_label VARCHAR(120) NULL,
  product_title VARCHAR(220) NULL,
  size          VARCHAR(30)  NULL,
  quantity      INT          NOT NULL DEFAULT 1,
  price         VARCHAR(40)  NULL,
  source        VARCHAR(80)  NULL,
  user_agent    VARCHAR(500) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX merch_notifications_created_at_idx (created_at DESC),
  INDEX merch_notifications_product_id_idx (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_submissions (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  first_name VARCHAR(80)  NOT NULL,
  last_name  VARCHAR(80)  NOT NULL,
  email      VARCHAR(254) NOT NULL,
  subject    VARCHAR(120) NULL,
  mail_to    VARCHAR(254) NULL,
  message    TEXT         NOT NULL,
  source     VARCHAR(80)  NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX contact_submissions_created_at_idx (created_at DESC),
  INDEX contact_submissions_email_idx (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  email      VARCHAR(254) NOT NULL,
  source     VARCHAR(80)  NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY newsletter_subscribers_email_unique (email),
  INDEX newsletter_subscribers_created_at_idx (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Blog CMS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS blog_categories (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  description TEXT         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY blog_categories_slug_unique (slug),
  INDEX blog_categories_slug_idx (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_tags (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY blog_tags_slug_unique (slug),
  INDEX blog_tags_slug_idx (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  id               CHAR(36)     NOT NULL PRIMARY KEY,
  title            VARCHAR(200) NOT NULL,
  slug             VARCHAR(200) NOT NULL,
  excerpt          VARCHAR(500) NULL,
  content_html     MEDIUMTEXT   NULL,
  featured_image   VARCHAR(500) NULL,
  status           ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  category_id      CHAR(36)     NULL,
  meta_title       VARCHAR(200) NULL,
  meta_description VARCHAR(300) NULL,
  author_name      VARCHAR(120) NOT NULL DEFAULT 'Java Lava',
  read_time_mins   INT          NULL,
  published_at     DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY blog_posts_slug_unique (slug),
  INDEX blog_posts_status_idx (status),
  INDEX blog_posts_published_at_idx (published_at DESC),
  INDEX blog_posts_category_idx (category_id),
  CONSTRAINT blog_posts_category_fk
    FOREIGN KEY (category_id) REFERENCES blog_categories (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id CHAR(36) NOT NULL,
  tag_id  CHAR(36) NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  INDEX blog_post_tags_tag_idx (tag_id),
  CONSTRAINT blog_post_tags_post_fk
    FOREIGN KEY (post_id) REFERENCES blog_posts (id) ON DELETE CASCADE,
  CONSTRAINT blog_post_tags_tag_fk
    FOREIGN KEY (tag_id) REFERENCES blog_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
