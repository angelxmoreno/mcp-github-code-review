import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';
import type { AnalysisSessionStatus, AnalysisSessionType } from '../../types/database';
import { AppEntity } from '../core/AppEntity';
import { PullRequestEntity } from './PullRequestEntity';
import { RepositoryEntity } from './RepositoryEntity';

@Entity()
@Index(['repository', 'sessionType', 'startedAt'])
@Index(['status', 'startedAt'])
export class AnalysisSessionEntity extends AppEntity {
    @Column({ type: 'varchar', nullable: false })
    sessionType: AnalysisSessionType;

    @Column({ type: 'datetime', nullable: false })
    startedAt: Date;

    @Column({ type: 'datetime', nullable: true })
    completedAt: Date | null;

    @Column({ type: 'varchar', nullable: false })
    status: AnalysisSessionStatus;

    @Column({ type: 'integer', default: 0 })
    commentsProcessed: number;

    @Column({ type: 'integer', default: 0 })
    commentsParsed: number;

    @Column({ type: 'text', nullable: true })
    errorMessage: string | null;

    @Column({ type: 'json', nullable: true })
    metadata: Record<string, unknown> | null;

    // Relationships
    @ManyToOne(
        () => RepositoryEntity,
        (repository) => repository.analysisSessions,
        {
            nullable: false,
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'repositoryId' })
    repository: Relation<RepositoryEntity>;

    @ManyToOne(
        () => PullRequestEntity,
        (pullRequest) => pullRequest.analysisSessions,
        {
            nullable: true,
            onDelete: 'CASCADE',
        }
    )
    @JoinColumn({ name: 'pullRequestId' })
    pullRequest: Relation<PullRequestEntity> | null;
}
