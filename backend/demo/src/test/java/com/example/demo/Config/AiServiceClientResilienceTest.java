package com.example.demo.Config;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Verifies the {@code aiService} circuit breaker actually trips through the Spring AOP
 * proxy on {@link AiServiceClient}. A {@code new}'d client would bypass the aspect, so we
 * autowire the proxied bean and replace its {@link RestTemplate} with a mock that controls
 * the upstream outcome.
 *
 * <p>Recorded failures (any {@link org.springframework.web.client.RestClientException} such
 * as {@link ResourceAccessException}) must open the breaker and subsequent calls must
 * short-circuit with {@link CallNotPermittedException}. 4xx responses
 * ({@link HttpClientErrorException}) are configured as ignored and must leave the breaker
 * CLOSED so genuine client errors never take the upstream out of rotation.</p>
 */
@SpringBootTest
@ActiveProfiles("test")
class AiServiceClientResilienceTest {

    static {
        if (System.getenv("JWT_SECRET") == null && System.getProperty("JWT_SECRET") == null) {
            System.setProperty("JWT_SECRET", "test-only-jwt-secret-please-override-0123456789");
        }
    }

    @MockitoBean
    private RestTemplate restTemplate;

    @Autowired
    private AiServiceClient aiClient;

    @Autowired
    private CircuitBreakerRegistry registry;

    private CircuitBreaker breaker;

    @BeforeEach
    void resetBreaker() {
        breaker = registry.circuitBreaker(AiServiceClient.CB_NAME);
        breaker.reset();
    }

    private static Map<String, Object> sampleBody() {
        Map<String, Object> body = new HashMap<>();
        body.put("query", "x");
        return body;
    }

    @Test
    void repeatedUpstreamFailuresOpenBreakerAndShortCircuit() {
        when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new ResourceAccessException("upstream down"));

        // Drive failing calls until the breaker transitions to OPEN (robust to exact threshold).
        for (int i = 0; i < 40 && breaker.getState() != CircuitBreaker.State.OPEN; i++) {
            try {
                aiClient.postJson("/agent/analyze", sampleBody());
            } catch (Exception ignored) {
                // expected: ResourceAccessException while CLOSED/HALF_OPEN
            }
        }

        assertEquals(CircuitBreaker.State.OPEN, breaker.getState(),
                "breaker should open after repeated RestClientException failures");

        // Once OPEN, the call is rejected before reaching the (still-failing) upstream.
        assertThrows(CallNotPermittedException.class,
                () -> aiClient.postJson("/agent/analyze", sampleBody()));
    }

    @Test
    void clientErrorsDoNotOpenBreaker() {
        when(restTemplate.exchange(anyString(), any(HttpMethod.class), any(HttpEntity.class), eq(Map.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.BAD_REQUEST));

        for (int i = 0; i < 20; i++) {
            try {
                aiClient.postJson("/agent/analyze", sampleBody());
            } catch (HttpClientErrorException expected) {
                // 4xx must propagate unchanged to the caller
            }
        }

        assertEquals(CircuitBreaker.State.CLOSED, breaker.getState(),
                "ignored 4xx errors must not trip the breaker");
    }
}
