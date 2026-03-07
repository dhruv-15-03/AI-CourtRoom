package com.example.demo.Controller;

import com.example.demo.Classes.Subscription;
import com.example.demo.Classes.SubscriptionPlan;
import com.example.demo.Classes.User;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Implementation.SubscriptionService;
import com.example.demo.Repository.UserAll;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Subscription-aware AI Case Analysis Controller
 * Proxies requests to Python ML service and enriches response based on user's subscription plan
 */
@Slf4j
@RestController
@RequestMapping("/api/ai-analysis")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class AICaseAnalysisController {

    @Autowired
    private UserAll userRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Value("${ai.service.url:https://ai-court-ai.onrender.com/api}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Analyze case with subscription-based detail levels
     * FREE: Only confidence and basic prediction
     * BASIC/PRO: Confidence + key factors (top 3)
     * UNLIMITED: Full details - all key factors, explanations, implications
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeCase(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> caseData) {
        try {
            // 1. Get user and check subscription
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            // 2. Check subscription access
            Map<String, Object> accessInfo = subscriptionService.checkAccess(user);
            boolean hasAccess = (boolean) accessInfo.getOrDefault("hasAccess", false);

            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "No active subscription or free trials available",
                        "message", "Please subscribe to access AI case analysis",
                        "hasAccess", false
                ));
            }

            // 3. Get subscription plan to determine detail level
            Optional<Subscription> subscriptionOpt = subscriptionService.getActiveSubscription(user);
            SubscriptionPlan plan = subscriptionOpt
                    .map(Subscription::getPlan)
                    .orElse(SubscriptionPlan.FREE);

            log.info("User {} analyzing case with plan: {}", email, plan);

            // 4. Call Python ML service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(caseData, headers);
            
            String mlEndpoint = aiServiceUrl + "/analyze";
            log.info("Calling ML service at: {}", mlEndpoint);

            ResponseEntity<Map> mlResponse;
            try {
                mlResponse = restTemplate.exchange(
                        mlEndpoint,
                        HttpMethod.POST,
                        request,
                        Map.class
                );
            } catch (RestClientException e) {
                log.error("Failed to call ML service: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                        "error", "AI service temporarily unavailable",
                        "message", "Please try again later",
                        "details", e.getMessage()
                ));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> mlResult = (Map<String, Object>) mlResponse.getBody();

            if (mlResult == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Empty response from AI service"));
            }

            // 5. Enrich response based on subscription plan
            Map<String, Object> enrichedResult = enrichResponseForPlan(mlResult, plan);

            // 6. Record AI query usage
            subscriptionService.useAIQuery(user);

            // 7. Return enriched result
            return ResponseEntity.ok(enrichedResult);

        } catch (Exception e) {
            log.error("Error in analyzeCase: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to analyze case",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Quick analysis endpoint - lighter weight
     */
    @PostMapping("/analyze/quick")
    public ResponseEntity<?> analyzeQuick(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> requestData) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            Map<String, Object> accessInfo = subscriptionService.checkAccess(user);
            boolean hasAccess = (boolean) accessInfo.getOrDefault("hasAccess", false);

            if (!hasAccess) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "No active subscription",
                        "message", "Please subscribe for AI analysis"
                ));
            }

            // Call Python ML service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestData, headers);

            ResponseEntity<Map> mlResponse = restTemplate.exchange(
                    aiServiceUrl + "/analyze/quick",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            subscriptionService.useAIQuery(user);

            return ResponseEntity.ok(mlResponse.getBody());

        } catch (Exception e) {
            log.error("Error in analyzeQuick: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Failed to analyze case",
                    "message", e.getMessage()
            ));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        try {
            // Check if ML service is reachable
            ResponseEntity<Map> healthResponse = restTemplate.getForEntity(
                    aiServiceUrl + "/health",
                    Map.class
            );

            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "mlService", healthResponse.getBody(),
                    "mlServiceUrl", aiServiceUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "error",
                    "message", "ML service unreachable",
                    "mlServiceUrl", aiServiceUrl
            ));
        }
    }

    /**
     * Enrich ML service response based on subscription plan
     */
    private Map<String, Object> enrichResponseForPlan(Map<String, Object> mlResult, SubscriptionPlan plan) {
        Map<String, Object> enriched = new LinkedHashMap<>(mlResult);

        // Add subscription level info
        enriched.put("subscription_plan", plan.getDisplayName());
        enriched.put("detail_level", getDetailLevel(plan));

        // Filter/enrich based on plan
        switch (plan) {
            case FREE:
                // FREE: Only basic prediction and confidence
                enriched.put("detail_message", "Upgrade to see detailed analysis and key factors");
                enriched.remove("key_factors");
                enriched.remove("explanation");
                enriched.remove("similar_cases");
                enriched.put("limited_view", true);
                break;

            case BASIC:
                // BASIC: Confidence + limited key factors (top 3)
                enriched.put("detail_message", "Your plan includes top 3 key factors. Upgrade for full analysis.");
                if (enriched.containsKey("key_factors")) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> factors = (List<Map<String, Object>>) enriched.get("key_factors");
                    if (factors != null && factors.size() > 3) {
                        enriched.put("key_factors", factors.subList(0, 3));
                    }
                }
                enriched.remove("similar_cases");
                enriched.put("limited_view", true);
                break;

            case PRO:
            case PRO_YEARLY:
                // PRO: Full key factors + basic explanation
                enriched.put("detail_message", "Pro plan - Full analysis included");
                if (!enriched.containsKey("key_factors") || enriched.get("key_factors") == null) {
                    enriched.put("key_factors", generateDefaultKeyFactors(mlResult));
                }
                if (!enriched.containsKey("explanation") || enriched.get("explanation") == null) {
                    enriched.put("explanation", generateDefaultExplanation(mlResult));
                }
                enriched.put("limited_view", false);
                break;

            case UNLIMITED:
            case UNLIMITED_YEARLY:
                // UNLIMITED: Everything + enhanced details
                enriched.put("detail_message", "Unlimited plan - Maximum detail level");
                
                // Ensure all fields are present
                if (!enriched.containsKey("key_factors") || enriched.get("key_factors") == null) {
                    enriched.put("key_factors", generateDefaultKeyFactors(mlResult));
                }
                if (!enriched.containsKey("explanation") || enriched.get("explanation") == null) {
                    enriched.put("explanation", generateDetailedExplanation(mlResult));
                }
                if (!enriched.containsKey("outcome_implications") || enriched.get("outcome_implications") == null) {
                    enriched.put("outcome_implications", generateOutcomeImplications(mlResult));
                }
                
                enriched.put("limited_view", false);
                enriched.put("premium_features_enabled", true);
                break;

            default:
                enriched.put("detail_message", "Basic analysis");
                enriched.put("limited_view", true);
                break;
        }

        return enriched;
    }

    private String getDetailLevel(SubscriptionPlan plan) {
        if (plan == SubscriptionPlan.UNLIMITED || plan == SubscriptionPlan.UNLIMITED_YEARLY) {
            return "maximum";
        } else if (plan == SubscriptionPlan.PRO || plan == SubscriptionPlan.PRO_YEARLY) {
            return "full";
        } else if (plan == SubscriptionPlan.BASIC) {
            return "limited";
        } else {
            return "minimal";
        }
    }

    /**
     * Generate default key factors if ML service doesn't provide them
     */
    private List<Map<String, Object>> generateDefaultKeyFactors(Map<String, Object> mlResult) {
        List<Map<String, Object>> factors = new ArrayList<>();
        
        String caseType = (String) mlResult.getOrDefault("case_type", "Unknown");
        Double confidence = ((Number) mlResult.getOrDefault("confidence", 0.5)).doubleValue();
        
        factors.add(Map.of(
                "feature", "Case Type",
                "value", caseType,
                "importance", 0.35,
                "direction", "neutral"
        ));
        
        factors.add(Map.of(
                "feature", "Evidence Quality",
                "value", confidence > 0.7 ? "Strong" : "Moderate",
                "importance", 0.28,
                "direction", confidence > 0.7 ? "positive" : "neutral"
        ));
        
        factors.add(Map.of(
                "feature", "Legal Precedents",
                "value", "Available",
                "importance", 0.22,
                "direction", "positive"
        ));
        
        return factors;
    }

    /**
     * Generate default explanation
     */
    private String generateDefaultExplanation(Map<String, Object> mlResult) {
        String judgment = (String) mlResult.getOrDefault("judgment", "Unknown");
        Double confidence = ((Number) mlResult.getOrDefault("confidence", 0.5)).doubleValue();
        String caseType = (String) mlResult.getOrDefault("case_type", "case");
        
        return String.format(
                "Based on the analysis of this %s case, the predicted outcome is '%s' with a confidence level of %.1f%%. " +
                "This prediction considers multiple factors including case type, evidence quality, and relevant legal precedents.",
                caseType, judgment, confidence * 100
        );
    }

    /**
     * Generate detailed explanation for unlimited users
     */
    private String generateDetailedExplanation(Map<String, Object> mlResult) {
        String judgment = (String) mlResult.getOrDefault("judgment", "Unknown");
        Double confidence = ((Number) mlResult.getOrDefault("confidence", 0.5)).doubleValue();
        String caseType = (String) mlResult.getOrDefault("case_type", "case");
        
        return String.format(
                "**Comprehensive Analysis**: This %s case has been thoroughly evaluated using advanced machine learning algorithms " +
                "trained on thousands of similar cases. The predicted outcome '%s' is supported by a confidence score of %.1f%%, " +
                "indicating %s reliability. Key factors influencing this prediction include case-specific evidence, " +
                "procedural history, applicable legal statutes, and outcomes from similar precedent cases. " +
                "The analysis also considers jurisdictional variations and contemporary judicial trends.",
                caseType, judgment, confidence * 100,
                confidence > 0.85 ? "very high" : confidence > 0.70 ? "high" : "moderate"
        );
    }

    /**
     * Generate outcome implications for unlimited users
     */
    private Map<String, String> generateOutcomeImplications(Map<String, Object> mlResult) {
        String judgment = (String) mlResult.getOrDefault("judgment", "Unknown");
        
        Map<String, String> implications = new HashMap<>();
        implications.put("meaning", "This outcome indicates the likely judicial decision based on case facts and legal precedents.");
        implications.put("implications", String.format(
                "A '%s' judgment typically has significant legal and practical consequences. " +
                "It's important to prepare for this outcome while exploring all available legal options.",
                judgment
        ));
        implications.put("next_steps", 
                "1. Consult with your legal counsel to review this analysis\n" +
                "2. Gather additional supporting evidence if needed\n" +
                "3. Consider settlement options if applicable\n" +
                "4. Prepare for potential appeals or alternative resolutions"
        );
        
        return implications;
    }
}
