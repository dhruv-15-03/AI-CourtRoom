package com.example.demo.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token-bucket rate limiter for abuse-prone endpoints.
 *
 * <p>Protects three classes of route:
 * <ul>
 *   <li><b>auth</b> ({@code /auth/login}, {@code /auth/signup}) - keyed by client IP to blunt
 *       credential brute-forcing and signup spam.</li>
 *   <li><b>otp</b> ({@code /api/verification/**}) - keyed by client IP; these send emails and
 *       are guessable, so they are the most expensive/abusable.</li>
 *   <li><b>ai</b> ({@code /api/ai/**}, {@code /api/agent/**}, {@code /api/ai-analysis/**}) -
 *       keyed by authenticated user (falling back to IP) because each call proxies to the
 *       Python AI service and is compute/cost heavy.</li>
 * </ul>
 *
 * <p>State is per-instance. The app runs as a single container on Render, so in-memory buckets
 * are sufficient; for a multi-instance rollout swap the bucket store for a Redis-backed one.
 * All limits are configurable (see {@code ratelimit.*} in application.properties) and the whole
 * filter can be disabled with {@code RATE_LIMIT_ENABLED=false}.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_BUCKETS = 50_000;
    private static final long STALE_AGE_MS = 600_000L; // evict buckets idle > 10 min

    private final boolean enabled;
    private final Rule authRule;
    private final Rule otpRule;
    private final Rule aiRule;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public RateLimitFilter(
            @Value("${ratelimit.enabled:true}") boolean enabled,
            @Value("${ratelimit.auth.capacity:10}") long authCapacity,
            @Value("${ratelimit.auth.refill-per-minute:10}") long authRefill,
            @Value("${ratelimit.otp.capacity:8}") long otpCapacity,
            @Value("${ratelimit.otp.refill-per-minute:8}") long otpRefill,
            @Value("${ratelimit.ai.capacity:30}") long aiCapacity,
            @Value("${ratelimit.ai.refill-per-minute:30}") long aiRefill) {
        this.enabled = enabled;
        this.authRule = new Rule("auth", authCapacity, authRefill);
        this.otpRule = new Rule("otp", otpCapacity, otpRefill);
        this.aiRule = new Rule("ai", aiCapacity, aiRefill);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        if (!enabled || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        Rule rule = resolveRule(request.getRequestURI());
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.name + '|' + clientIdentity(request);
        if (buckets.size() > MAX_BUCKETS) {
            evictStale();
        }
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> rule.newBucket());

        long waitMs = bucket.tryConsume();
        if (waitMs < 0) {
            filterChain.doFilter(request, response);
        } else {
            rejectTooManyRequests(response, waitMs);
        }
    }

    private Rule resolveRule(String path) {
        if (path.startsWith("/auth/login") || path.startsWith("/auth/signup")) {
            return authRule;
        }
        if (path.startsWith("/api/verification/")) {
            return otpRule;
        }
        // Health probes are cheap and polled frequently by Render/uptime checks.
        if (path.endsWith("/health")) {
            return null;
        }
        if (path.startsWith("/api/ai/")
                || path.startsWith("/api/agent/")
                || path.startsWith("/api/ai-analysis/")) {
            return aiRule;
        }
        return null;
    }

    private String clientIdentity(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() != null
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }
        return "ip:" + clientIp(request);
    }

    /**
     * Resolve the originating client IP. Render terminates TLS at a proxy, so the real client
     * address arrives in X-Forwarded-For; fall back to the socket address otherwise.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return (comma > 0 ? forwarded.substring(0, comma) : forwarded).trim();
        }
        return request.getRemoteAddr();
    }

    private void evictStale() {
        long cutoff = System.currentTimeMillis() - STALE_AGE_MS;
        buckets.entrySet().removeIf(entry -> entry.getValue().lastAccessMs < cutoff);
    }

    private void rejectTooManyRequests(HttpServletResponse response, long waitMs) throws IOException {
        long retryAfterSeconds = Math.max(1, (long) Math.ceil(waitMs / 1000.0));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("success", false);
        body.put("error", "rate_limited");
        body.put("message", "Too many requests. Please retry in " + retryAfterSeconds + "s.");
        objectMapper.writeValue(response.getWriter(), body);
    }

    /** Configuration for one bucket family. */
    private static final class Rule {
        private final String name;
        private final long capacity;
        private final double refillTokensPerMs;

        Rule(String name, long capacity, long refillPerMinute) {
            this.name = name;
            this.capacity = Math.max(1, capacity);
            this.refillTokensPerMs = Math.max(1, refillPerMinute) / 60_000.0;
        }

        TokenBucket newBucket() {
            return new TokenBucket(capacity, refillTokensPerMs);
        }
    }

    /** A classic token bucket: continuous refill, capped at capacity. */
    static final class TokenBucket {
        private final long capacity;
        private final double refillTokensPerMs;
        private double tokens;
        private long lastRefillNanos;
        volatile long lastAccessMs;

        TokenBucket(long capacity, double refillTokensPerMs) {
            this.capacity = capacity;
            this.refillTokensPerMs = refillTokensPerMs;
            this.tokens = capacity;
            this.lastRefillNanos = System.nanoTime();
            this.lastAccessMs = System.currentTimeMillis();
        }

        /**
         * Attempt to consume one token.
         *
         * @return {@code -1} if a token was available (request allowed), otherwise the number of
         *         milliseconds to wait before the next token becomes available.
         */
        synchronized long tryConsume() {
            lastAccessMs = System.currentTimeMillis();
            refill();
            if (tokens >= 1.0) {
                tokens -= 1.0;
                return -1L;
            }
            double needed = 1.0 - tokens;
            return (long) Math.ceil(needed / refillTokensPerMs);
        }

        private void refill() {
            long now = System.nanoTime();
            double elapsedMs = (now - lastRefillNanos) / 1_000_000.0;
            if (elapsedMs <= 0) {
                return;
            }
            tokens = Math.min(capacity, tokens + elapsedMs * refillTokensPerMs);
            lastRefillNanos = now;
        }
    }
}
