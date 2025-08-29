import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class AppEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @CreateDateColumn({ type: 'timestamp' })
    createdDbAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedDbAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
    deletedDbAt: Date;
}
