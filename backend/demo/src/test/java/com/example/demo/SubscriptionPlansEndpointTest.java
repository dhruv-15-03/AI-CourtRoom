package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Regression cover for the pricing page going blank.
 *
 * <p>{@code getAvailablePlans()} used to carry {@code @Cacheable("subscriptionPlans")}.
 * With {@code @EnableCaching} on and {@code spring-boot-starter-data-redis} on the
 * classpath but no {@code spring.cache.type} set, Spring Boot auto-configured a
 * {@code RedisCacheManager} pointed at localhost:6379. Redis is opt-in here, so on a
 * deployed instance the cache interceptor threw before the method body ran and
 * {@code SubscriptionController} turned that into
 * {@code 400 {"success":false,"error":"Unable to connect to Redis"}}.
 *
 * <p>These tests fail if either half of the fix is reverted.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SubscriptionPlansEndpointTest {

    static {
        if (System.getenv("JWT_SECRET") == null && System.getProperty("JWT_SECRET") == null) {
            System.setProperty("JWT_SECRET", "test-only-jwt-secret-please-override-0123456789");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CacheManager cacheManager;

    @Test
    void plansEndpointIsPubliclyReadableAndReturnsPlans() throws Exception {
        mockMvc.perform(get("/api/subscription/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.plans").isArray())
                .andExpect(jsonPath("$.plans[0].id").exists())
                .andExpect(jsonPath("$.plans[0].priceDisplay").exists());
    }

    /**
     * Caching must default to in-memory. Redis stays opt-in via SPRING_CACHE_TYPE,
     * so no future {@code @Cacheable} silently reintroduces a hard Redis dependency.
     */
    @Test
    void cacheManagerIsInMemoryUnlessRedisIsExplicitlyConfigured() {
        assertThat(cacheManager).isInstanceOf(ConcurrentMapCacheManager.class);
    }
}
