package com.example.demo.Config;


public final class JwtConstants {
    
    private JwtConstants() {
    }
    
    public static final String HEADER = "Authorization";
    // JWT secret should be at least 256 bits (32 characters) for HS256
    // Falls back to a default key only for development - MUST set JWT_SECRET in production
    public static final String SECRET_KEY = System.getenv("JWT_SECRET") != null 
        ? System.getenv("JWT_SECRET") 
        : "Dhruv1503Rastogi2004100000001000000001000000000100000000000";
    public static final String TOKEN_PREFIX = "Bearer ";
}
