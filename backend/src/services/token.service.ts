import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface TokenPayload {
    userId: string;
    tokenId?: string;
}

class TokenService {
    private readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'secret';
    private readonly REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
    private readonly ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
    private readonly REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

    // Generate short-lived access token
    public generateAccessToken(userId: string): string {
        const payload: TokenPayload = { userId };

        return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRY
        });
    }

    // Generate long-lived refresh token with unique ID
    public generateRefreshToken(userId: string): string {
        const tokenId = crypto.randomBytes(16).toString('hex');
        const payload: TokenPayload = { userId, tokenId };

        return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRY
        });
    }

    // Verify access token
    public verifyAccessToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.ACCESS_TOKEN_SECRET) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    // Verify refresh token
    public verifyRefreshToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
        } catch (error) {
            return null;
        }
    }

    // Hash refresh token for database storage
    public hashRefreshToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    // Verify hashed refresh token
    public verifyHashedToken(token: string, hashedToken: string): boolean {
        const hash = this.hashRefreshToken(token);
        return hash === hashedToken;
    }
}

export default new TokenService();