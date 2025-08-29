# Database Schema Design

## Established Conventions

Based on the existing database infrastructure:

- **Base Entity**: All entities extend `AppEntity` with `id`, `createdDbAt`, `updatedDbAt`, `deletedDbAt`
- **Naming Strategy**: Snake case columns, pluralized table names, stripped "Entity" suffix
- **Soft Deletes**: Using `deletedDbAt` timestamp
- **Database**: SQLite with TypeORM
- **Migrations**: Supported, stored in `typeorm_migrations` table

## Proposed Entities

### 1. RepositoryEntity
**Table**: `repositories`

Represents GitHub repositories being analyzed.

**Fields**:
- `owner` (string, not null) - GitHub repo owner/org name
- `repoName` (string, not null) - GitHub repo name  
- `fullName` (string, not null) - Combined "owner/repoName"
- `defaultBranch` (string, nullable) - Usually "main" or "master"
- `lastAnalyzedAt` (timestamp, nullable) - When we last pulled data
- `isActive` (boolean, default true) - Whether we're still monitoring this repo

**Indexes**:
- Unique on (`owner`, `repoName`)
- Index on `fullName`
- Index on `isActive`, `lastAnalyzedAt`

### 2. PullRequestEntity  
**Table**: `pull_requests`

Represents GitHub pull requests we're analyzing.

**Fields**:
- `repositoryId` (foreign key to repositories) 
- `prNumber` (integer, not null) - GitHub PR number
- `title` (string, not null) - PR title
- `headRefName` (string, not null) - Source branch
- `baseRefName` (string, not null) - Target branch  
- `url` (string, not null) - GitHub PR URL
- `state` (enum: 'open', 'closed', 'merged') - PR status
- `authorLogin` (string, nullable) - PR author username
- `lastFetchedAt` (timestamp, nullable) - When we last fetched comments
- `totalComments` (integer, default 0) - Cached count of review comments

**Indexes**:
- Unique on (`repositoryId`, `prNumber`)
- Index on `url`
- Index on (`state`, `lastFetchedAt`)

### 3. ReviewCommentEntity
**Table**: `review_comments` 

Represents individual review comments from GitHub with optional parsed bot data and action tracking.

**Fields**:
- `pullRequestId` (foreign key to pull_requests)
- `githubCommentId` (bigint, not null) - GitHub's databaseId
- `authorLogin` (string, not null) - Comment author username
- `body` (text, not null) - Raw comment markdown content
- `filePath` (string, nullable) - File being commented on
- `position` (integer, nullable) - Line position in diff
- `isResolved` (boolean, default false) - Thread resolution status
- `isOutdated` (boolean, default false) - Whether comment is on old code
- `isMinimized` (boolean, default false) - GitHub minimization status
- `githubUrl` (string, not null) - Direct link to comment
- `githubCreatedAt` (timestamp, not null) - When GitHub created it
- `isBot` (boolean, default false) - Whether author is a bot
- `botName` (string, nullable) - Which bot if isBot=true
- `parsedComment` (json, nullable) - Parsed CodeRabbitComment data or other bot comment structure
- `agreeWithComment` (enum: 'true', 'false', 'partially', nullable) - Your agreement level with the feedback
- `replyMessage` (string, nullable) - Your response/reply to the comment
- `didReply` (boolean, default false) - Whether you've replied to this comment
- `changesDone` (boolean, default false) - Whether you've implemented the suggested changes

**Indexes**:
- Unique on `githubCommentId`
- Index on (`pullRequestId`, `githubCreatedAt`)
- Index on (`isBot`, `botName`)
- Index on (`isResolved`, `isOutdated`)
- Index on (`agreeWithComment`, `changesDone`) - Find comments by agreement and completion status
- Index on (`didReply`, `changesDone`) - Find comments needing replies or changes
- Index on (`pullRequestId`, `agreeWithComment`) - PR-specific agreement filtering

### 4. AnalysisSessionEntity
**Table**: `analysis_sessions`

Tracks when we analyze PRs (for auditing and incremental updates).

**Fields**:
- `repositoryId` (foreign key to repositories)
- `pullRequestId` (foreign key to pull_requests, nullable) - Null for repo-wide analysis
- `sessionType` (enum: 'pr_analysis', 'repo_scan', 'comment_update')
- `startedAt` (timestamp, not null)
- `completedAt` (timestamp, nullable) - Null if still running/failed
- `status` (enum: 'running', 'completed', 'failed')
- `commentsProcessed` (integer, default 0)
- `commentsParsed` (integer, default 0) - How many were bot comments
- `errorMessage` (text, nullable) - If status='failed'
- `metadata` (json, nullable) - Session-specific data

**Indexes**:
- Index on (`repositoryId`, `sessionType`, `startedAt`)
- Index on (`status`, `startedAt`)

## Key Relationships

```
RepositoryEntity (1) ──→ (many) PullRequestEntity
PullRequestEntity (1) ──→ (many) ReviewCommentEntity  
RepositoryEntity (1) ──→ (many) AnalysisSessionEntity
PullRequestEntity (1) ──→ (many) AnalysisSessionEntity
```

**Simplified**: The `parsedComment` JSON field on `ReviewCommentEntity` eliminates the need for a separate `ParsedBotCommentEntity` and foreign key relationship.

## Design Decisions Made

### 1. **Enumeration Management** ✅
Using TypeScript enums with string literals and `@Column({ type: 'varchar' })` for database storage.

### 2. **JSON Column Usage** ✅  
Using SQLite JSON columns for `tools` array and `metadata` objects to maintain flexibility.

### 3. **Bot Support** ✅
Initially supporting only CodeRabbit bot, with structure to add more bot types later.

### 4. **Incremental Sync Strategy** ✅
Always fetch all comments for a PR from scratch (Option A) - simple and reliable, ensures data consistency.

### 5. **Parser Version Handling** ✅
Reparse and overwrite existing parsed data when parser logic improves (Option A) - keeps data current and schema simple.

## Schema Simplifications

Based on these decisions, we can simplify the schema:

- **Remove** `parsingVersion` field from `ParsedBotComment` entity (not needed for Option A)
- **Remove** `rawParsingData` field (not needed for historical tracking)
- **Simplify** timestamp tracking - `lastFetchedAt` is mainly for user visibility, not incremental logic

## Next Steps

The schema is now ready for implementation! All design decisions are made:

✅ TypeScript enums with varchar storage  
✅ JSON columns for flexible data  
✅ CodeRabbit-focused initially  
✅ Full refresh strategy for comments  
✅ Overwrite strategy for parsed data  

Ready to start creating the TypeORM entities?