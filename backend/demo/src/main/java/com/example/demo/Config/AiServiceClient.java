package com.example.demo.Config;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Centralised, resilience-protected client for the Python (Flask) AI microservice.
 *
 * <p>Every outbound call is guarded by the {@code aiService} circuit breaker. When the
 * upstream is failing or slow beyond the configured thresholds the breaker opens and
 * subsequent calls fail fast with
 * {@link io.github.resilience4j.circuitbreaker.CallNotPermittedException} instead of
 * piling up on a dead upstream and exhausting the servlet thread pool. Controllers map
 * that exception to HTTP 503.</p>
 *
 * <p>4xx responses from the AI service are configured as ignored exceptions, so genuine
 * client errors (bad input) propagate unchanged and never trip the breaker.</p>
 */
@Component
public class AiServiceClient {

    /** Name of the resilience4j circuit breaker instance (see application.properties). */
    public static final String CB_NAME = "aiService";

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;

    public AiServiceClient(
            RestTemplate restTemplate,
            @Value("${ai.service.url:https://ai-court-ai.onrender.com/api}") String baseUrl,
            @Value("${ai.service.api.key:}") String apiKey) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    /** Attach the shared X-API-Key header for authenticated calls to the AI service. */
    private void applyAuth(HttpHeaders headers) {
        if (apiKey != null && !apiKey.isBlank()) {
            headers.set("X-API-Key", apiKey);
        }
    }

    /** POST a JSON body to {@code <baseUrl><path>} and return the parsed response map. */
    @CircuitBreaker(name = CB_NAME)
    public Map<String, Object> postJson(String path, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        applyAuth(headers);
        return exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers));
    }

    /** POST a multipart form (e.g. document uploads) to {@code <baseUrl><path>}. */
    @CircuitBreaker(name = CB_NAME)
    public Map<String, Object> postMultipart(String path, MultiValueMap<String, Object> form) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        applyAuth(headers);
        return exchange(path, HttpMethod.POST, new HttpEntity<>(form, headers));
    }

    /** GET {@code <baseUrl><path>} and return the parsed response map. */
    @CircuitBreaker(name = CB_NAME)
    public Map<String, Object> getJson(String path) {
        HttpHeaders headers = new HttpHeaders();
        applyAuth(headers);
        return exchange(path, HttpMethod.GET, new HttpEntity<>(headers));
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> exchange(String path, HttpMethod method, HttpEntity<?> entity) {
        ResponseEntity<Map> response = restTemplate.exchange(baseUrl + path, method, entity, Map.class);
        return (Map<String, Object>) response.getBody();
    }
}
