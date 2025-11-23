import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USERNAME || 'expense_user',
    password: process.env.DB_PASSWORD || 'Password123!',
    database: process.env.DB_DATABASE || 'ExpenseTrackerMvpDB',
    synchronize: true,
    logging: true,
    entities: ['src/entities/**/*.ts'],
    migrations: [],
    subscribers: [],
    options: {
        encrypt: false,
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS'
    }
});