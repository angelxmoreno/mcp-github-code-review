import { Column, Entity, Index, OneToMany, type Relation } from 'typeorm';
import { AppEntity } from '../core/AppEntity';
import { AnalysisSessionEntity } from './AnalysisSessionEntity';
import { PullRequestEntity } from './PullRequestEntity';

@Entity()
@Index(['owner', 'repoName'], { unique: true })
@Index(['fullName'])
@Index(['isActive', 'lastAnalyzedAt'])
export class RepositoryEntity extends AppEntity {
    @Column({ type: 'varchar', nullable: false })
    owner: string;

    @Column({ type: 'varchar', nullable: false })
    repoName: string;

    @Column({ type: 'varchar', nullable: false })
    fullName: string;

    @Column({ type: 'varchar', nullable: true })
    defaultBranch: string | null;

    @Column({ type: 'timestamp', nullable: true })
    lastAnalyzedAt: Date | null;

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    // Relationships
    @OneToMany(
        () => PullRequestEntity,
        (pullRequest) => pullRequest.repository
    )
    pullRequests: Relation<PullRequestEntity[]>;

    @OneToMany(
        () => AnalysisSessionEntity,
        (session) => session.repository
    )
    analysisSessions: Relation<AnalysisSessionEntity[]>;
}
