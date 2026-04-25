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
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * AI Agent Controller — Full AI Lawyer proxy to the Python agent service.
 *
 * Endpoints:
 *   POST /api/agent/analyze           — Full agent analysis (ML + LLM + Search + Statutes)
 *   POST /api/agent/analyze-with-docs — Full analysis with uploaded documents
 *   POST /api/agent/chat              — Follow-up chat within case session
 *   POST /api/agent/upload-documents  — Upload documents for AI reading (OCR + processing)
 *   POST /api/agent/generate-document — Generate court-ready legal documents
 *   GET  /api/agent/document-types    — List available document types
 *   GET  /api/agent/session/{id}      — Get session info
 *   GET  /api/agent/health            — Agent health check
 */
@Slf4j
@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class AIAgentController {

    @Autowired
    private UserAll userRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    @Value("${ai.service.url:https://ai-court-ai.onrender.com/api}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ── Tier Mapping ─────────────────────────────────────────────────────

    private String mapPlanToTier(SubscriptionPlan plan) {
        return switch (plan) {
            case FREE -> "free";
            case BASIC -> "unlimited";          // Single-case purchase gets full AI lawyer for that case
            case PRO, PRO_YEARLY -> "unlimited"; // Pro gets full access
            case UNLIMITED, UNLIMITED_YEARLY -> "court"; // Unlimited gets court-tier (audit trail + docs)
        };
    }

    private User authenticateUser(String jwt) {
        String email = JwtProvider.getEmailFromJwt(jwt);
        return userRepository.searchByEmail(email);
    }

    // ── POST /api/agent/analyze ──────────────────────────────────────────

    @PostMapping("/analyze")
    public ResponseEntity<?> agentAnalyze(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> body) {
        try {
            User user = authenticateUser(jwt);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            Map<String, Object> accessInfo = subscriptionService.checkAccess(user);
            if (!(boolean) accessInfo.getOrDefault("hasAccess", false)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "subscription_required",
                        "message", "Subscribe to access the AI Lawyer"
                ));
            }

            Optional<Subscription> sub = subscriptionService.getActiveSubscription(user);
            String tier = sub.map(s -> mapPlanToTier(s.getPlan())).orElse("free");

            // Build request for Python agent
            body.put("tier", tier);
            body.put("user_id", user.getId().toString());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            String endpoint = aiServiceUrl + "/agent/analyze";
            log.info("Agent analyze for user {} (tier={})", user.getEmail(), tier);

            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Map.class);
            subscriptionService.useAIQuery(user);

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("Agent service error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "agent_unavailable",
                    "message", "AI Agent service temporarily unavailable"
            ));
        } catch (Exception e) {
            log.error("Agent analyze error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "analysis_failed",
                    "message", e.getMessage()
            ));
        }
    }

    // ── POST /api/agent/analyze-with-docs ────────────────────────────────

    @PostMapping("/analyze-with-docs")
    public ResponseEntity<?> agentAnalyzeWithDocs(
            @RequestHeader("Authorization") String jwt,
            @RequestParam("query") String query,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "documents_context", required = false) String documentsContext) {
        try {
            User user = authenticateUser(jwt);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            Map<String, Object> accessInfo = subscriptionService.checkAccess(user);
            if (!(boolean) accessInfo.getOrDefault("hasAccess", false)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "subscription_required",
                        "message", "Subscribe to access the AI Lawyer"
                ));
            }

            Optional<Subscription> sub = subscriptionService.getActiveSubscription(user);
            String tier = sub.map(s -> mapPlanToTier(s.getPlan())).orElse("free");

            // Build multipart request for Python agent
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            formData.add("query", query);
            formData.add("tier", tier);
            formData.add("user_id", user.getId().toString());
            if (documentsContext != null) {
                formData.add("documents_context", documentsContext);
            }

            // Forward files
            if (files != null) {
                for (MultipartFile file : files) {
                    if (!file.isEmpty()) {
                        ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                            @Override
                            public String getFilename() {
                                return file.getOriginalFilename();
                            }
                        };
                        formData.add("files", resource);
                    }
                }
            }

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(formData, headers);
            String endpoint = aiServiceUrl + "/agent/analyze-with-docs";

            log.info("Agent analyze-with-docs for user {} (tier={}, files={})",
                    user.getEmail(), tier, files != null ? files.size() : 0);

            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Map.class);
            subscriptionService.useAIQuery(user);

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("Agent service error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "agent_unavailable",
                    "message", "AI Agent service temporarily unavailable"
            ));
        } catch (Exception e) {
            log.error("Agent analyze-with-docs error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "analysis_failed",
                    "message", e.getMessage()
            ));
        }
    }

    // ── POST /api/agent/chat ─────────────────────────────────────────────

    @PostMapping("/chat")
    public ResponseEntity<?> agentChat(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> body) {
        try {
            User user = authenticateUser(jwt);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            // Chat uses existing session — just forward to Python
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            String endpoint = aiServiceUrl + "/agent/chat";
            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Map.class);

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("Agent chat error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "agent_unavailable",
                    "message", "AI Agent temporarily unavailable"
            ));
        } catch (Exception e) {
            log.error("Agent chat error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "chat_failed",
                    "message", e.getMessage()
            ));
        }
    }

    // ── POST /api/agent/upload-documents ─────────────────────────────────

    @PostMapping("/upload-documents")
    public ResponseEntity<?> uploadDocuments(
            @RequestHeader("Authorization") String jwt,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "session_id", required = false) String sessionId) {
        try {
            User user = authenticateUser(jwt);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            // Validate file sizes and count
            if (files.size() > 20) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 20 files"));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            if (sessionId != null) {
                formData.add("session_id", sessionId);
            }

            for (MultipartFile file : files) {
                if (!file.isEmpty() && file.getSize() <= 50 * 1024 * 1024) {
                    ByteArrayResource resource = new ByteArrayResource(file.getBytes()) {
                        @Override
                        public String getFilename() {
                            return file.getOriginalFilename();
                        }
                    };
                    formData.add("files", resource);
                }
            }

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(formData, headers);
            String endpoint = aiServiceUrl + "/agent/upload-documents";

            log.info("Upload {} documents for user {}", files.size(), user.getEmail());
            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Map.class);

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("Document upload error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "service_unavailable"
            ));
        } catch (Exception e) {
            log.error("Upload error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "upload_failed",
                    "message", e.getMessage()
            ));
        }
    }

    // ── POST /api/agent/generate-document ────────────────────────────────

    @PostMapping("/generate-document")
    public ResponseEntity<?> generateDocument(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, Object> body) {
        try {
            User user = authenticateUser(jwt);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not found"));
            }

            // Check subscription — document generation requires pro+ tier
            Optional<Subscription> sub = subscriptionService.getActiveSubscription(user);
            String tier = sub.map(s -> mapPlanToTier(s.getPlan())).orElse("free");

            if ("free".equals(tier)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "upgrade_required",
                        "message", "Document generation requires a Pro or higher subscription"
                ));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            String endpoint = aiServiceUrl + "/agent/generate-document";
            log.info("Generate document type={} for user {}", body.get("doc_type"), user.getEmail());

            ResponseEntity<Map> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Map.class);
            subscriptionService.useAIQuery(user);

            return ResponseEntity.ok(response.getBody());

        } catch (RestClientException e) {
            log.error("Document generation error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "service_unavailable"
            ));
        } catch (Exception e) {
            log.error("Generate document error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "generation_failed",
                    "message", e.getMessage()
            ));
        }
    }

    // ── GET /api/agent/document-types ────────────────────────────────────

    @GetMapping("/document-types")
    public ResponseEntity<?> getDocumentTypes() {
        try {
            String endpoint = aiServiceUrl + "/agent/document-types";
            ResponseEntity<Map> response = restTemplate.getForEntity(endpoint, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            log.error("Document types error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "service_unavailable"
            ));
        }
    }

    // ── GET /api/agent/session/{id} ──────────────────────────────────────

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<?> getSession(
            @RequestHeader("Authorization") String jwt,
            @PathVariable String sessionId) {
        try {
            authenticateUser(jwt);
            String endpoint = aiServiceUrl + "/agent/session/" + sessionId;
            ResponseEntity<Map> response = restTemplate.getForEntity(endpoint, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "service_unavailable"
            ));
        }
    }

    // ── GET /api/agent/health ────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<?> agentHealth() {
        try {
            String endpoint = aiServiceUrl + "/agent/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(endpoint, Map.class);
            Map<String, Object> result = new HashMap<>(response.getBody());
            result.put("java_proxy", "healthy");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "java_proxy", "healthy",
                    "python_agent", "unavailable",
                    "error", e.getMessage()
            ));
        }
    }
}
