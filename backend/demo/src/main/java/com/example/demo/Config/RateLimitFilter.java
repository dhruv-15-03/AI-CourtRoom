package com.example.demo.Config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
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
 * <p>Bucket state lives behind a pluggable {@link RateLimitStore}: the default
 * {@link InMemoryRateLimitStore} keeps buckets per process, while enabling Redis
 * ({@code APP_REDIS_ENABLED=true}) shares them across instances so limits hold under
 * horizontal scaling and survive restarts. Redis failures degrade gracefully to in-memory.
 * All limits are configurable (see {@code ratelimit.*} in application.properties) and the whole
 * filter can be disabled with {@code RATE_LIMIT_ENABLED=false}. Rejections are counted in the
 * {@code ratelimit.rejected} meter (scrape via {@code /actuator/prometheus}).
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final boolean enabled;
    private final Rule authRule;
    private final Rule otpRule;
    private final Rule aiRule;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RateLimitStore store;
    private final MeterRegistry meterRegistry;

    /**
     * Primary constructor used by Spring: the {@link RateLimitStore} (in-memory or Redis)
     * and {@link MeterRegistry} are injected so bucket state and rejection metrics are wired
     * from the application context.
     */
    @Autowired
    public RateLimitFilter(
            @Value("${ratelimit.enabled:true}") boolean enabled,
            @Value("${ratelimit.auth.capacity:10}") long authCapacity,
            @Value("${ratelimit.auth.refill-per-minute:10}") long authRefill,
            @Value("${ratelimit.otp.capacity:8}") long otpCapacity,
            @Value("${ratelimit.otp.refill-per-minute:8}") long otpRefill,
            @Value("${ratelimit.ai.capacity:30}") long aiCapacity,
            @Value("${ratelimit.ai.refill-per-minute:30}") long aiRefill,
            RateLimitStore store,
            MeterRegistry meterRegistry) {
        this.enabled = enabled;
        this.authRule = new Rule("auth", authCapacity, authRefill);
        this.otpRule = new Rule("otp", otpCapacity, otpRefill);
        this.aiRule = new Rule("ai", aiCapacity, aiRefill);
        this.store = store;
        this.meterRegistry = meterRegistry;
    }

    /**
     * Convenience constructor for unit tests and embedding: uses a per-process
     * {@link InMemoryRateLimitStore} and a throwaway {@link SimpleMeterRegistry}.
     */
    public RateLimitFilter(boolean enabled, long authCapacity, long authRefill,
                           long otpCapacity, long otpRefill, long aiCapacity, long aiRefill) {
        this(enabled, authCapacity, authRefill, otpCapacity, otpRefill, aiCapacity, aiRefill,
                new InMemoryRateLimitStore(), new SimpleMeterRegistry());
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
        long waitMs = store.tryConsume(key, rule.capacity, rule.refillTokensPerMs);
        if (waitMs < 0) {
            filterChain.doFilter(request, response);
        } else {
            meterRegistry.counter("ratelimit.rejected", "rule", rule.name, "backend", store.backend())
                    .increment();
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
    }
}
