import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'debit_card' | 'savings';

@Entity('accounts')
export class Account {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 20 })
    type!: AccountType;

    @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
    balance!: number;

    @Column({ type: 'varchar', length: 3, default: 'ARS' })
    currency!: string;

    @Column({ type: 'varchar', length: 7, default: '#3b82f6' })
    color!: string;

    @Column({ type: 'varchar', length: 10, default: '💰' })
    icon!: string;

    @Column({ type: 'boolean', default: false })
    isDefault!: boolean;

    @Column({ type: 'boolean', default: false })
    isArchived!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
