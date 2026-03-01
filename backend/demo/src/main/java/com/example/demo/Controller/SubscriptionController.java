package com.example.demo.Controller;

import com.example.demo.Classes.*;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Implementation.SubscriptionService;
import com.example.demo.Repository.UserAll;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.*;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class SubscriptionController {
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    @Autowired
    private UserAll userRepository;
    
    @Value("${razorpay.key.id:}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret:}")
    private String razorpayKeySecret;
    
    /**
     * Get all available subscription plans
     */
    @GetMapping("/plans")
    public ResponseEntity<?> getPlans() {
        try {
            List<Map<String, Object>> plans = subscriptionService.getAvailablePlans();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "plans", plans
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Check user's current access status
     */
    @GetMapping("/access")
    public ResponseEntity<?> checkAccess(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            Map<String, Object> access = subscriptionService.checkAccess(user);
            return ResponseEntity.ok(access);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Get user's subscription history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            List<Subscription> history = subscriptionService.getSubscriptionHistory(user);
            
            // Convert to DTOs to avoid lazy loading issues
            List<Map<String, Object>> historyDtos = new ArrayList<>();
            for (Subscription sub : history) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", sub.getId());
                dto.put("plan", sub.getPlan().getDisplayName());
                dto.put("planId", sub.getPlan().name());
                dto.put("status", sub.getStatus().name());
                dto.put("amount", sub.getAmount());
                dto.put("currency", sub.getCurrency());
                dto.put("startDate", sub.getStartDate());
                dto.put("endDate", sub.getEndDate());
                dto.put("queriesAllowed", sub.getAiQueriesAllowed());
                dto.put("queriesUsed", sub.getAiQueriesUsed());
                dto.put("queriesRemaining", sub.getRemainingQueries());
                dto.put("isActive", sub.isActive());
                dto.put("createdAt", sub.getCreatedAt());
                historyDtos.add(dto);
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "subscriptions", historyDtos
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Create a Razorpay order for subscription
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, String> request) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            String planId = request.get("planId");
            if (planId == null || planId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Plan ID is required"
                ));
            }
            
            SubscriptionPlan plan;
            try {
                plan = SubscriptionPlan.valueOf(planId.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid plan ID"
                ));
            }
            
            // Check if Razorpay is configured
            if (razorpayKeyId == null || razorpayKeyId.isEmpty() || 
                razorpayKeySecret == null || razorpayKeySecret.isEmpty()) {
                // Development mode - create mock order
                String mockOrderId = "order_" + UUID.randomUUID().toString().substring(0, 16);
                
                Subscription subscription = subscriptionService.createPendingSubscription(user, plan, mockOrderId);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "orderId", mockOrderId,
                    "subscriptionId", subscription.getId(),
                    "amount", (int)(plan.getPrice() * 100), // In paise
                    "currency", "INR",
                    "planName", plan.getDisplayName(),
                    "keyId", "rzp_test_placeholder",
                    "mode", "development"
                ));
            }
            
            // Production mode - create Razorpay order
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", (int)(plan.getPrice() * 100)); // Amount in paise
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "sub_" + user.getId() + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);
            
            JSONObject notes = new JSONObject();
            notes.put("userId", user.getId());
            notes.put("userEmail", user.getEmail());
            notes.put("planId", plan.name());
            orderRequest.put("notes", notes);
            
            Order order = razorpay.orders.create(orderRequest);
            String orderId = order.get("id");
            
            // Create pending subscription
            Subscription subscription = subscriptionService.createPendingSubscription(user, plan, orderId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "orderId", orderId,
                "subscriptionId", subscription.getId(),
                "amount", order.get("amount"),
                "currency", order.get("currency"),
                "planName", plan.getDisplayName(),
                "keyId", razorpayKeyId,
                "mode", "production"
            ));
            
        } catch (RazorpayException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Payment gateway error: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Verify payment and activate subscription
     */
    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(
            @RequestHeader("Authorization") String jwt,
            @RequestBody Map<String, String> request) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            String orderId = request.get("orderId");
            String paymentId = request.get("paymentId");
            String signature = request.get("signature");
            String paymentMethod = request.get("paymentMethod");
            
            if (orderId == null || paymentId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Order ID and Payment ID are required"
                ));
            }
            
            // Development mode - skip signature verification
            if (razorpayKeySecret == null || razorpayKeySecret.isEmpty() || 
                orderId.startsWith("order_")) {
                Subscription subscription = subscriptionService.activateSubscription(
                    orderId, paymentId, signature, paymentMethod != null ? paymentMethod : "test"
                );
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Subscription activated successfully",
                    "subscriptionId", subscription.getId(),
                    "plan", subscription.getPlan().getDisplayName(),
                    "validUntil", subscription.getEndDate()
                ));
            }
            
            // Production mode - verify signature
            String generatedSignature = generateRazorpaySignature(orderId, paymentId, razorpayKeySecret);
            
            if (!generatedSignature.equals(signature)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Payment verification failed"
                ));
            }
            
            Subscription subscription = subscriptionService.activateSubscription(
                orderId, paymentId, signature, paymentMethod
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subscription activated successfully",
                "subscriptionId", subscription.getId(),
                "plan", subscription.getPlan().getDisplayName(),
                "validUntil", subscription.getEndDate()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Cancel subscription
     */
    @PostMapping("/{subscriptionId}/cancel")
    public ResponseEntity<?> cancelSubscription(
            @RequestHeader("Authorization") String jwt,
            @PathVariable Long subscriptionId) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            Subscription subscription = subscriptionService.cancelSubscription(subscriptionId, user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Subscription cancelled successfully",
                "subscriptionId", subscription.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Use an AI query (to be called before each AI request)
     */
    @PostMapping("/use-query")
    public ResponseEntity<?> useQuery(@RequestHeader("Authorization") String jwt) {
        try {
            String email = JwtProvider.getEmailFromJwt(jwt);
            User user = userRepository.searchByEmail(email);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not found"));
            }
            
            Map<String, Object> result = subscriptionService.useAIQuery(user);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(result);
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Razorpay webhook handler
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestBody String payload) {
        try {
            // Log webhook for debugging
            System.out.println("Received Razorpay webhook: " + payload);
            
            // In production, verify webhook signature
            // For now, just acknowledge receipt
            
            return ResponseEntity.ok(Map.of("status", "received"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Generate Razorpay signature for verification
     */
    private String generateRazorpaySignature(String orderId, String paymentId, String secret) {
        try {
            String data = orderId + "|" + paymentId;
            Mac sha256Hmac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            sha256Hmac.init(secretKey);
            byte[] hash = sha256Hmac.doFinal(data.getBytes());
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating signature", e);
        }
    }
}
