export interface User {
    id: string;
    email: string;
    name: string;
    currency: string;
    timezone: string;
    emailVerified?: boolean;
    createdAt: Date;
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