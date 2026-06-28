package com.example.demo.Config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.mock.http.client.MockClientHttpResponse;

import java.io.IOException;
import java.net.URI;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for {@link AiResilienceInterceptor}. Pure JUnit + Mockito (no Spring
 * context, no live AI service) so the breaker behaviour is deterministic and fast.
 */
class AiResilienceInterceptorTest {

    private static HttpRequest requestTo(String url) {
        HttpRequest request = mock(HttpRequest.class);
        when(request.getURI()).thenReturn(URI.create(url));
        return request;
    }

    @Test
    void opensAfterFailuresAndFailsFastWithoutCallingUpstream() throws IOException {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(2)
                .minimumNumberOfCalls(2)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .build();
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
        AiResilienceInterceptor interceptor = new AiResilienceInterceptor(registry);

        HttpRequest request = requestTo("https://ai-court-ai.onrender.com/api/analyze");
        byte[] body = new byte[0];

        ClientHttpRequestExecution failing = mock(ClientHttpRequestExecution.class);
        when(failing.execute(any(), any())).thenThrow(new IOException("read timed out"));

        // Two consecutive failures reach the threshold and open the breaker.
        for (int i = 0; i < 2; i++) {
            assertThrows(IOException.class, () -> interceptor.intercept(request, body, failing));
        }

        // Breaker is now OPEN: the next call must fail fast and never touch the upstream.
        ClientHttpRequestExecution shouldNotRun = mock(ClientHttpRequestExecution.class);
        IOException ex = assertThrows(IOException.class,
                () -> interceptor.intercept(request, body, shouldNotRun));
        assertTrue(ex.getMessage().contains("circuit open"),
                "expected fail-fast message, got: " + ex.getMessage());
        verifyNoInteractions(shouldNotRun);
    }

    @Test
    void staysClosedOnSuccessfulResponse() throws IOException {
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.ofDefaults();
        AiResilienceInterceptor interceptor = new AiResilienceInterceptor(registry);

        HttpRequest request = requestTo("https://generativelanguage.googleapis.com/v1/models");
        ClientHttpResponse okResponse = new MockClientHttpResponse(new byte[0], HttpStatus.OK);

        ClientHttpRequestExecution execution = mock(ClientHttpRequestExecution.class);
        when(execution.execute(any(), any())).thenReturn(okResponse);

        ClientHttpResponse result = interceptor.intercept(request, new byte[0], execution);

        assertSame(okResponse, result);
        assertEquals(CircuitBreaker.State.CLOSED,
                registry.circuitBreaker("generativelanguage.googleapis.com").getState());
    }

    @Test
    void serverErrorsCountAsFailuresAndTripBreaker() throws IOException {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(2)
                .minimumNumberOfCalls(2)
                .failureRateThreshold(50)
                .waitDurationInOpenState(Duration.ofSeconds(30))
                .build();
        CircuitBreakerRegistry registry = CircuitBreakerRegistry.of(config);
        AiResilienceInterceptor interceptor = new AiResilienceInterceptor(registry);

        HttpRequest request = requestTo("https://ai-court-ai.onrender.com/api/analyze");
        ClientHttpResponse serverError =
                new MockClientHttpResponse(new byte[0], HttpStatus.INTERNAL_SERVER_ERROR);

        ClientHttpRequestExecution execution = mock(ClientHttpRequestExecution.class);
        when(execution.execute(any(), any())).thenReturn(serverError);

        // Two 5xx responses are recorded as failures and open the breaker.
        for (int i = 0; i < 2; i++) {
            interceptor.intercept(request, new byte[0], execution);
        }

        assertEquals(CircuitBreaker.State.OPEN,
                registry.circuitBreaker("ai-court-ai.onrender.com").getState());
    }
}
