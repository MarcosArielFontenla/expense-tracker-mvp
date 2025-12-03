export interface User {
    id: string;
    email: string;
    name: string;
    currency: string;
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
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface UpdateProfileRequest {
    name?: string;
    currency?: string;
}