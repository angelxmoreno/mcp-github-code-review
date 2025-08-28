import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { ParsingError } from '../../../src/errors/ParsingError.ts';
import { GitService } from '../../../src/services/GitService.ts';
import type { RepoBranch } from '../../../src/types/git.ts';
import { testLogger } from '../../helpers/mockConfig.ts';

// Track which call we're on for sequential responses
let callCount = 0;
let mockResponses: string[] = [];

mock.module('../../../src/utils/shell', () => {
    return {
        $: (_strings: TemplateStringsArray) => ({
            text: () => Promise.resolve(mockResponses[callCount++] || 'default'),
        }),
    };
});

describe('GitService', () => {
    let gitService: GitService;

    beforeEach(() => {
        callCount = 0;
        mockResponses = [];

        gitService = new GitService({ logger: testLogger });
    });

    describe('getCurrentRepoAndBranch', () => {
        describe('successful parsing', () => {
            type Dataset = [string, string, string, RepoBranch];
            const dataset: Dataset[] = [
                [
                    'should parse HTTPS GitHub URL correctly',
                    'main',
                    'https://github.com/owner/repo.git',
                    {
                        owner: 'owner',
                        repoName: 'repo',
                        branch: 'main',
                    },
                ],
                [
                    'should parse SSH GitHub URL correctly',
                    'feature-branch',
                    'git@github.com:owner/repo.git',
                    {
                        owner: 'owner',
                        repoName: 'repo',
                        branch: 'feature-branch',
                    },
                ],
                [
                    'should parse GitHub URL without .git suffix',
                    'develop',
                    'https://github.com/owner/repo',
                    {
                        owner: 'owner',
                        repoName: 'repo',
                        branch: 'develop',
                    },
                ],
                [
                    'should handle branch names with special characters',
                    'feature/add-new-feature',
                    'git@github.com:owner/repo.git',
                    {
                        owner: 'owner',
                        repoName: 'repo',
                        branch: 'feature/add-new-feature',
                    },
                ],
            ];
            it.each(dataset)('%s', async (_, branch, url, expected) => {
                // Set up mock responses in order: branch, then remote URL
                mockResponses = [branch, url];

                const result = await gitService.getCurrentRepoAndBranch();

                expect(result).toEqual(expected);
            });
        });
        describe('error handling', () => {
            type Dataset = [string, string, string, string];
            const dataset: Dataset[] = [
                ['for invalid remote URL', 'main', 'invalid-url', 'remote URL'],
                ['for empty owner or repoName', 'feat-a', 'https://github.com/owner/.git', 'remote URL'],
                [
                    'when repo cannot be split into owner/repoName',
                    'feat-b',
                    'https://github.com/singlename.git',
                    'remote URL',
                ],
            ];
            it.each(dataset)('should throw a ParsingError %s', async (_, branch, remoteUrl, errorMsg) => {
                mockResponses = [branch, remoteUrl];

                const error = new ParsingError(errorMsg, {
                    remoteUrl,
                    branch,
                    match: null,
                });
                expect(() => gitService.getCurrentRepoAndBranch()).toThrow(error);
            });
        });
    });
});
