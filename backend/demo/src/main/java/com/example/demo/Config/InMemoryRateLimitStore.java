package com.example.demo.Config;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-process {@link RateLimitStore}. Holds one {@link TokenBucket} per key in a
 * {@link ConcurrentHashMap}, lazily creating buckets on first use and evicting idle
 * ones so the map cannot grow without bound under a flood of distinct clients.
 *
 * <p>This is the default store and also serves as the in-memory fallback for
 * {@link RedisRateLimitStore} when Redis is unreachable, so per-instance protection
 * never disappears even during a Redis outage.
 */
public class InMemoryRateLimitStore implements RateLimitStore {

    private static final int MAX_BUCKETS = 50_000;
    private static final long STALE_AGE_MS = 600_000L; // evict buckets idle > 10 min

    private final ConcurrentHashMap<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    @Override
    public long tryConsume(String key, long capacity, double refillTokensPerMs) {
        if (buckets.size() > MAX_BUCKETS) {
            evictStale();
        }
        TokenBucket bucket = buckets.computeIfAbsent(key, k -> new TokenBucket(capacity, refillTokensPerMs));
        return bucket.tryConsume();
    }

    @Override
    public String backend() {
        return "memory";
    }

    private void evictStale() {
        long cutoff = System.currentTimeMillis() - STALE_AGE_MS;
        buckets.entrySet().removeIf(entry -> entry.getValue().lastAccessMs < cutoff);
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
