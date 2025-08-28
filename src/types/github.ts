/**
 * Represents a GitHub pull request
 */
export type PullRequest = {
    number: number;
    title: string;
    headRefName: string;
    baseRefName: string;
    url: string;
};

/**
 * Represents a GitHub pull request review comment
 */
export type Comment = {
    commentId: number;
    body: string;
    author: {
        login: string;
    };
    createdAt: string;
    url: string;
    path: string;
    position: number | null;
    isResolved: boolean;
    isOutdated: boolean;
    isMinimized: boolean;
};

/**
 * GraphQL response type for PR review threads query
 */
export type ReviewThreadsResponse = {
    repository: {
        pullRequest: {
            reviewThreads: {
                nodes: Array<{
                    isResolved: boolean;
                    isOutdated: boolean;
                    comments: {
                        nodes: Array<{
                            databaseId: number;
                            body: string;
                            author: {
                                login: string;
                            };
                            createdAt: string;
                            url: string;
                            path: string;
                            position: number | null;
                            isMinimized: boolean;
                        }>;
                    };
                }>;
            };
        };
    };
};
