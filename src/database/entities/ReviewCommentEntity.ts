import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { CommentAgreement } from '../../types/database';
import type { CodeRabbitComment } from '../../types/parser';
import { AppEntity } from '../core/AppEntity';
import { PullRequestEntity } from './PullRequestEntity';

@Entity()
@Index(['githubCommentId'], { unique: true })
@Index(['pullRequestId', 'githubCreatedAt'])
@Index(['isBot', 'botName'])
@Index(['isResolved', 'isOutdated'])
@Index(['agreeWithComment', 'changesDone'])
@Index(['didReply', 'changesDone'])
@Index(['pullRequestId', 'agreeWithComment'])
export class ReviewCommentEntity extends AppEntity {
    @Column({ type: 'integer', nullable: false })
    pullRequestId: number;

    @Column({ type: 'bigint', nullable: false })
    githubCommentId: number;

    @Column({ type: 'varchar', nullable: false })
    authorLogin: string;

    @Column({ type: 'text', nullable: false })
    body: string;

    @Column({ type: 'varchar', nullable: true })
    filePath: string | null;

    @Column({ type: 'integer', nullable: true })
    position: number | null;

    @Column({ type: 'boolean', default: false })
    isResolved: boolean;

    @Column({ type: 'boolean', default: false })
    isOutdated: boolean;

    @Column({ type: 'boolean', default: false })
    isMinimized: boolean;

    @Column({ type: 'varchar', nullable: false })
    githubUrl: string;

    @Column({ type: 'timestamp', nullable: false })
    githubCreatedAt: Date;

    @Column({ type: 'boolean', default: false })
    isBot: boolean;

    @Column({ type: 'varchar', nullable: true })
    botName: string | null;

    @Column({ type: 'json', nullable: true })
    parsedComment: CodeRabbitComment | null;

    // Action tracking fields
    @Column({ type: 'varchar', nullable: true })
    agreeWithComment: CommentAgreement | null;

    @Column({ type: 'text', nullable: true })
    replyMessage: string | null;

    @Column({ type: 'boolean', default: false })
    didReply: boolean;

    @Column({ type: 'boolean', default: false })
    changesDone: boolean;

    // Relationships
    @ManyToOne(
        () => PullRequestEntity,
        (pullRequest) => pullRequest.reviewComments,
        {
            nullable: false,
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'pullRequestId' })
    pullRequest: Relation<PullRequestEntity>;
}
