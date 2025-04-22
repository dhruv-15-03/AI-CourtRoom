package com.example.demo.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;

import javax.crypto.SecretKey;
import java.util.Date;

public class JwtProvider {

    private static SecretKey key;

    static {
        key = Keys.hmacShaKeyFor(constant.secret_key.getBytes());
    }

    public static String generateToken(Authentication authentication){
        return Jwts.builder().issuer("Dhruv").issuedAt(new Date()).expiration(new Date(new Date().getTime() + 86400000))
                .claim("userName",authentication.getName())
                .signWith(key).compact();
    }
    public static String getUserNameFromJwt(String jwt){
        jwt=jwt.substring(7);
        Claims claims= Jwts.parser().setSigningKey(key).build().parseSignedClaims(jwt).getPayload();
        return String.valueOf(claims.get("userName"));
    }
}
