import { AppDataSource } from './src/config/database';
import { Transaction } from './src/entities/Transaction';

async function debugTransactions() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const transactionRepository = AppDataSource.getRepository(Transaction);
        const transactions = await transactionRepository.find();

        console.log('Total transactions:', transactions.length);

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            console.log(`ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount} (Type: ${typeof t.amount})`);

            const val = Number(t.amount);
            if (t.type === 'income') {
                totalIncome += val;
            } else {
                totalExpense += val;
            }
        });

        console.log('Calculated Income:', totalIncome);
        console.log('Calculated Expense:', totalExpense);
        console.log('Balance:', totalIncome - totalExpense);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

debugTransactions();
