import type { Octokit } from 'octokit';
import type { Logger } from 'pino';
import { GitHubServiceError } from '../errors/GitHubServiceError.ts';
import type { RepoBranch } from '../types/git.ts';
import type { Comment, PullRequest, ReviewThreadsResponse } from '../types/github.ts';

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
        if (!prNumberStr) {
            const error = new GitHubServiceError('Could not parse PR number from URL', { pr });
            this.logger.error(error);
            throw error;
        }

        const prNumber = parseInt(prNumberStr, 10);
        this.logger.debug({ owner, repo, prNumber }, 'Parsed PR URL');

        const query = `
      query($owner: String!, $repo: String!, $pr: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $pr) {
            reviewThreads(first: 100) {
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
                }
              }
            }
          }
        }
      }
    `;

        try {
            this.logger.debug({ owner, repo, prNumber }, 'Executing GraphQL query for review threads');

            const result = await this.octokit.graphql<ReviewThreadsResponse>(query, {
                owner,
                repo,
                pr: prNumber,
            });

            const allComments: Comment[] = [];
            const threads = result.repository.pullRequest.reviewThreads.nodes;

            this.logger.debug({ threadCount: threads.length }, 'Processing review threads');

            for (const thread of threads) {
                this.logger.debug(
                    {
                        commentCount: thread.comments.nodes.length,
                        isResolved: thread.isResolved,
                        isOutdated: thread.isOutdated,
                    },
                    'Processing thread'
                );

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
            }

            this.logger.debug({ totalComments: allComments.length }, 'Successfully retrieved review comments');
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
}
