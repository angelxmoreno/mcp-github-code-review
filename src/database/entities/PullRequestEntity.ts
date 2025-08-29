import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';
import type { PullRequestState } from '../../types/database';
import { AppEntity } from '../core/AppEntity';
import { AnalysisSessionEntity } from './AnalysisSessionEntity';
import { RepositoryEntity } from './RepositoryEntity';
import { ReviewCommentEntity } from './ReviewCommentEntity';

@Entity()
@Index(['repositoryId', 'prNumber'], { unique: true })
@Index(['url'])
@Index(['state', 'lastFetchedAt'])
export class PullRequestEntity extends AppEntity {
    @Column({ type: 'integer', nullable: false })
    repositoryId: number;

    @Column({ type: 'integer', nullable: false })
    prNumber: number;

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'varchar', nullable: false })
    headRefName: string;

    @Column({ type: 'varchar', nullable: false })
    baseRefName: string;

    @Column({ type: 'varchar', nullable: false })
    url: string;

    @Column({ type: 'varchar', nullable: false })
    state: PullRequestState;

    @Column({ type: 'varchar', nullable: true })
    authorLogin: string | null;

    @Column({ type: 'timestamp', nullable: true })
    lastFetchedAt: Date | null;

    @Column({ type: 'integer', default: 0 })
    totalComments: number;

    // Relationships
    @ManyToOne(
        () => RepositoryEntity,
        (repository) => repository.pullRequests,
        {
            nullable: false,
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'repositoryId' })
    repository: Relation<RepositoryEntity>;

    @OneToMany(
        () => ReviewCommentEntity,
        (comment) => comment.pullRequest
    )
    reviewComments: Relation<ReviewCommentEntity[]>;

    @OneToMany(
        () => AnalysisSessionEntity,
        (session) => session.pullRequest
    )
    analysisSessions: Relation<AnalysisSessionEntity[]>;
}
