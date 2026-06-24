package com.example.demo.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class RateLimitFilterTest {

    /** Counting chain stub so we can assert how many requests were allowed through. */
    private static FilterChain countingChain(AtomicInteger counter) {
        return (req, res) -> counter.incrementAndGet();
    }

    private MockHttpServletRequest post(String uri, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setMethod("POST");
        request.setRequestURI(uri);
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void allowsUpToCapacityThenBlocks() throws Exception {
        // auth capacity 3, negligible refill so the 4th request is rejected.
        RateLimitFilter filter = new RateLimitFilter(true, 3, 1, 8, 1, 30, 1);
        SecurityContextHolder.clearContext();
        AtomicInteger passed = new AtomicInteger();

        for (int i = 0; i < 3; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(post("/auth/login", "1.2.3.4"), response, countingChain(passed));
            assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        }

        MockHttpServletResponse blocked = new MockHttpServletResponse();
        filter.doFilter(post("/auth/login", "1.2.3.4"), blocked, countingChain(passed));

        assertEquals(3, passed.get(), "only the first 3 requests should reach the chain");
        assertEquals(429, blocked.getStatus());
        assertTrue(Integer.parseInt(blocked.getHeader("Retry-After")) >= 1);
    }

    @Test
    void bucketsAreIsolatedPerClientIp() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(true, 1, 1, 8, 1, 30, 1);
        SecurityContextHolder.clearContext();
        AtomicInteger passed = new AtomicInteger();

        MockHttpServletResponse a = new MockHttpServletResponse();
        filter.doFilter(post("/auth/login", "10.0.0.1"), a, countingChain(passed));
        // Different IP must get its own bucket and still be allowed.
        MockHttpServletResponse b = new MockHttpServletResponse();
        filter.doFilter(post("/auth/login", "10.0.0.2"), b, countingChain(passed));

        assertEquals(HttpServletResponse.SC_OK, a.getStatus());
        assertEquals(HttpServletResponse.SC_OK, b.getStatus());
        assertEquals(2, passed.get());
    }

    @Test
    void unmatchedPathsAreNeverLimited() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(true, 1, 1, 1, 1, 1, 1);
        SecurityContextHolder.clearContext();
        AtomicInteger passed = new AtomicInteger();

        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(post("/api/cases", "1.2.3.4"), response, countingChain(passed));
            assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        }
        assertEquals(5, passed.get());
    }

    @Test
    void healthEndpointsAreExempt() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(true, 1, 1, 1, 1, 1, 1);
        SecurityContextHolder.clearContext();
        AtomicInteger passed = new AtomicInteger();

        for (int i = 0; i < 4; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setMethod("GET");
            request.setRequestURI("/api/ai/health");
            request.setRemoteAddr("1.2.3.4");
            filter.doFilter(request, response, countingChain(passed));
            assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        }
        assertEquals(4, passed.get());
    }

    @Test
    void disabledFilterIsPassThrough() throws Exception {
        RateLimitFilter filter = new RateLimitFilter(false, 1, 1, 1, 1, 1, 1);
        SecurityContextHolder.clearContext();
        AtomicInteger passed = new AtomicInteger();

        for (int i = 0; i < 10; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilter(post("/auth/login", "1.2.3.4"), response, countingChain(passed));
            assertEquals(HttpServletResponse.SC_OK, response.getStatus());
        }
        assertEquals(10, passed.get());
    }

    @Test
    void mockChainCompiles() {
        // Guard against an unused-import/dependency regression on Mockito in this module.
        FilterChain chain = mock(FilterChain.class);
        assertTrue(chain != null);
    }
}
