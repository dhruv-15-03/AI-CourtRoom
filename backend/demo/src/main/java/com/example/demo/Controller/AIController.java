package com.example.demo.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

/**
 * Controller for AI-powered legal assistance using Google Gemini API.
 * Configured to provide simple, child-friendly explanations in bullet points.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class AIController {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-1.5-flash}")
    private String geminiModel;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s";

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Chat endpoint for AI legal assistant
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> request) {
        try {
            log.info("Received chat request: {}", request);
            
            if (geminiApiKey == null || geminiApiKey.isBlank()) {
                log.error("Gemini API key not configured");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Gemini API key not configured. Please set GEMINI_API_KEY in .env file"));
            }

            String userMessage = (String) request.get("message");
            if (userMessage == null || userMessage.isBlank()) {
                log.warn("Empty message received");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Message is required"));
            }
            
            log.info("Processing message: {}", userMessage.substring(0, Math.min(50, userMessage.length())));

            // Create system instruction for simple, child-friendly legal explanations
            String systemPrompt = """
                You are a friendly legal assistant for kids. Your job is to explain legal concepts in the simplest way possible.
                
                Rules:
                1. Keep your ENTIRE response under 50 words maximum
                2. Use bullet points (•) to break down information
                3. Explain like you're talking to a 10-year-old
                4. Use simple words - no complex legal jargon
                5. Be friendly and encouraging
                6. If the topic is complex, give just the most important points
                
                Example format:
                • [Simple point 1]
                • [Simple point 2]
                • [Simple point 3]
                
                Keep it SHORT and SIMPLE!
                """;

            // Construct Gemini API request
            String apiUrl = String.format(GEMINI_API_URL, geminiModel, geminiApiKey);
            
            Map<String, Object> geminiRequest = new HashMap<>();
            geminiRequest.put("contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", systemPrompt + "\n\nUser question: " + userMessage)
                ))
            ));
            
            // Configure generation settings for concise responses
            geminiRequest.put("generationConfig", Map.of(
                "temperature", 0.7,
                "maxOutputTokens", 150,  // Limit output to keep it under 50 words
                "topP", 0.8,
                "topK", 40
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(geminiRequest, headers);

            // Call Gemini API - suppress warnings for dynamic JSON response parsing
            @SuppressWarnings({"unchecked", "rawtypes"})
            ResponseEntity<Map<String, Object>> response = (ResponseEntity) restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                Map.class
            );

            // Extract AI response
            Map<String, Object> responseBody = response.getBody();
            
            if (responseBody == null) {
                log.error("Gemini API returned null response body");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Empty response from AI service"));
            }
            
            log.info("Gemini API response received. Has candidates: {}", responseBody.containsKey("candidates"));
            
            if (responseBody.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                
                if (candidates == null || candidates.isEmpty()) {
                    log.warn("Gemini returned empty candidates list");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "AI returned no response candidates"));
                }
                
                Map<String, Object> candidate = candidates.get(0);
                @SuppressWarnings("unchecked")
                Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                
                if (content == null) {
                    log.warn("Candidate has no content field");
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Invalid AI response structure"));
                }
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                
                if (parts != null && !parts.isEmpty()) {
                    String aiResponse = (String) parts.get(0).get("text");
                    
                    if (aiResponse == null || aiResponse.isBlank()) {
                        log.warn("AI response text is empty");
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "AI returned empty text"));
                    }
                    
                    log.info("AI response successfully extracted, length: {}", aiResponse.length());
                    
                    return ResponseEntity.ok(Map.of(
                        "response", aiResponse,
                        "sender", "ai",
                        "model", geminiModel
                    ));
                }
            }
            
            // Log the full response for debugging
            log.error("Unexpected Gemini API response structure: {}", responseBody);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to parse AI response - unexpected format"));

        } catch (Exception e) {
            log.error("Error calling Gemini API: {} - {}", e.getClass().getSimpleName(), e.getMessage());
            
            // Return more specific error message
            String errorMsg = e.getMessage();
            if (errorMsg != null && errorMsg.contains("API key")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid Gemini API key"));
            } else if (errorMsg != null && errorMsg.contains("quota")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "API quota exceeded - please try again later"));
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "AI service temporarily unavailable"));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean isConfigured = geminiApiKey != null && !geminiApiKey.isBlank();
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "geminiConfigured", isConfigured,
            "model", geminiModel
        ));
    }
    
    /**
     * Test endpoint to verify Gemini integration
     */
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        try {
            if (geminiApiKey == null || geminiApiKey.isBlank()) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "error", "Gemini API key not configured",
                        "model", geminiModel,
                        "keyPresent", false
                    ));
            }
            
            // Test with a simple question
            String testMessage = "What is a lawyer?";
            Map<String, Object> testRequest = Map.of("message", testMessage);
            
            log.info("Testing Gemini API with model: {}", geminiModel);
            ResponseEntity<?> response = chat(testRequest);
            
            return ResponseEntity.ok(Map.of(
                "status", "Test successful",
                "model", geminiModel,
                "keyPresent", true,
                "testResponse", response.getBody()
            ));
            
        } catch (Exception e) {
            log.error("Test failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Test failed: " + e.getMessage(),
                    "model", geminiModel
                ));
        }
    }
}
