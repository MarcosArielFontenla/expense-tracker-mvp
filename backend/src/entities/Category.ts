import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar', length: 50 })
    name!: string;

    @Column({ type: 'varchar', length: 10 })
    icon!: string;

    @Column({ type: 'varchar', length: 20 })
    color!: string;

    @Column({ type: 'varchar', length: 10 })
    type!: 'income' | 'expense';

    @Column({ type: 'boolean', default: false })
    isDefault!: boolean;
}
