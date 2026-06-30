package com.example.demo.Config;


import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.micrometer.tagged.TaggedCircuitBreakerMetrics;
import io.micrometer.core.instrument.binder.MeterBinder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.lang.NonNull;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class AppConfig implements WebMvcConfigurer {
    
    @Override
    public void extendMessageConverters(@NonNull List<HttpMessageConverter<?>> converters) {
        for (HttpMessageConverter<?> converter : converters) {
            if (converter instanceof MappingJackson2HttpMessageConverter) {
                MappingJackson2HttpMessageConverter jsonConverter = (MappingJackson2HttpMessageConverter) converter;
                List<MediaType> supportedMediaTypes = new ArrayList<>(jsonConverter.getSupportedMediaTypes());
                supportedMediaTypes.add(MediaType.valueOf("application/json;charset=UTF-8"));
                supportedMediaTypes.add(MediaType.valueOf("application/json;charset=utf-8"));
                jsonConverter.setSupportedMediaTypes(supportedMediaTypes);
                break;
            }
        }
    }
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, RateLimitFilter rateLimitFilter) throws Exception{
        http.sessionManagement(management-> management.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.authorizeHttpRequests(Authorize -> Authorize
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/verification/**").permitAll()
                .requestMatchers("/api/subscription/plans").permitAll()
                .requestMatchers("/api/subscription/webhook").permitAll()
                // Infrastructure endpoints that must stay reachable without a JWT:
                // Render's health probe, the WebSocket/SockJS handshake and the
                // Spring error dispatch path.
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/error").permitAll()
                .requestMatchers("/api/**").authenticated()
                // Anything not matched above now requires authentication instead
                // of being silently public.
                .anyRequest().authenticated())
                .addFilterBefore(new JwtValidator(), BasicAuthenticationFilter.class)
                // Run after JwtValidator so the authenticated principal is available for
                // per-user limiting on the AI endpoints.
                .addFilterAfter(rateLimitFilter, JwtValidator.class)
                .csrf(csrf -> csrf.disable())
                .cors(cors-> cors.configurationSource(corsConfigurationSource()));
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:8081",
                "http://localhost:3000",
                "https://ai-court-room-iota.vercel.app",
                "https://ai-courtroom.vercel.app"
        ));

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    /**
     * A {@link RateLimitFilter} bean is also a servlet {@link jakarta.servlet.Filter}, which
     * Spring Boot would otherwise auto-register in the main servlet chain in addition to the
     * Spring Security chain, running it twice per request. Disabling this registration leaves the
     * filter wired only where we placed it inside {@link #securityFilterChain}.
     */
    @Bean
    public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
        FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    /**
     * Per-host circuit breaker registry guarding outbound AI calls. Defaults are
     * conservative so heavy-but-healthy analysis traffic never trips the breaker:
     * only after {@code minimum-number-of-calls} samples with a failure rate at or
     * above the threshold does a host open (fail fast) for the wait duration. Tunable
     * via {@code ai.resilience.*} / {@code AI_CB_*} environment overrides.
     */
    @Bean
    public CircuitBreakerRegistry aiCircuitBreakerRegistry(
            @Value("${ai.resilience.failure-rate-threshold:50}") float failureRateThreshold,
            @Value("${ai.resilience.sliding-window-size:10}") int slidingWindowSize,
            @Value("${ai.resilience.minimum-number-of-calls:5}") int minimumNumberOfCalls,
            @Value("${ai.resilience.wait-duration-open-seconds:30}") long waitDurationOpenSeconds,
            @Value("${ai.resilience.permitted-calls-half-open:3}") int permittedCallsHalfOpen) {
        CircuitBreakerConfig config = CircuitBreakerConfig.custom()
                .slidingWindowType(CircuitBreakerConfig.SlidingWindowType.COUNT_BASED)
                .slidingWindowSize(slidingWindowSize)
                .minimumNumberOfCalls(minimumNumberOfCalls)
                .failureRateThreshold(failureRateThreshold)
                .waitDurationInOpenState(Duration.ofSeconds(waitDurationOpenSeconds))
                .permittedNumberOfCallsInHalfOpenState(permittedCallsHalfOpen)
                .build();
        return CircuitBreakerRegistry.of(config);
    }

    /**
     * Exposes circuit breaker state/metrics (e.g. {@code resilience4j_circuitbreaker_state})
     * to the existing Prometheus registry so an open AI breaker is observable/alertable.
     */
    @Bean
    public MeterBinder aiCircuitBreakerMetrics(CircuitBreakerRegistry aiCircuitBreakerRegistry) {
        return meterRegistry -> TaggedCircuitBreakerMetrics
                .ofCircuitBreakerRegistry(aiCircuitBreakerRegistry)
                .bindTo(meterRegistry);
    }

    /**
     * Shared RestTemplate with explicit connect/read timeouts. Used for all
     * outbound calls to the Python AI service and external APIs so a slow or
     * sleeping upstream cannot exhaust the servlet thread pool by hanging
     * indefinitely. The {@link AiResilienceInterceptor} adds a per-host circuit
     * breaker so sustained failures fail fast instead of queueing behind the timeout.
     */
    @Bean
    public RestTemplate restTemplate(CircuitBreakerRegistry aiCircuitBreakerRegistry) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);   // 10s to establish a connection
        factory.setReadTimeout(120_000);     // 120s for heavy AI analysis responses
        RestTemplate restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add(new AiResilienceInterceptor(aiCircuitBreakerRegistry));
        return restTemplate;
    }
}
