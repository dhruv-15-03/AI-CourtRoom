package com.example.demo.Config;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Resilience-protected client for Google's Gemini generateContent API.
 *
 * <p>Guarded by the {@code gemini} circuit breaker so a slow or failing Gemini endpoint
 * fails fast (via {@link io.github.resilience4j.circuitbreaker.CallNotPermittedException})
 * once thresholds are crossed, rather than hanging request threads. Kept separate from
 * {@link AiServiceClient} so an outage of one upstream cannot trip the other's breaker.</p>
 */
@Component
public class GeminiClient {

    /** Name of the resilience4j circuit breaker instance (see application.properties). */
    public static final String CB_NAME = "gemini";

    private final RestTemplate restTemplate;

    public GeminiClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Call the Gemini generateContent endpoint. The API key is embedded in {@code url} by
     * the caller; only the JSON request body is supplied here.
     */
    @CircuitBreaker(name = CB_NAME)
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Map<String, Object> generate(String url, Map<String, Object> requestBody) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
        return (Map<String, Object>) response.getBody();
    }
}
