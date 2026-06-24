package com.example.demo.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;

import java.util.Collections;

/**
 * Distributed {@link RateLimitStore} that keeps token buckets in Redis so the limit
 * is enforced across every application instance and survives restarts.
 *
 * <p>The whole consume-refill-store cycle runs inside a single Lua script, which Redis
 * executes atomically — no read-modify-write race between concurrent requests, even
 * across instances. Redis's own clock ({@code TIME}) is the single source of truth for
 * refill, so instances with skewed clocks still agree.
 *
 * <p><b>Graceful degradation:</b> any Redis error (unreachable, timeout, script failure)
 * falls back to the supplied in-memory store so requests are never failed by an
 * infrastructure blip and per-instance protection remains in place.
 */
public class RedisRateLimitStore implements RateLimitStore {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimitStore.class);

    private static final String KEY_PREFIX = "aicourt:ratelimit:";

    // Atomic token bucket. KEYS[1]=bucket; ARGV: capacity, refillPerMs, ttlMs.
    // Returns -1 when a token was consumed (allowed), else the ms to wait.
    private static final String LUA = """
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refillPerMs = tonumber(ARGV[2])
            local ttl = tonumber(ARGV[3])
            local t = redis.call('TIME')
            local nowMs = (tonumber(t[1]) * 1000) + (tonumber(t[2]) / 1000)
            local data = redis.call('HMGET', key, 'tokens', 'ts')
            local tokens = tonumber(data[1])
            local ts = tonumber(data[2])
            if tokens == nil then
              tokens = capacity
              ts = nowMs
            end
            local elapsed = nowMs - ts
            if elapsed < 0 then elapsed = 0 end
            tokens = math.min(capacity, tokens + elapsed * refillPerMs)
            local wait = -1
            if tokens >= 1 then
              tokens = tokens - 1
            else
              wait = math.ceil((1 - tokens) / refillPerMs)
            end
            redis.call('HSET', key, 'tokens', tokens, 'ts', nowMs)
            redis.call('PEXPIRE', key, ttl)
            return wait
            """;

    private final StringRedisTemplate redis;
    private final RateLimitStore fallback;
    private final RedisScript<Long> script;
    private volatile boolean healthy = true;

    public RedisRateLimitStore(StringRedisTemplate redis, RateLimitStore fallback) {
        this.redis = redis;
        this.fallback = fallback;
        this.script = new DefaultRedisScript<>(LUA, Long.class);
        probe();
    }

    /** Best-effort connectivity check so a misconfigured Redis surfaces in the logs at boot. */
    private void probe() {
        try {
            redis.hasKey(KEY_PREFIX + "__probe__");
            log.info("RedisRateLimitStore: connected to Redis backend for distributed rate limiting");
        } catch (Exception e) {
            healthy = false;
            log.warn("RedisRateLimitStore: Redis unavailable ({}); falling back to in-memory rate limiting",
                    e.toString());
        }
    }

    @Override
    public long tryConsume(String key, long capacity, double refillTokensPerMs) {
        try {
            double safeRefill = Math.max(refillTokensPerMs, 1e-9);
            long ttlMs = Math.max(60_000L, (long) Math.ceil(capacity / safeRefill) * 2L);
            Long result = redis.execute(
                    script,
                    Collections.singletonList(KEY_PREFIX + key),
                    Long.toString(capacity),
                    Double.toString(refillTokensPerMs),
                    Long.toString(ttlMs));
            if (!healthy) {
                healthy = true;
                log.info("RedisRateLimitStore: Redis recovered; resuming distributed rate limiting");
            }
            return result == null ? -1L : result;
        } catch (Exception e) {
            if (healthy) {
                healthy = false;
                log.warn("RedisRateLimitStore: Redis call failed ({}); using in-memory fallback", e.toString());
            }
            return fallback.tryConsume(key, capacity, refillTokensPerMs);
        }
    }

    @Override
    public String backend() {
        return healthy ? "redis" : "redis-degraded";
    }
}
