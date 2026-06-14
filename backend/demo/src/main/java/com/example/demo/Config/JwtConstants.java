package com.example.demo.Config;


public final class JwtConstants {
    
    private JwtConstants() {
    }
    
    public static final String HEADER = "Authorization";
    public static final String TOKEN_PREFIX = "Bearer ";

    // Minimum length for an HS256 secret (256 bits == 32 bytes).
    private static final int MIN_SECRET_LENGTH = 32;

    /**
     * JWT signing secret. Resolved from the JWT_SECRET environment variable
     * (with a JVM system property fallback for tests). There is intentionally
     * NO hardcoded fallback: shipping a known secret would let anyone forge
     * authentication tokens. The application fails fast at startup if the
     * secret is missing or too weak.
     */
    public static final String SECRET_KEY = resolveSecret();

    private static String resolveSecret() {
        String secret = System.getenv("JWT_SECRET");
        if (secret == null || secret.isBlank()) {
            secret = System.getProperty("JWT_SECRET");
        }
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "JWT_SECRET environment variable is not set. Configure a strong, random secret "
                + "(at least " + MIN_SECRET_LENGTH + " characters) before starting the application.");
        }
        if (secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                "JWT_SECRET is too short (" + secret.length() + " characters). Use at least "
                + MIN_SECRET_LENGTH + " characters for a secure HS256 signing key.");
        }
        return secret;
    }
}
