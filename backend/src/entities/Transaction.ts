import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Account } from './Account';

@Entity('transactions')
export class Transaction {
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

    @Column({ type: 'uuid', nullable: true })
    accountId?: string;

    @ManyToOne(() => Account)
    @JoinColumn({ name: 'accountId' })
    account?: Account;

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    amount!: number;

    @Column({ type: 'varchar', length: 10 })
    type!: 'income' | 'expense';

    @Column({ type: 'timestamp' })
    date!: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    note?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
