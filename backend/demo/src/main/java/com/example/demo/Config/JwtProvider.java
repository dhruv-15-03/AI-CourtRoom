package com.example.demo.Config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class JwtProvider {

    private static final SecretKey key = Keys.hmacShaKeyFor(JwtConstants.SECRET_KEY.getBytes());
    private static final String ISSUER = "AI-Court";
    private static final long EXPIRATION_TIME = 86400000; // 24 hours

    public static String generateToken(Authentication authentication) {
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));
        return Jwts.builder()
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .claim("email", authentication.getName())
                .claim("roles", roles)
                .signWith(key)
                .compact();
    }

    public static String getEmailFromJwt(String jwt) {
        if (jwt.startsWith("Bearer ")) {
            jwt = jwt.substring(7);
        }
        
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();
        
        return String.valueOf(claims.get("email"));
    }

    /**
     * Reconstructs the granted authorities embedded in the {@code roles} claim
     * at login time. Tokens issued before role claims existed (or with an empty
     * claim) fall back to the baseline CITIZEN authority so general endpoints
     * keep working; role-restricted endpoints will require a fresh login.
     */
    public static List<GrantedAuthority> getAuthoritiesFromJwt(String jwt) {
        if (jwt.startsWith("Bearer ")) {
            jwt = jwt.substring(7);
        }

        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(jwt)
                .getPayload();

        List<GrantedAuthority> authorities = new ArrayList<>();
        Object roles = claims.get("roles");
        if (roles != null) {
            for (String role : roles.toString().split(",")) {
                String trimmed = role.trim();
                if (!trimmed.isEmpty()) {
                    authorities.add(new SimpleGrantedAuthority(trimmed));
                }
            }
        }
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority(RoleAuthorities.ROLE_CITIZEN));
        }
        return authorities;
    }
}
