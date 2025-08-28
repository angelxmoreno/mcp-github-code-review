import type { Octokit } from 'octokit';
import type { Logger } from 'pino';
import { GitHubServiceError } from '../errors/GitHubServiceError';
import type { RepoBranch } from '../types/git';
import type { Comment, PullRequest, ReviewThreadsResponse } from '../types/github';

type GitHubServiceOptions = {
    logger: Logger;
    octokit: Octokit;
};

export class GitHubService {
    protected logger: Logger;
    protected octokit: Octokit;

    constructor({ logger, octokit }: GitHubServiceOptions) {
        this.logger = logger.child({ module: 'GitHubService' });
        this.octokit = octokit;
    }

    async getPullRequestForBranch({ owner, repoName, branch }: RepoBranch): Promise<PullRequest> {
        this.logger.debug({ owner, repoName, branch }, 'Getting pull request for branch');

        try {
            this.logger.debug(
                { owner, repo: repoName, head: `${owner}:${branch}` },
                'Fetching pull requests from GitHub API'
            );

            const { data: pulls } = await this.octokit.rest.pulls.list({
                owner,
                repo: repoName,
                head: `${owner}:${branch}`,
                state: 'open',
            });

            this.logger.debug({ count: pulls.length }, 'Found pull requests');

            const [pr] = pulls;
            if (!pr) {
                const error = new GitHubServiceError('No PR found', { owner, repoName, branch });
                this.logger.error(error);
                throw error;
            }

            this.logger.debug(
                {
                    prNumber: pr.number,
                    title: pr.title,
                    headRef: pr.head.ref,
                    baseRef: pr.base.ref,
                },
                'Successfully retrieved pull request'
            );

            return {
                number: pr.number,
                title: pr.title,
                headRefName: pr.head.ref,
                baseRefName: pr.base.ref,
                url: pr.html_url,
            };
        } catch (err) {
            if (err instanceof GitHubServiceError) {
                throw err;
            }
            const error = new GitHubServiceError(
                'Failed to get pull request for branch',
                {
                    owner,
                    repoName,
                    branch,
                },
                err
            );
            this.logger.error(error);
            throw error;
        }
    }

    async getReviewCommentsForPullRequest(pr: PullRequest): Promise<Comment[]> {
        this.logger.debug({ prNumber: pr.number, prUrl: pr.url }, 'Getting review comments for pull request');

        const match = pr.url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
        if (!match) {
            const error = new GitHubServiceError('Invalid GitHub PR URL', { pr });
            this.logger.error(error);
            throw error;
        }

        const [, owner, repo, prNumberStr] = match;
        if (!owner || !repo || !prNumberStr) {
            const error = new GitHubServiceError('Could not parse PR number from URL', { pr });
            this.logger.error(error);
            throw error;
        }

        const prNumber = parseInt(prNumberStr, 10);
        this.logger.debug({ owner, repo, prNumber }, 'Parsed PR URL');

        try {
            const allComments: Comment[] = [];
            let threadsCursor: string | null = null;
            let hasNextThreadsPage = true;
            let totalThreadsProcessed = 0;

            this.logger.debug({ owner, repo, prNumber }, 'Starting paginated fetch of review threads');

            // Paginate through all review threads
            while (hasNextThreadsPage) {
                const threadsResult = await this.fetchReviewThreadsPage(owner, repo, prNumber, threadsCursor);
                const threads = threadsResult.repository.pullRequest.reviewThreads;

                totalThreadsProcessed += threads.nodes.length;
                this.logger.debug(
                    {
                        currentPageThreads: threads.nodes.length,
                        totalThreadsProcessed,
                        hasNextPage: threads.pageInfo.hasNextPage,
                    },
                    'Processing review threads page'
                );

                // Process each thread and extract all comments (with their own pagination)
                for (const thread of threads.nodes) {
                    const threadComments = await this.extractCommentsFromThread(thread);
                    allComments.push(...threadComments);
                }

                hasNextThreadsPage = threads.pageInfo.hasNextPage;
                threadsCursor = threads.pageInfo.endCursor ?? null;
            }

            this.logger.debug(
                {
                    totalComments: allComments.length,
                    totalThreadsProcessed,
                },
                'Successfully retrieved all review comments'
            );
            return allComments;
        } catch (err) {
            if (err instanceof GitHubServiceError) {
                throw err;
            }
            const error = new GitHubServiceError(
                'Failed to get review comments for pull request',
                {
                    owner,
                    repo,
                    prNumber,
                },
                err
            );
            this.logger.error(error);
            throw error;
        }
    }

    private async fetchReviewThreadsPage(
        owner: string,
        repo: string,
        prNumber: number,
        cursor: string | null
    ): Promise<ReviewThreadsResponse> {
        const query = `
            query($owner: String!, $repo: String!, $pr: Int!, $cursor: String) {
                repository(owner: $owner, name: $repo) {
                    pullRequest(number: $pr) {
                        reviewThreads(first: 100, after: $cursor) {
                            nodes {
                                isResolved
                                isOutdated
                                comments(first: 100) {
                                    nodes {
                                        databaseId
                                        author { login }
                                        body
                                        createdAt
                                        url
                                        path
                                        position
                                        isMinimized
                                    }
                                    pageInfo {
                                        hasNextPage
                                        endCursor
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                                endCursor
                            }
                        }
                    }
                }
            }
        `;

        return await this.octokit.graphql<ReviewThreadsResponse>(query, {
            owner,
            repo,
            pr: prNumber,
            cursor,
        });
    }

    private async extractCommentsFromThread(
        thread: ReviewThreadsResponse['repository']['pullRequest']['reviewThreads']['nodes'][0]
    ): Promise<Comment[]> {
        const allComments: Comment[] = [];
        let totalCommentsInThread = 0;

        // Add comments from the thread (initially fetched with first 100)
        for (const comment of thread.comments.nodes) {
            allComments.push({
                commentId: comment.databaseId,
                body: comment.body,
                author: comment.author,
                createdAt: comment.createdAt,
                url: comment.url,
                path: comment.path,
                position: comment.position,
                isResolved: thread.isResolved,
                isOutdated: thread.isOutdated,
                isMinimized: comment.isMinimized,
            });
        }
        totalCommentsInThread += thread.comments.nodes.length;

        // If there are more comments in this thread, we would need additional pagination
        // For now, we'll log a warning if we hit the limit
        if (thread.comments.pageInfo.hasNextPage) {
            this.logger.warn(
                {
                    threadResolved: thread.isResolved,
                    threadOutdated: thread.isOutdated,
                    commentsInFirstPage: thread.comments.nodes.length,
                },
                'Thread has more than 100 comments - some comments may be missing (pagination for individual thread comments not implemented)'
            );
        }

        this.logger.debug(
            {
                threadResolved: thread.isResolved,
                threadOutdated: thread.isOutdated,
                totalCommentsInThread,
                hasMoreComments: thread.comments.pageInfo.hasNextPage,
            },
            'Processed comments for thread'
        );

        return allComments;
    }
}
