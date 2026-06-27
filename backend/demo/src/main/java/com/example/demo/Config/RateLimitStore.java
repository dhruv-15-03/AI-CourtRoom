package com.example.demo.Config;

/**
 * Pluggable backing store for the token-bucket {@link RateLimitFilter}.
 *
 * <p>Implementations decide where bucket state lives: {@link InMemoryRateLimitStore}
 * keeps it per process, while {@link RedisRateLimitStore} shares it across every
 * instance and gunicorn-style worker so limits hold under horizontal scaling and
 * survive restarts.
 */
public interface RateLimitStore {

    /**
     * Attempt to consume a single token from the bucket identified by {@code key}.
     *
     * @param key                a stable bucket identifier (rule name + client identity)
     * @param capacity           burst size / maximum tokens the bucket can hold
     * @param refillTokensPerMs  sustained refill rate in tokens per millisecond
     * @return {@code -1} if a token was available (request allowed); otherwise the number
     *         of milliseconds to wait before the next token becomes available.
     */
    long tryConsume(String key, long capacity, double refillTokensPerMs);

    /** Short identifier for metrics/diagnostics, e.g. {@code "memory"} or {@code "redis"}. */
    String backend();
}
