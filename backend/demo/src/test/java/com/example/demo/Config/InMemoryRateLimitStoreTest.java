package com.example.demo.Config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contract tests for {@link InMemoryRateLimitStore}: the same token-bucket semantics the
 * {@link RateLimitFilter} relies on, now that bucket state lives behind the store abstraction.
 */
class InMemoryRateLimitStoreTest {

    @Test
    void allowsUpToCapacityThenRejects() {
        InMemoryRateLimitStore store = new InMemoryRateLimitStore();
        // capacity 3, refill 1 token/minute -> refills are negligible within the test window.
        double refillPerMs = 1 / 60_000.0;

        assertEquals(-1L, store.tryConsume("k", 3, refillPerMs), "1st request allowed");
        assertEquals(-1L, store.tryConsume("k", 3, refillPerMs), "2nd request allowed");
        assertEquals(-1L, store.tryConsume("k", 3, refillPerMs), "3rd request allowed");

        long wait = store.tryConsume("k", 3, refillPerMs);
        assertTrue(wait > 0, "4th request rejected with a positive wait, got " + wait);
    }

    @Test
    void keysAreIsolated() {
        InMemoryRateLimitStore store = new InMemoryRateLimitStore();
        double refillPerMs = 1 / 60_000.0;

        assertEquals(-1L, store.tryConsume("a", 1, refillPerMs));
        // 'a' is now empty, but 'b' has its own full bucket.
        assertTrue(store.tryConsume("a", 1, refillPerMs) > 0, "bucket 'a' exhausted");
        assertEquals(-1L, store.tryConsume("b", 1, refillPerMs), "bucket 'b' independent");
    }

    @Test
    void refillsOverTime() throws InterruptedException {
        InMemoryRateLimitStore store = new InMemoryRateLimitStore();
        // capacity 1, refill 100 tokens/sec -> ~10ms per token.
        double refillPerMs = 100 / 1000.0;

        assertEquals(-1L, store.tryConsume("k", 1, refillPerMs), "1st request allowed");
        assertTrue(store.tryConsume("k", 1, refillPerMs) > 0, "2nd request rejected immediately");

        Thread.sleep(50); // > 10ms, so at least one token has refilled
        assertEquals(-1L, store.tryConsume("k", 1, refillPerMs), "request allowed after refill");
    }

    @Test
    void reportsMemoryBackend() {
        assertEquals("memory", new InMemoryRateLimitStore().backend());
    }
}
