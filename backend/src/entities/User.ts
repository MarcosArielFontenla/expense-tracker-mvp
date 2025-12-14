import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    name!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 255 })
    passwordHash!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    resetPasswordToken?: string;

    @Column({ type: 'timestamp', nullable: true })
    resetPasswordExpires?: Date;

    @Column({ type: 'boolean', default: false })
    emailVerified!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    emailVerificationToken?: string;

    @Column({ type: 'timestamp', nullable: true })
    emailVerificationExpires?: Date;

    @Column({ type: 'varchar', length: 500, nullable: true })
    refreshToken?: string;

    @Column({ type: 'varchar', length: 3, default: 'USD' })
    currency!: string;

    @Column({ type: 'varchar', length: 50, default: 'America/Argentina/Buenos_Aires' })
    timezone!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({
        type: 'enum',
        enum: ['free', 'starter', 'pro', 'max'],
        default: 'free',
        enumName: 'plan_tier'
    })
    plan!: 'free' | 'starter' | 'pro' | 'max';

    @Column({
        type: 'enum',
        enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
        default: 'active',
        name: 'sub_status',
        enumName: 'subscription_status'
    })
    subStatus!: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';

    @Column({ type: 'timestamp', nullable: true, name: 'trial_start_date' })
    trialStartDate?: Date;

    @Column({ type: 'varchar', length: 255, nullable: true, name: 'billing_customer_id' })
    billingCustomerId?: string;
}

export enum PlanTier {
    FREE = 'free',
    STARTER = 'starter',
    PRO = 'pro',
    MAX = 'max'
}

export enum SubscriptionStatus {
    ACTIVE = 'active',
    TRIALING = 'trialing',
    PAST_DUE = 'past_due',
    CANCELED = 'canceled',
    EXPIRED = 'expired'
}

