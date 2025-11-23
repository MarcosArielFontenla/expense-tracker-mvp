import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Category } from './Category';

@Entity('budgets')
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'uuid' })
    categoryId!: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'categoryId' })
    category!: Category;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount!: number;

    @Column({ type: 'int' })
    month!: number;

    @Column({ type: 'int' })
    year!: number;

    @Column({ type: 'int', default: 80 })
    alertThreshold!: number;
}
