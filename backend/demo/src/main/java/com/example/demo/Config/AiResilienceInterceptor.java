package com.example.demo.Config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpRequest;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

/**
 * Wraps every outbound {@link org.springframework.web.client.RestTemplate} call in a
 * per-host Resilience4j circuit breaker so a sleeping or failing AI dependency — the
 * Python ML service on Render, or the Gemini API — cannot pin servlet threads on the
 * 120s read timeout and cascade into a full thread-pool outage.
 *
 * <p>Behaviour:
 * <ul>
 *   <li>Connection/read failures (an {@link IOException}) and HTTP {@code 5xx}
 *       responses are recorded as failures. {@code 4xx} responses mean the upstream is
 *       alive but rejected our request, so they count as healthy and never trip the
 *       breaker.</li>
 *   <li>When a host's breaker is <b>OPEN</b> the call is rejected immediately (no
 *       upstream request) and surfaced as an {@link IOException}. RestTemplate
 *       translates that into a {@code ResourceAccessException} (a
 *       {@code RestClientException}), which the AI controllers already catch and turn
 *       into a clean {@code 503} fallback — so behaviour degrades gracefully instead
 *       of hanging.</li>
 *   <li>Breakers are keyed by host, so an outage of the ML service never trips the
 *       Gemini breaker and vice versa.</li>
 * </ul>
 */
@Slf4j
public class AiResilienceInterceptor implements ClientHttpRequestInterceptor {

    private final CircuitBreakerRegistry registry;

    public AiResilienceInterceptor(CircuitBreakerRegistry registry) {
        this.registry = registry;
    }

    @Override
    @NonNull
    public ClientHttpResponse intercept(@NonNull HttpRequest request,
                                        @NonNull byte[] body,
                                        @NonNull ClientHttpRequestExecution execution) throws IOException {
        String host = request.getURI().getHost();
        if (host == null) {
            // No host to key a breaker on (e.g. a relative/opaque URI) — pass through.
            return execution.execute(request, body);
        }

        CircuitBreaker breaker = registry.circuitBreaker(host);
        if (!breaker.tryAcquirePermission()) {
            log.warn("Circuit breaker OPEN for {} - failing fast without calling upstream", host);
            throw new IOException("AI dependency circuit open for host " + host);
        }

        long start = System.nanoTime();
        try {
            ClientHttpResponse response = execution.execute(request, body);
            long durationNanos = System.nanoTime() - start;
            HttpStatusCode status = response.getStatusCode();
            if (status.is5xxServerError()) {
                breaker.onError(durationNanos, TimeUnit.NANOSECONDS,
                        new IOException("Upstream " + host + " returned " + status.value()));
            } else {
                breaker.onSuccess(durationNanos, TimeUnit.NANOSECONDS);
            }
            return response;
        } catch (IOException | RuntimeException e) {
            long durationNanos = System.nanoTime() - start;
            breaker.onError(durationNanos, TimeUnit.NANOSECONDS, e);
            throw e;
        }
    }
}
