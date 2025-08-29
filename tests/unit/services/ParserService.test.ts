import { beforeEach, describe, expect, test } from 'bun:test';
import { ParsingError } from '../../../src/errors/ParsingError';
import { ParserService } from '../../../src/services/ParserService';
import type { Comment } from '../../../src/types/github';
import type { CodeRabbitComment } from '../../../src/types/parser';
import { testLogger } from '../../helpers/mockConfig';

// Test subclass to expose private methods for testing
class TestableParserService extends ParserService {
    public testParseType(body: string): string | undefined {
        return this.parseType(body);
    }

    public testParseHeading(body: string): string | undefined {
        return this.parseHeading(body);
    }

    public testParseSummary(body: string): string | undefined {
        return this.parseSummary(body);
    }

    public testParseDiff(body: string): string | undefined {
        return this.parseDiff(body);
    }

    public testParseSuggestedCode(body: string): string | undefined {
        return this.parseSuggestedCode(body);
    }

    public testParseCommittableSuggestion(body: string): string | undefined {
        return this.parseCommittableSuggestion(body);
    }

    public testParseAiPrompt(body: string): string | undefined {
        return this.parseAiPrompt(body);
    }

    public testParseTools(body: string): string[] {
        return this.parseTools(body);
    }

    public testParseInternalId(body: string): string | undefined {
        return this.parseInternalId(body);
    }
}

describe('ParserService', () => {
    let parserService: ParserService;
    let testableParser: TestableParserService;

    beforeEach(() => {
        parserService = new ParserService({ logger: testLogger });
        testableParser = new TestableParserService({ logger: testLogger });
    });

    describe('parseCommentCodeRabbit', () => {
        test('should throw ParsingError when comment is null', () => {
            expect(() => parserService.parseCommentCodeRabbit(null as unknown as Comment)).toThrow();
            expect(() => parserService.parseCommentCodeRabbit(null as unknown as Comment)).toThrow(
                'Comment or comment body is required for parsing'
            );
        });

        test('should throw ParsingError when comment body is empty', () => {
            const comment: Comment = {
                commentId: 1,
                body: '',
                author: { login: 'test' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'test.ts',
                position: 1,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            expect(() => parserService.parseCommentCodeRabbit(comment)).toThrow(ParsingError);
        });

        test('should parse CodeRabbit comment with all fields', () => {
            const comment: Comment = {
                commentId: 1,
                body: `_⚠️ Potential issue_

**This is a potential security vulnerability**

### Code Analysis

Some explanation here.

\`\`\`diff
- old code
+ new code
\`\`\`

\`\`\`suggestion
suggested code here
\`\`\`

📝 Committable suggestion
\`\`\`typescript
const fixed = 'code';
\`\`\`

<summary>🪛 ESLint</summary>
<summary>🪛 TypeScript</summary>

<summary>🤖 Prompt for AI Agents</summary>

\`\`\`
Review this code for security issues
\`\`\`

<!-- fingerprinting:security:vulnerability -->`,
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'src/test.ts',
                position: 10,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            const result: CodeRabbitComment = parserService.parseCommentCodeRabbit(comment);

            expect(result.bot).toBe('coderabbitai');
            expect(result.type).toBe('Potential issue');
            expect(result.summary).toBe('This is a potential security vulnerability');
            expect(result.heading).toBe('Code Analysis');
            expect(result.diff).toBe('- old code\n+ new code');
            expect(result.suggestedCode).toBe('suggested code here');
            expect(result.committableSuggestion).toBe("const fixed = 'code';");
            expect(result.aiPrompt).toBe('Review this code for security issues');
            expect(result.tools).toEqual(['ESLint', 'TypeScript']);
            expect(result.internalId).toBe('security:vulnerability');
            expect(result.explanation).toBeUndefined();
        });

        test('should parse minimal CodeRabbit comment', () => {
            const comment: Comment = {
                commentId: 2,
                body: 'Just a simple comment without any special formatting.',
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r2',
                path: 'src/test.ts',
                position: 5,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            const result: CodeRabbitComment = parserService.parseCommentCodeRabbit(comment);

            expect(result.bot).toBe('coderabbitai');
            expect(result.type).toBeUndefined();
            expect(result.summary).toBeUndefined();
            expect(result.heading).toBeUndefined();
            expect(result.diff).toBeUndefined();
            expect(result.suggestedCode).toBeUndefined();
            expect(result.committableSuggestion).toBeUndefined();
            expect(result.aiPrompt).toBeUndefined();
            expect(result.tools).toEqual([]);
            expect(result.internalId).toBeUndefined();
            expect(result.explanation).toBeUndefined();
        });

        test('should handle different emoji types', () => {
            const testCases = [
                { emoji: '⚠️', expected: 'Potential issue' },
                { emoji: '💡', expected: 'Suggestion' },
                { emoji: '❗', expected: 'Critical issue' },
                { emoji: '💬', expected: 'General comment' },
                { emoji: '🛠️', expected: 'Tool enhancement' },
            ];

            testCases.forEach(({ emoji, expected }) => {
                const comment: Comment = {
                    commentId: 1,
                    body: `_${emoji} ${expected}_`,
                    author: { login: 'coderabbitai[bot]' },
                    createdAt: '2023-01-01T00:00:00Z',
                    url: 'https://github.com/test/test/pull/1#discussion_r1',
                    path: 'src/test.ts',
                    position: 1,
                    isResolved: false,
                    isOutdated: false,
                    isMinimized: false,
                };

                const result = parserService.parseCommentCodeRabbit(comment);
                expect(result.type).toBe(expected);
            });
        });

        test('should handle multiple tools', () => {
            const comment: Comment = {
                commentId: 1,
                body: `<summary>🪛 ESLint</summary>
<summary>🪛 TypeScript</summary>
<summary>🪛 Prettier</summary>`,
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'src/test.ts',
                position: 1,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            const result = parserService.parseCommentCodeRabbit(comment);
            expect(result.tools).toEqual(['ESLint', 'TypeScript', 'Prettier']);
        });

        test('should handle complex committable suggestion', () => {
            const comment: Comment = {
                commentId: 1,
                body: `📝 Committable suggestion

\`\`\`typescript
function complexFunction() {
    const result = doSomething();
    return result.map(item => item.value);
}
\`\`\``,
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'src/test.ts',
                position: 1,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            const result = parserService.parseCommentCodeRabbit(comment);
            expect(result.committableSuggestion).toContain('function complexFunction()');
            expect(result.committableSuggestion).toContain('return result.map');
        });
    });

    describe('Individual parsing methods', () => {
        describe('parseType', () => {
            test('should parse type with different emojis', () => {
                expect(testableParser.testParseType('_⚠️ Potential issue_')).toBe('Potential issue');
                expect(testableParser.testParseType('_💡 Suggestion_')).toBe('Suggestion');
                expect(testableParser.testParseType('_❗ Critical_')).toBe('Critical');
                expect(testableParser.testParseType('_💬 Comment_')).toBe('Comment');
                expect(testableParser.testParseType('_🛠️ Tool_')).toBe('Tool');
            });

            test('should return undefined when no type pattern found', () => {
                expect(testableParser.testParseType('No type here')).toBeUndefined();
                expect(testableParser.testParseType('**Bold text**')).toBeUndefined();
            });

            test('should handle type with extra spaces', () => {
                expect(testableParser.testParseType('_⚠️   Potential issue   _')).toBe('Potential issue');
            });
        });

        describe('parseHeading', () => {
            test('should parse markdown heading', () => {
                expect(testableParser.testParseHeading('### Code Review')).toBe('Code Review');
                expect(testableParser.testParseHeading('### Security Analysis')).toBe('Security Analysis');
            });

            test('should return undefined when no heading found', () => {
                expect(testableParser.testParseHeading('No heading here')).toBeUndefined();
                expect(testableParser.testParseHeading('## Wrong level')).toBeUndefined();
            });

            test('should handle heading with extra spaces', () => {
                expect(testableParser.testParseHeading('###   Spaced Heading   ')).toBe('Spaced Heading');
            });
        });

        describe('parseSummary', () => {
            test('should parse bold text as summary', () => {
                expect(testableParser.testParseSummary('**This is a summary**')).toBe('This is a summary');
                expect(testableParser.testParseSummary('Some text **Important summary** more text')).toBe(
                    'Important summary'
                );
            });

            test('should return undefined when no bold text found', () => {
                expect(testableParser.testParseSummary('No bold text here')).toBeUndefined();
                expect(testableParser.testParseSummary('*Italic text*')).toBeUndefined();
            });

            test('should handle first bold text when multiple exist', () => {
                expect(testableParser.testParseSummary('**First** and **Second**')).toBe('First');
            });
        });

        describe('parseDiff', () => {
            test('should parse diff block', () => {
                const diffText = '```diff\n- old line\n+ new line\n```';
                expect(testableParser.testParseDiff(diffText)).toBe('- old line\n+ new line');
            });

            test('should return undefined when no diff block found', () => {
                expect(testableParser.testParseDiff('No diff here')).toBeUndefined();
                expect(testableParser.testParseDiff('```javascript\ncode\n```')).toBeUndefined();
            });

            test('should handle complex diff', () => {
                const diffText = `\`\`\`diff
- function oldFunction() {
-     return null;
- }
+ function newFunction() {
+     return 'value';
+ }
\`\`\``;
                const result = testableParser.testParseDiff(diffText);
                expect(result).toContain('- function oldFunction()');
                expect(result).toContain('+ function newFunction()');
            });
        });

        describe('parseSuggestedCode', () => {
            test('should parse suggestion block', () => {
                const suggestion = '```suggestion\nconst fixed = true;\n```';
                expect(testableParser.testParseSuggestedCode(suggestion)).toBe('const fixed = true;');
            });

            test('should return undefined when no suggestion block found', () => {
                expect(testableParser.testParseSuggestedCode('No suggestion here')).toBeUndefined();
                expect(testableParser.testParseSuggestedCode('```javascript\ncode\n```')).toBeUndefined();
            });
        });

        describe('parseCommittableSuggestion', () => {
            test('should parse committable suggestion', () => {
                const suggestionText = `📝 Committable suggestion

\`\`\`typescript
const result = 'fixed';
\`\`\``;
                const result = testableParser.testParseCommittableSuggestion(suggestionText);
                expect(result).toContain("const result = 'fixed';");
                expect(result).not.toContain('📝 Committable suggestion');
                expect(result).not.toContain('```');
            });

            test('should return undefined when no committable suggestion found', () => {
                expect(testableParser.testParseCommittableSuggestion('No suggestion here')).toBeUndefined();
            });
        });

        describe('parseAiPrompt', () => {
            test('should parse AI prompt', () => {
                const promptText = `<summary>🤖 Prompt for AI Agents</summary>

\`\`\`
Analyze this code for security vulnerabilities
\`\`\``;
                expect(testableParser.testParseAiPrompt(promptText)).toBe(
                    'Analyze this code for security vulnerabilities'
                );
            });

            test('should return undefined when no AI prompt found', () => {
                expect(testableParser.testParseAiPrompt('No AI prompt here')).toBeUndefined();
            });
        });

        describe('parseTools', () => {
            test('should parse single tool', () => {
                expect(testableParser.testParseTools('<summary>🪛 ESLint</summary>')).toEqual(['ESLint']);
            });

            test('should parse multiple tools', () => {
                const toolsText = `<summary>🪛 ESLint</summary>
<summary>🪛 TypeScript</summary>
<summary>🪛 Prettier</summary>`;
                expect(testableParser.testParseTools(toolsText)).toEqual(['ESLint', 'TypeScript', 'Prettier']);
            });

            test('should return empty array when no tools found', () => {
                expect(testableParser.testParseTools('No tools here')).toEqual([]);
            });

            test('should handle tools with extra spaces', () => {
                expect(testableParser.testParseTools('<summary>🪛   ESLint   </summary>')).toEqual(['ESLint']);
            });
        });

        describe('parseInternalId', () => {
            test('should parse fingerprinting ID', () => {
                expect(testableParser.testParseInternalId('<!-- fingerprinting:security:vulnerability -->')).toBe(
                    'security:vulnerability'
                );
                expect(testableParser.testParseInternalId('<!-- fingerprinting:performance:optimization -->')).toBe(
                    'performance:optimization'
                );
            });

            test('should return undefined when no internal ID found', () => {
                expect(testableParser.testParseInternalId('No fingerprinting here')).toBeUndefined();
                expect(testableParser.testParseInternalId('<!-- regular comment -->')).toBeUndefined();
            });
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle malformed markdown gracefully', () => {
            const comment: Comment = {
                commentId: 1,
                body: `_⚠️ Unclosed italic
**Unclosed bold
### Heading without proper spacing
\`\`\`diff
Unclosed code block`,
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'src/test.ts',
                position: 1,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            expect(() => parserService.parseCommentCodeRabbit(comment)).not.toThrow();
            const result = parserService.parseCommentCodeRabbit(comment);
            expect(result.bot).toBe('coderabbitai');
        });

        test('should handle empty patterns gracefully', () => {
            expect(testableParser.testParseType('')).toBeUndefined();
            expect(testableParser.testParseHeading('')).toBeUndefined();
            expect(testableParser.testParseSummary('')).toBeUndefined();
            expect(testableParser.testParseDiff('')).toBeUndefined();
            expect(testableParser.testParseTools('')).toEqual([]);
        });

        test('should handle very long comment bodies', () => {
            const longComment: Comment = {
                commentId: 1,
                body: `${'a'.repeat(10000)}**Summary**${'b'.repeat(10000)}`,
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r1',
                path: 'src/test.ts',
                position: 1,
                isResolved: false,
                isOutdated: false,
                isMinimized: false,
            };

            const result = parserService.parseCommentCodeRabbit(longComment);
            expect(result.summary).toBe('Summary');
        });

        test('should preserve original comment properties', () => {
            const comment: Comment = {
                commentId: 123,
                body: '**Test summary**',
                author: { login: 'coderabbitai[bot]' },
                createdAt: '2023-01-01T00:00:00Z',
                url: 'https://github.com/test/test/pull/1#discussion_r123',
                path: 'src/test.ts',
                position: 15,
                isResolved: true,
                isOutdated: true,
                isMinimized: false,
            };

            const result = parserService.parseCommentCodeRabbit(comment);

            expect(result.commentId).toBe(123);
            expect(result.author.login).toBe('coderabbitai[bot]');
            expect(result.createdAt).toBe('2023-01-01T00:00:00Z');
            expect(result.url).toBe('https://github.com/test/test/pull/1#discussion_r123');
            expect(result.path).toBe('src/test.ts');
            expect(result.position).toBe(15);
            expect(result.isResolved).toBe(true);
            expect(result.isOutdated).toBe(true);
            expect(result.isMinimized).toBe(false);
        });
    });
});
