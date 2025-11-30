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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
