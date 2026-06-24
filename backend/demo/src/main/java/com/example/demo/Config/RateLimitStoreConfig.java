package com.example.demo.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * Wires the {@link RateLimitStore} used by {@link RateLimitFilter}.
 *
 * <p>The store is selected by the {@code app.redis.enabled} flag
 * ({@code APP_REDIS_ENABLED} env var), which defaults to {@code false}:
 * <ul>
 *   <li><b>false / unset</b> — {@link InMemoryRateLimitStore}: per-process buckets, zero
 *       infrastructure. Correct for a single Render instance.</li>
 *   <li><b>true</b> — {@link RedisRateLimitStore}: buckets shared across instances via Redis,
 *       with an in-memory fallback if Redis is unreachable. Required once the backend scales
 *       horizontally. Provision Redis and set {@code SPRING_DATA_REDIS_URL}.</li>
 * </ul>
 */
@Configuration
public class RateLimitStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(RateLimitStoreConfig.class);

    @Bean
    @ConditionalOnProperty(name = "app.redis.enabled", havingValue = "false", matchIfMissing = true)
    public RateLimitStore inMemoryRateLimitStore() {
        log.info("Rate limiting backend: in-memory (per-instance). Set APP_REDIS_ENABLED=true to share across instances.");
        return new InMemoryRateLimitStore();
    }

    @Bean
    @ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
    public RateLimitStore redisRateLimitStore(StringRedisTemplate redisTemplate) {
        log.info("Rate limiting backend: Redis (distributed) with in-memory fallback.");
        return new RedisRateLimitStore(redisTemplate, new InMemoryRateLimitStore());
    }
}
