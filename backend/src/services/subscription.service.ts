import { AppDataSource } from '../config/database';
import { User, PlanTier, SubscriptionStatus } from '../entities/User';
import { PlanLimit } from '../entities/PlanLimit';

export class SubscriptionService {
    private static userRepository = AppDataSource.getRepository(User);
    private static planLimitRepository = AppDataSource.getRepository(PlanLimit);

    /**
     * Checks if a user's trial has expired and updates their status if necessary.
     */
    static async checkTrialStatus(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return;

        if (user.subStatus === SubscriptionStatus.TRIALING && user.trialStartDate) {
            const trialDurationDays = 14;
            const now = new Date();
            const trialEnd = new Date(user.trialStartDate);
            trialEnd.setDate(trialEnd.getDate() + trialDurationDays);

            if (now > trialEnd) {
                user.subStatus = SubscriptionStatus.EXPIRED;
                // Optionally revert plan to free? Or keep as expired (blocked access)?
                // Usually we mark as expired and they have to pay or downgrade.
                // For this MVP, let's keep plan but mark expired.
                await this.userRepository.save(user);
            }
        }
    }

    /**
     * Run daily manually or via cron to check all trailing users
     */
    static async checkAllTrials(): Promise<void> {
        // Find all users in trialing status
        const users = await this.userRepository.find({
            where: { subStatus: SubscriptionStatus.TRIALING }
        });

        for (const user of users) {
            await this.checkTrialStatus(user.id);
        }
    }

    /**
     * Downgrades a user to the Free plan.
     * This is a "soft downgrade": data is kept but limits are enforced for new creations.
     */
    static async downgradeToFree(userId: string): Promise<User | null> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return null;

        user.plan = PlanTier.FREE;
        user.subStatus = SubscriptionStatus.ACTIVE;
        user.trialStartDate = undefined; // Clear trial status

        return await this.userRepository.save(user);
    }
}
