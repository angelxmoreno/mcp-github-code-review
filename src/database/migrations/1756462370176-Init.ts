import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1756462370176 implements MigrationInterface {
    name = 'Init1756462370176';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "repositories" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "owner" varchar NOT NULL,
                "repo_name" varchar NOT NULL,
                "full_name" varchar NOT NULL,
                "default_branch" varchar,
                "last_analyzed_at" datetime,
                "is_active" boolean NOT NULL DEFAULT (1)
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "repositories_is_active_last_analyzed_at" ON "repositories" ("is_active", "last_analyzed_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "repositories_full_name" ON "repositories" ("full_name")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "repositories_owner_repo_name" ON "repositories" ("owner", "repo_name")
        `);
        await queryRunner.query(`
            CREATE TABLE "analysis_sessions" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "session_type" varchar NOT NULL,
                "started_at" datetime NOT NULL,
                "completed_at" datetime,
                "status" varchar NOT NULL,
                "comments_processed" integer NOT NULL DEFAULT (0),
                "comments_parsed" integer NOT NULL DEFAULT (0),
                "error_message" text,
                "metadata" json,
                "repository_id" integer NOT NULL,
                "pull_request_id" integer
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_status_started_at" ON "analysis_sessions" ("status", "started_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_repository_id_session_type_started_at" ON "analysis_sessions" ("repository_id", "session_type", "started_at")
        `);
        await queryRunner.query(`
            CREATE TABLE "review_comments" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "github_comment_id" bigint NOT NULL,
                "author_login" varchar NOT NULL,
                "body" text NOT NULL,
                "file_path" varchar,
                "position" integer,
                "is_resolved" boolean NOT NULL DEFAULT (0),
                "is_outdated" boolean NOT NULL DEFAULT (0),
                "is_minimized" boolean NOT NULL DEFAULT (0),
                "github_url" varchar NOT NULL,
                "github_created_at" datetime NOT NULL,
                "is_bot" boolean NOT NULL DEFAULT (0),
                "bot_name" varchar,
                "parsed_comment" json,
                "agree_with_comment" varchar,
                "reply_message" text,
                "did_reply" boolean NOT NULL DEFAULT (0),
                "changes_done" boolean NOT NULL DEFAULT (0),
                "pull_request_id" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_agree_with_comment" ON "review_comments" ("pull_request_id", "agree_with_comment")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_did_reply_changes_done" ON "review_comments" ("did_reply", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_agree_with_comment_changes_done" ON "review_comments" ("agree_with_comment", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_resolved_is_outdated" ON "review_comments" ("is_resolved", "is_outdated")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_bot_bot_name" ON "review_comments" ("is_bot", "bot_name")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_github_created_at" ON "review_comments" ("pull_request_id", "github_created_at")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "review_comments_github_comment_id" ON "review_comments" ("github_comment_id")
        `);
        await queryRunner.query(`
            CREATE TABLE "pull_requests" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "pr_number" integer NOT NULL,
                "title" varchar NOT NULL,
                "head_ref_name" varchar NOT NULL,
                "base_ref_name" varchar NOT NULL,
                "url" varchar NOT NULL,
                "state" varchar NOT NULL,
                "author_login" varchar,
                "last_fetched_at" datetime,
                "total_comments" integer NOT NULL DEFAULT (0),
                "repository_id" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_state_last_fetched_at" ON "pull_requests" ("state", "last_fetched_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_url" ON "pull_requests" ("url")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "pull_requests_repository_id_pr_number" ON "pull_requests" ("repository_id", "pr_number")
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_status_started_at"
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_repository_id_session_type_started_at"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_analysis_sessions" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "session_type" varchar NOT NULL,
                "started_at" datetime NOT NULL,
                "completed_at" datetime,
                "status" varchar NOT NULL,
                "comments_processed" integer NOT NULL DEFAULT (0),
                "comments_parsed" integer NOT NULL DEFAULT (0),
                "error_message" text,
                "metadata" json,
                "repository_id" integer NOT NULL,
                "pull_request_id" integer,
                CONSTRAINT "analysis_sessions_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "repositories" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
                CONSTRAINT "analysis_sessions_pull_request_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_analysis_sessions"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "session_type",
                    "started_at",
                    "completed_at",
                    "status",
                    "comments_processed",
                    "comments_parsed",
                    "error_message",
                    "metadata",
                    "repository_id",
                    "pull_request_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "session_type",
                "started_at",
                "completed_at",
                "status",
                "comments_processed",
                "comments_parsed",
                "error_message",
                "metadata",
                "repository_id",
                "pull_request_id"
            FROM "analysis_sessions"
        `);
        await queryRunner.query(`
            DROP TABLE "analysis_sessions"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_analysis_sessions"
                RENAME TO "analysis_sessions"
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_status_started_at" ON "analysis_sessions" ("status", "started_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_repository_id_session_type_started_at" ON "analysis_sessions" ("repository_id", "session_type", "started_at")
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_agree_with_comment"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_did_reply_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_agree_with_comment_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_resolved_is_outdated"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_bot_bot_name"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_github_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_github_comment_id"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_review_comments" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "github_comment_id" bigint NOT NULL,
                "author_login" varchar NOT NULL,
                "body" text NOT NULL,
                "file_path" varchar,
                "position" integer,
                "is_resolved" boolean NOT NULL DEFAULT (0),
                "is_outdated" boolean NOT NULL DEFAULT (0),
                "is_minimized" boolean NOT NULL DEFAULT (0),
                "github_url" varchar NOT NULL,
                "github_created_at" datetime NOT NULL,
                "is_bot" boolean NOT NULL DEFAULT (0),
                "bot_name" varchar,
                "parsed_comment" json,
                "agree_with_comment" varchar,
                "reply_message" text,
                "did_reply" boolean NOT NULL DEFAULT (0),
                "changes_done" boolean NOT NULL DEFAULT (0),
                "pull_request_id" integer NOT NULL,
                CONSTRAINT "review_comments_pull_request_id_fk" FOREIGN KEY ("pull_request_id") REFERENCES "pull_requests" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_review_comments"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "github_comment_id",
                    "author_login",
                    "body",
                    "file_path",
                    "position",
                    "is_resolved",
                    "is_outdated",
                    "is_minimized",
                    "github_url",
                    "github_created_at",
                    "is_bot",
                    "bot_name",
                    "parsed_comment",
                    "agree_with_comment",
                    "reply_message",
                    "did_reply",
                    "changes_done",
                    "pull_request_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "github_comment_id",
                "author_login",
                "body",
                "file_path",
                "position",
                "is_resolved",
                "is_outdated",
                "is_minimized",
                "github_url",
                "github_created_at",
                "is_bot",
                "bot_name",
                "parsed_comment",
                "agree_with_comment",
                "reply_message",
                "did_reply",
                "changes_done",
                "pull_request_id"
            FROM "review_comments"
        `);
        await queryRunner.query(`
            DROP TABLE "review_comments"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_review_comments"
                RENAME TO "review_comments"
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_agree_with_comment" ON "review_comments" ("pull_request_id", "agree_with_comment")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_did_reply_changes_done" ON "review_comments" ("did_reply", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_agree_with_comment_changes_done" ON "review_comments" ("agree_with_comment", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_resolved_is_outdated" ON "review_comments" ("is_resolved", "is_outdated")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_bot_bot_name" ON "review_comments" ("is_bot", "bot_name")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_github_created_at" ON "review_comments" ("pull_request_id", "github_created_at")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "review_comments_github_comment_id" ON "review_comments" ("github_comment_id")
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_state_last_fetched_at"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_url"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_repository_id_pr_number"
        `);
        await queryRunner.query(`
            CREATE TABLE "temporary_pull_requests" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "pr_number" integer NOT NULL,
                "title" varchar NOT NULL,
                "head_ref_name" varchar NOT NULL,
                "base_ref_name" varchar NOT NULL,
                "url" varchar NOT NULL,
                "state" varchar NOT NULL,
                "author_login" varchar,
                "last_fetched_at" datetime,
                "total_comments" integer NOT NULL DEFAULT (0),
                "repository_id" integer NOT NULL,
                CONSTRAINT "pull_requests_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "repositories" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `);
        await queryRunner.query(`
            INSERT INTO "temporary_pull_requests"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "pr_number",
                    "title",
                    "head_ref_name",
                    "base_ref_name",
                    "url",
                    "state",
                    "author_login",
                    "last_fetched_at",
                    "total_comments",
                    "repository_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "pr_number",
                "title",
                "head_ref_name",
                "base_ref_name",
                "url",
                "state",
                "author_login",
                "last_fetched_at",
                "total_comments",
                "repository_id"
            FROM "pull_requests"
        `);
        await queryRunner.query(`
            DROP TABLE "pull_requests"
        `);
        await queryRunner.query(`
            ALTER TABLE "temporary_pull_requests"
                RENAME TO "pull_requests"
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_state_last_fetched_at" ON "pull_requests" ("state", "last_fetched_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_url" ON "pull_requests" ("url")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "pull_requests_repository_id_pr_number" ON "pull_requests" ("repository_id", "pr_number")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "pull_requests_repository_id_pr_number"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_url"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_state_last_fetched_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "pull_requests"
                RENAME TO "temporary_pull_requests"
        `);
        await queryRunner.query(`
            CREATE TABLE "pull_requests" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "pr_number" integer NOT NULL,
                "title" varchar NOT NULL,
                "head_ref_name" varchar NOT NULL,
                "base_ref_name" varchar NOT NULL,
                "url" varchar NOT NULL,
                "state" varchar NOT NULL,
                "author_login" varchar,
                "last_fetched_at" datetime,
                "total_comments" integer NOT NULL DEFAULT (0),
                "repository_id" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "pull_requests"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "pr_number",
                    "title",
                    "head_ref_name",
                    "base_ref_name",
                    "url",
                    "state",
                    "author_login",
                    "last_fetched_at",
                    "total_comments",
                    "repository_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "pr_number",
                "title",
                "head_ref_name",
                "base_ref_name",
                "url",
                "state",
                "author_login",
                "last_fetched_at",
                "total_comments",
                "repository_id"
            FROM "temporary_pull_requests"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_pull_requests"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "pull_requests_repository_id_pr_number" ON "pull_requests" ("repository_id", "pr_number")
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_url" ON "pull_requests" ("url")
        `);
        await queryRunner.query(`
            CREATE INDEX "pull_requests_state_last_fetched_at" ON "pull_requests" ("state", "last_fetched_at")
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_github_comment_id"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_github_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_bot_bot_name"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_resolved_is_outdated"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_agree_with_comment_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_did_reply_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_agree_with_comment"
        `);
        await queryRunner.query(`
            ALTER TABLE "review_comments"
                RENAME TO "temporary_review_comments"
        `);
        await queryRunner.query(`
            CREATE TABLE "review_comments" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "github_comment_id" bigint NOT NULL,
                "author_login" varchar NOT NULL,
                "body" text NOT NULL,
                "file_path" varchar,
                "position" integer,
                "is_resolved" boolean NOT NULL DEFAULT (0),
                "is_outdated" boolean NOT NULL DEFAULT (0),
                "is_minimized" boolean NOT NULL DEFAULT (0),
                "github_url" varchar NOT NULL,
                "github_created_at" datetime NOT NULL,
                "is_bot" boolean NOT NULL DEFAULT (0),
                "bot_name" varchar,
                "parsed_comment" json,
                "agree_with_comment" varchar,
                "reply_message" text,
                "did_reply" boolean NOT NULL DEFAULT (0),
                "changes_done" boolean NOT NULL DEFAULT (0),
                "pull_request_id" integer NOT NULL
            )
        `);
        await queryRunner.query(`
            INSERT INTO "review_comments"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "github_comment_id",
                    "author_login",
                    "body",
                    "file_path",
                    "position",
                    "is_resolved",
                    "is_outdated",
                    "is_minimized",
                    "github_url",
                    "github_created_at",
                    "is_bot",
                    "bot_name",
                    "parsed_comment",
                    "agree_with_comment",
                    "reply_message",
                    "did_reply",
                    "changes_done",
                    "pull_request_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "github_comment_id",
                "author_login",
                "body",
                "file_path",
                "position",
                "is_resolved",
                "is_outdated",
                "is_minimized",
                "github_url",
                "github_created_at",
                "is_bot",
                "bot_name",
                "parsed_comment",
                "agree_with_comment",
                "reply_message",
                "did_reply",
                "changes_done",
                "pull_request_id"
            FROM "temporary_review_comments"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_review_comments"
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "review_comments_github_comment_id" ON "review_comments" ("github_comment_id")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_github_created_at" ON "review_comments" ("pull_request_id", "github_created_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_bot_bot_name" ON "review_comments" ("is_bot", "bot_name")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_is_resolved_is_outdated" ON "review_comments" ("is_resolved", "is_outdated")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_agree_with_comment_changes_done" ON "review_comments" ("agree_with_comment", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_did_reply_changes_done" ON "review_comments" ("did_reply", "changes_done")
        `);
        await queryRunner.query(`
            CREATE INDEX "review_comments_pull_request_id_agree_with_comment" ON "review_comments" ("pull_request_id", "agree_with_comment")
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_repository_id_session_type_started_at"
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_status_started_at"
        `);
        await queryRunner.query(`
            ALTER TABLE "analysis_sessions"
                RENAME TO "temporary_analysis_sessions"
        `);
        await queryRunner.query(`
            CREATE TABLE "analysis_sessions" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "created_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "updated_db_at" datetime NOT NULL DEFAULT (datetime('now')),
                "deleted_db_at" datetime,
                "session_type" varchar NOT NULL,
                "started_at" datetime NOT NULL,
                "completed_at" datetime,
                "status" varchar NOT NULL,
                "comments_processed" integer NOT NULL DEFAULT (0),
                "comments_parsed" integer NOT NULL DEFAULT (0),
                "error_message" text,
                "metadata" json,
                "repository_id" integer NOT NULL,
                "pull_request_id" integer
            )
        `);
        await queryRunner.query(`
            INSERT INTO "analysis_sessions"(
                    "id",
                    "created_db_at",
                    "updated_db_at",
                    "deleted_db_at",
                    "session_type",
                    "started_at",
                    "completed_at",
                    "status",
                    "comments_processed",
                    "comments_parsed",
                    "error_message",
                    "metadata",
                    "repository_id",
                    "pull_request_id"
                )
            SELECT "id",
                "created_db_at",
                "updated_db_at",
                "deleted_db_at",
                "session_type",
                "started_at",
                "completed_at",
                "status",
                "comments_processed",
                "comments_parsed",
                "error_message",
                "metadata",
                "repository_id",
                "pull_request_id"
            FROM "temporary_analysis_sessions"
        `);
        await queryRunner.query(`
            DROP TABLE "temporary_analysis_sessions"
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_repository_id_session_type_started_at" ON "analysis_sessions" ("repository_id", "session_type", "started_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "analysis_sessions_status_started_at" ON "analysis_sessions" ("status", "started_at")
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_repository_id_pr_number"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_url"
        `);
        await queryRunner.query(`
            DROP INDEX "pull_requests_state_last_fetched_at"
        `);
        await queryRunner.query(`
            DROP TABLE "pull_requests"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_github_comment_id"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_github_created_at"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_bot_bot_name"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_is_resolved_is_outdated"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_agree_with_comment_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_did_reply_changes_done"
        `);
        await queryRunner.query(`
            DROP INDEX "review_comments_pull_request_id_agree_with_comment"
        `);
        await queryRunner.query(`
            DROP TABLE "review_comments"
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_repository_id_session_type_started_at"
        `);
        await queryRunner.query(`
            DROP INDEX "analysis_sessions_status_started_at"
        `);
        await queryRunner.query(`
            DROP TABLE "analysis_sessions"
        `);
        await queryRunner.query(`
            DROP INDEX "repositories_owner_repo_name"
        `);
        await queryRunner.query(`
            DROP INDEX "repositories_full_name"
        `);
        await queryRunner.query(`
            DROP INDEX "repositories_is_active_last_analyzed_at"
        `);
        await queryRunner.query(`
            DROP TABLE "repositories"
        `);
    }
}
