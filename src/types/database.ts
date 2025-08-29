// Database-specific types and enums

export enum PullRequestState {
    OPEN = 'open',
    CLOSED = 'closed',
    MERGED = 'merged',
}

export enum AnalysisSessionType {
    PR_ANALYSIS = 'pr_analysis',
    REPO_SCAN = 'repo_scan',
    COMMENT_UPDATE = 'comment_update',
}

export enum AnalysisSessionStatus {
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export enum CommentAgreement {
    TRUE = 'true',
    FALSE = 'false',
    PARTIALLY = 'partially',
}
