export interface User {
    id: string;
    email: string;
    name: string;
    currency: string;
    timezone: string;
    emailVerified?: boolean;
    createdAt: Date;
    plan: 'free' | 'starter' | 'pro' | 'max';
    subStatus: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
    trialStartDate?: Date;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    currency?: string;
    timezone?: string;
    plan?: 'free' | 'starter' | 'pro' | 'max';
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface UpdateProfileRequest {
    name?: string;
    currency?: string;
    timezone?: string;
}