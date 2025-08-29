import type { Comment } from './github';

// Bot types that the parser can handle
export type SupportedBotType = 'coderabbitai';

// CodeRabbit comment types based on emoji prefixes
export type CodeRabbitCommentType =
    | 'Potential issue'
    | 'Verification agent'
    | 'Critical issue'
    | 'General comment'
    | 'Tool enhancement'
    | string; // Allow other types for future compatibility

// Base interface for parsed bot comments
export interface ParsedBotComment extends Comment {
    bot: SupportedBotType;
}

// CodeRabbit specific comment structure
export interface CodeRabbitComment extends ParsedBotComment {
    bot: 'coderabbitai';
    heading: string | undefined;
    suggestedCode: string | undefined;
    type?: CodeRabbitCommentType;
    summary?: string; // short description extracted from **bold** text
    explanation?: string; // longer explanation (not currently parsed)
    diff?: string; // content from ```diff blocks
    committableSuggestion?: string; // content from 📝 Committable suggestion blocks
    aiPrompt?: string; // content from AI agent prompt sections
    tools: string[]; // tools mentioned in 🪛 sections
    internalId?: string; // fingerprinting ID for tracking
}

// Type guard to check if a comment is from CodeRabbit
export function isCodeRabbitComment(comment: Comment | ParsedBotComment): comment is CodeRabbitComment {
    return 'bot' in comment && comment.bot === 'coderabbitai';
}
