import type { Logger } from 'pino';
import { ParsingError } from '../errors/ParsingError';
import type { Comment } from '../types/github';
import type { CodeRabbitComment } from '../types/parser';

export type ParserServiceOptions = {
    logger: Logger;
};

// CodeRabbit parsing patterns
const CODERABBIT_PATTERNS = {
    TYPE: /^_((?:⚠️|💡|❗|💬|🛠️).+?)_/m,
    SUMMARY: /\*\*(.+?)\*\*/,
    DIFF: /```diff\n([\s\S]+?)```/,
    SUGGESTED_CODE: /```suggestion\n([\s\S]+?)```/,
    HEADING: /^###\s+(.+)$/m,
    INTERNAL_ID: /<!-- fingerprinting:([a-z:]+) -->/,
    TOOLS: /<summary>🪛 ([^<]+)<\/summary>/g,
    AI_PROMPT: /<summary>🤖 Prompt for AI Agents<\/summary>[\s\S]*?```\n([\s\S]+?)```/,
    COMMITTABLE: /📝 Committable suggestion\s*```[\s\S]+?```/,
} as const;

export class ParserService {
    protected logger: Logger;

    constructor({ logger }: ParserServiceOptions) {
        this.logger = logger.child({ module: 'ParserService' });
    }

    parseCommentCodeRabbit(comment: Comment): CodeRabbitComment {
        if (!comment || !comment.body) {
            this.logger.warn({ commentId: comment?.commentId }, 'Invalid comment provided for parsing');
            throw new ParsingError('Comment or comment body is required for parsing', {
                commentId: comment?.commentId,
                hasComment: !!comment,
                hasBody: !!comment?.body,
            });
        }

        this.logger.debug(
            {
                commentId: comment.commentId,
                author: comment.author.login,
                path: comment.path,
                bodyLength: comment.body.length,
            },
            'Starting CodeRabbit comment parsing'
        );

        try {
            const parsedFields = {
                type: this.parseType(comment.body),
                heading: this.parseHeading(comment.body),
                summary: this.parseSummary(comment.body),
                diff: this.parseDiff(comment.body),
                suggestedCode: this.parseSuggestedCode(comment.body),
                committableSuggestion: this.parseCommittableSuggestion(comment.body),
                aiPrompt: this.parseAiPrompt(comment.body),
                tools: this.parseTools(comment.body),
                internalId: this.parseInternalId(comment.body),
            };

            this.logger.info(
                {
                    commentId: comment.commentId,
                    hasType: !!parsedFields.type,
                    hasHeading: !!parsedFields.heading,
                    hasSummary: !!parsedFields.summary,
                    hasDiff: !!parsedFields.diff,
                    hasSuggestedCode: !!parsedFields.suggestedCode,
                    hasCommittableSuggestion: !!parsedFields.committableSuggestion,
                    hasAiPrompt: !!parsedFields.aiPrompt,
                    toolsCount: parsedFields.tools.length,
                    hasInternalId: !!parsedFields.internalId,
                },
                'Successfully parsed CodeRabbit comment'
            );

            return {
                ...comment,
                bot: 'coderabbitai',
                ...parsedFields,
                explanation: undefined, // could implement later by extracting body after summary
            };
        } catch (error) {
            this.logger.error(
                {
                    error,
                    commentId: comment.commentId,
                    bodyPreview: comment.body.slice(0, 200) + (comment.body.length > 200 ? '...' : ''),
                },
                'Failed to parse CodeRabbit comment'
            );
            throw error;
        }
    }

    protected parseType(body: string): string | undefined {
        this.logger.debug('Parsing type field');
        const match = body.match(CODERABBIT_PATTERNS.TYPE);
        const result = match?.[1]?.trim().replace(/^(?:⚠️|💡|❗|💬|🛠️)\s*/, '');
        this.logger.debug({ match: !!match, result }, 'Type parsing result');
        return result;
    }

    protected parseHeading(body: string): string | undefined {
        this.logger.debug('Parsing heading field');
        const match = body.match(CODERABBIT_PATTERNS.HEADING);
        const result = match?.[1]?.trim();
        this.logger.debug({ match: !!match, result }, 'Heading parsing result');
        return result;
    }

    protected parseSummary(body: string): string | undefined {
        this.logger.debug('Parsing summary field');
        const match = body.match(CODERABBIT_PATTERNS.SUMMARY);
        const result = match?.[1]?.trim();
        this.logger.debug({ match: !!match, result }, 'Summary parsing result');
        return result;
    }

    protected parseDiff(body: string): string | undefined {
        this.logger.debug('Parsing diff field');
        const match = body.match(CODERABBIT_PATTERNS.DIFF);
        const result = match?.[1]?.trim();
        this.logger.debug({ match: !!match, hasContent: !!result }, 'Diff parsing result');
        return result;
    }

    protected parseSuggestedCode(body: string): string | undefined {
        this.logger.debug('Parsing suggested code field');
        const match = body.match(CODERABBIT_PATTERNS.SUGGESTED_CODE);
        const result = match?.[1]?.trim();
        this.logger.debug({ match: !!match, hasContent: !!result }, 'Suggested code parsing result');
        return result;
    }

    protected parseCommittableSuggestion(body: string): string | undefined {
        this.logger.debug('Parsing committable suggestion field');
        const match = body.match(CODERABBIT_PATTERNS.COMMITTABLE);
        const result = match?.[0]?.replace(/📝 Committable suggestion\s*```[\s\S]*?\n|```$/g, '')?.trim();
        this.logger.debug({ match: !!match, hasContent: !!result }, 'Committable suggestion parsing result');
        return result;
    }

    protected parseAiPrompt(body: string): string | undefined {
        this.logger.debug('Parsing AI prompt field');
        const match = body.match(CODERABBIT_PATTERNS.AI_PROMPT);
        const result = match?.[1]?.trim();
        this.logger.debug({ match: !!match, hasContent: !!result }, 'AI prompt parsing result');
        return result;
    }

    protected parseTools(body: string): string[] {
        this.logger.debug('Parsing tools field');
        const matches = Array.from(body.matchAll(CODERABBIT_PATTERNS.TOOLS));
        const tools = matches
            .map((m) => m[1])
            .filter((t): t is string => t !== undefined)
            .map((t) => t.trim());
        this.logger.debug({ matchCount: matches.length, toolsCount: tools.length, tools }, 'Tools parsing result');
        return tools;
    }

    protected parseInternalId(body: string): string | undefined {
        this.logger.debug('Parsing internal ID field');
        const match = body.match(CODERABBIT_PATTERNS.INTERNAL_ID);
        const result = match?.[1];
        this.logger.debug({ match: !!match, result }, 'Internal ID parsing result');
        return result;
    }
}
