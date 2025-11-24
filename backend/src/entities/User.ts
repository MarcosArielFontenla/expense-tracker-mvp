import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'nvarchar', length: 100 })
    name!: string;

    @Column({ type: 'nvarchar', length: 100, unique: true })
    email!: string;

    @Column({ type: 'nvarchar', length: 255 })
    passwordHash!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
