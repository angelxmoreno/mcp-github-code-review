import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class AppEntity {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @CreateDateColumn()
    createdDbAt: Date;

    @UpdateDateColumn()
    updatedDbAt: Date;

    @DeleteDateColumn({ nullable: true, default: null })
    deletedDbAt?: Date | null;
}
