import { beforeEach, describe, expect, it, mock, test } from 'bun:test';
import type { Octokit } from 'octokit';
import { GitHubService } from '../../../src/services/GitHubService';
import type { RepoBranch } from '../../../src/types/git';
import type { PullRequest } from '../../../src/types/github';
import { testLogger } from '../../helpers/mockConfig';

// Mock Octokit
const mockPullsList = mock();
const mockGraphql = mock();

const mockOctokit = {
    rest: {
        pulls: {
            list: mockPullsList,
        },
    },
    graphql: mockGraphql,
} as unknown as Octokit;

describe('GitHubService', () => {
    let gitHubService: GitHubService;

    beforeEach(() => {
        gitHubService = new GitHubService({ logger: testLogger, octokit: mockOctokit });

        // Clear all mocks
        mockPullsList.mockClear();
        mockGraphql.mockClear();
    });

    describe('getPullRequestForBranch', () => {
        const repoBranch: RepoBranch = {
            owner: 'testowner',
            repoName: 'testrepo',
            branch: 'feature-branch',
        };

        test('should return pull request when found', async () => {
            const mockPullRequest = {
                number: 123,
                title: 'Test PR',
                head: { ref: 'feature-branch' },
                base: { ref: 'main' },
                html_url: 'https://github.com/testowner/testrepo/pull/123',
            };

            mockPullsList.mockResolvedValueOnce({
                data: [mockPullRequest],
            });

            const result = await gitHubService.getPullRequestForBranch(repoBranch);

            expect(mockPullsList).toHaveBeenCalledWith({
                owner: 'testowner',
                repo: 'testrepo',
                head: 'testowner:feature-branch',
                state: 'open',
            });

            expect(result).toEqual({
                number: 123,
                title: 'Test PR',
                headRefName: 'feature-branch',
                baseRefName: 'main',
                url: 'https://github.com/testowner/testrepo/pull/123',
            });
        });

        it('should throw error when no PR found', async () => {
            mockPullsList.mockResolvedValueOnce({
                data: [],
            });

            expect(gitHubService.getPullRequestForBranch(repoBranch)).rejects.toThrow(
                'Can not parse No PR found using'
            );
        });

        test('should propagate GitHub API errors', async () => {
            const apiError = new Error('GitHub API Error');
            mockPullsList.mockRejectedValueOnce(apiError);

            expect(gitHubService.getPullRequestForBranch(repoBranch)).rejects.toThrow(
                'Can not parse Failed to get pull request for branch using'
            );
        });

        test('should handle multiple PRs and return the first one', async () => {
            const mockPullRequests = [
                {
                    number: 123,
                    title: 'First PR',
                    head: { ref: 'feature-branch' },
                    base: { ref: 'main' },
                    html_url: 'https://github.com/testowner/testrepo/pull/123',
                },
                {
                    number: 124,
                    title: 'Second PR',
                    head: { ref: 'feature-branch' },
                    base: { ref: 'develop' },
                    html_url: 'https://github.com/testowner/testrepo/pull/124',
                },
            ];

            mockPullsList.mockResolvedValueOnce({
                data: mockPullRequests,
            });

            const result = await gitHubService.getPullRequestForBranch(repoBranch);

            expect(result.number).toBe(123);
            expect(result.title).toBe('First PR');
        });
    });

    describe('getReviewCommentsForPullRequest', () => {
        const mockPullRequest: PullRequest = {
            number: 123,
            title: 'Test PR',
            headRefName: 'feature-branch',
            baseRefName: 'main',
            url: 'https://github.com/testowner/testrepo/pull/123',
        };

        test('should return review comments successfully', async () => {
            const mockGraphQLResponse = {
                repository: {
                    pullRequest: {
                        reviewThreads: {
                            nodes: [
                                {
                                    isResolved: false,
                                    isOutdated: false,
                                    comments: {
                                        nodes: [
                                            {
                                                databaseId: 1,
                                                body: 'This looks good!',
                                                author: { login: 'reviewer1' },
                                                createdAt: '2023-01-01T00:00:00Z',
                                                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r1',
                                                path: 'src/test.ts',
                                                position: 10,
                                                isMinimized: false,
                                            },
                                        ],
                                        pageInfo: {
                                            hasNextPage: false,
                                            endCursor: null,
                                        },
                                    },
                                },
                                {
                                    isResolved: true,
                                    isOutdated: false,
                                    comments: {
                                        nodes: [
                                            {
                                                databaseId: 2,
                                                body: 'Please fix this',
                                                author: { login: 'reviewer2' },
                                                createdAt: '2023-01-02T00:00:00Z',
                                                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r2',
                                                path: 'src/another.ts',
                                                position: 5,
                                                isMinimized: false,
                                            },
                                        ],
                                        pageInfo: {
                                            hasNextPage: false,
                                            endCursor: null,
                                        },
                                    },
                                },
                            ],
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            };

            mockGraphql.mockResolvedValueOnce(mockGraphQLResponse);

            const result = await gitHubService.getReviewCommentsForPullRequest(mockPullRequest);

            expect(mockGraphql).toHaveBeenCalledWith(
                expect.stringContaining('query($owner: String!, $repo: String!, $pr: Int!, $cursor: String)'),
                {
                    owner: 'testowner',
                    repo: 'testrepo',
                    pr: 123,
                    cursor: null,
                }
            );

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                commentId: 1,
                body: 'This looks good!',
                author: { login: 'reviewer1' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r1',
                path: 'src/test.ts',
                position: 10,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            });
            expect(result[1]).toEqual({
                commentId: 2,
                body: 'Please fix this',
                author: { login: 'reviewer2' },
                createdAt: '2023-01-02T00:00:00Z',
                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r2',
                path: 'src/another.ts',
                position: 5,
                isResolved: true,
                isOutdated: false,
                isMinimized: false,
            });
        });

        test('should handle empty review threads', async () => {
            const mockGraphQLResponse = {
                repository: {
                    pullRequest: {
                        reviewThreads: {
                            nodes: [],
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            };

            mockGraphql.mockResolvedValueOnce(mockGraphQLResponse);

            const result = await gitHubService.getReviewCommentsForPullRequest(mockPullRequest);

            expect(result).toHaveLength(0);
        });

        it('should throw error for invalid PR URL', async () => {
            const invalidPullRequest: PullRequest = {
                ...mockPullRequest,
                url: 'invalid-url',
            };

            await expect(gitHubService.getReviewCommentsForPullRequest(invalidPullRequest)).rejects.toThrow(
                'Can not parse Invalid GitHub PR URL using'
            );
        });

        it('should throw error when PR number cannot be parsed', async () => {
            const invalidPullRequest: PullRequest = {
                ...mockPullRequest,
                url: 'https://github.com/testowner/testrepo/pull/',
            };

            await expect(gitHubService.getReviewCommentsForPullRequest(invalidPullRequest)).rejects.toThrow(
                'Can not parse Invalid GitHub PR URL using'
            );
        });

        it('should propagate GraphQL API errors', async () => {
            const apiError = new Error('GraphQL API Error');
            mockGraphql.mockRejectedValueOnce(apiError);

            await expect(gitHubService.getReviewCommentsForPullRequest(mockPullRequest)).rejects.toThrow(
                'Can not parse Failed to get review comments for pull request using'
            );
        });

        test('should handle thread with multiple comments', async () => {
            const mockGraphQLResponse = {
                repository: {
                    pullRequest: {
                        reviewThreads: {
                            nodes: [
                                {
                                    isResolved: false,
                                    isOutdated: true,
                                    comments: {
                                        nodes: [
                                            {
                                                databaseId: 1,
                                                body: 'First comment',
                                                author: { login: 'reviewer1' },
                                                createdAt: '2023-01-01T00:00:00Z',
                                                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r1',
                                                path: 'src/test.ts',
                                                position: 10,
                                                isMinimized: false,
                                            },
                                            {
                                                databaseId: 2,
                                                body: 'Reply comment',
                                                author: { login: 'author' },
                                                createdAt: '2023-01-01T01:00:00Z',
                                                url: 'https://github.com/testowner/testrepo/pull/123#discussion_r2',
                                                path: 'src/test.ts',
                                                position: 10,
                                                isMinimized: false,
                                            },
                                        ],
                                        pageInfo: {
                                            hasNextPage: false,
                                            endCursor: null,
                                        },
                                    },
                                },
                            ],
                            pageInfo: {
                                hasNextPage: false,
                                endCursor: null,
                            },
                        },
                    },
                },
            };

            mockGraphql.mockResolvedValueOnce(mockGraphQLResponse);

            const result = await gitHubService.getReviewCommentsForPullRequest(mockPullRequest);

            expect(result).toHaveLength(2);
            expect(result[0]?.isResolved).toBe(false);
            expect(result[0]?.isOutdated).toBe(true);
            expect(result[1]?.isResolved).toBe(false);
            expect(result[1]?.isOutdated).toBe(true);
        });
    });
});
