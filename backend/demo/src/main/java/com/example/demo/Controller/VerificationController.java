package com.example.demo.Controller;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import com.example.demo.Services.EmailService;
import com.example.demo.Services.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for email and mobile verification
 */
@RestController
@RequestMapping("/api/verification")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class VerificationController {

    @Autowired
    private UserAll userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FirebaseService firebaseService;

    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int OTP_VALIDITY_MINUTES = 10;

    /**
     * Helper: find user by email using existing repository method
     */
    private User findUserByEmail(String email) {
        return userRepository.searchByEmail(email);
    }

    /**
     * Send email OTP for verification
     */
    @PostMapping("/send-email-otp")
    public ResponseEntity<Map<String, Object>> sendEmailOTP(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            response.put("success", false);
            response.put("error", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        User user = findUserByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("error", "User not found with this email");
            return ResponseEntity.badRequest().body(response);
        }

        // Check if already verified
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            response.put("success", false);
            response.put("error", "Email is already verified");
            return ResponseEntity.badRequest().body(response);
        }

        // Check OTP attempts
        if (user.getEmailOtpAttempts() != null && user.getEmailOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            // Reset attempts after 1 hour
            if (user.getEmailOtpExpiry() != null && 
                user.getEmailOtpExpiry().plusHours(1).isAfter(LocalDateTime.now())) {
                response.put("success", false);
                response.put("error", "Too many attempts. Please try again later.");
                return ResponseEntity.badRequest().body(response);
            } else {
                user.setEmailOtpAttempts(0);
            }
        }

        // Generate and send OTP
        String otp = emailService.generateOTP();
        user.setEmailOtp(otp);
        user.setEmailOtpExpiry(LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES));
        user.setEmailOtpAttempts(0);
        userRepository.save(user);

        String userName = user.getFirstName() != null ? user.getFirstName() : "User";
        boolean sent = emailService.sendOTPEmail(email, otp, userName);

        if (sent) {
            response.put("success", true);
            response.put("message", "OTP sent to your email");
            response.put("otpValidMinutes", OTP_VALIDITY_MINUTES);
        } else {
            response.put("success", false);
            response.put("error", "Failed to send OTP. Please try again.");
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Verify email OTP
     */
    @PostMapping("/verify-email-otp")
    public ResponseEntity<Map<String, Object>> verifyEmailOTP(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String email = request.get("email");
        String otp = request.get("otp");

        if (email == null || otp == null) {
            response.put("success", false);
            response.put("error", "Email and OTP are required");
            return ResponseEntity.badRequest().body(response);
        }

        User user = findUserByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        // Already verified
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            response.put("success", true);
            response.put("message", "Email already verified");
            response.put("emailVerified", true);
            response.put("mobileVerified", user.getMobileVerified());
            return ResponseEntity.ok(response);
        }

        // Check attempts
        int attempts = user.getEmailOtpAttempts() != null ? user.getEmailOtpAttempts() : 0;
        if (attempts >= MAX_OTP_ATTEMPTS) {
            response.put("success", false);
            response.put("error", "Too many failed attempts. Please request a new OTP.");
            return ResponseEntity.badRequest().body(response);
        }

        // Check expiry
        if (user.getEmailOtpExpiry() == null || user.getEmailOtpExpiry().isBefore(LocalDateTime.now())) {
            response.put("success", false);
            response.put("error", "OTP has expired. Please request a new one.");
            return ResponseEntity.badRequest().body(response);
        }

        // Verify OTP
        if (otp.equals(user.getEmailOtp())) {
            user.setEmailVerified(true);
            user.setEmailOtp(null);
            user.setEmailOtpExpiry(null);
            user.setEmailOtpAttempts(0);
            
            // Check if fully verified
            if (Boolean.TRUE.equals(user.getMobileVerified())) {
                user.setIsVerified(true);
            }
            
            userRepository.save(user);

            response.put("success", true);
            response.put("message", "Email verified successfully");
            response.put("emailVerified", true);
            response.put("mobileVerified", user.getMobileVerified());
            response.put("fullyVerified", user.getIsVerified());
        } else {
            user.setEmailOtpAttempts(attempts + 1);
            userRepository.save(user);

            response.put("success", false);
            response.put("error", "Invalid OTP");
            response.put("attemptsRemaining", MAX_OTP_ATTEMPTS - attempts - 1);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Verify mobile number using Firebase token
     */
    @PostMapping("/verify-mobile")
    public ResponseEntity<Map<String, Object>> verifyMobile(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String email = request.get("email");
        String firebaseToken = request.get("firebaseToken");
        String mobile = request.get("mobile");

        if (email == null || firebaseToken == null) {
            response.put("success", false);
            response.put("error", "Email and Firebase token are required");
            return ResponseEntity.badRequest().body(response);
        }

        User user = findUserByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        // Verify Firebase token
        Map<String, String> tokenData = firebaseService.verifyPhoneToken(firebaseToken);
        if (tokenData == null) {
            response.put("success", false);
            response.put("error", "Invalid or expired verification token");
            return ResponseEntity.badRequest().body(response);
        }

        // Update user
        user.setMobileVerified(true);
        user.setFirebaseUid(tokenData.get("uid"));
        
        // Update mobile if provided from Firebase
        if (mobile != null && !mobile.isEmpty()) {
            try {
                user.setMobile(Long.parseLong(mobile.replaceAll("[^0-9]", "")));
            } catch (NumberFormatException e) {
                // Keep existing mobile
            }
        }

        // Check if fully verified
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setIsVerified(true);
        }

        userRepository.save(user);

        // Send welcome email if fully verified
        if (Boolean.TRUE.equals(user.getIsVerified())) {
            String userName = user.getFirstName() != null ? user.getFirstName() : "User";
            emailService.sendWelcomeEmail(user.getEmail(), userName);
        }

        response.put("success", true);
        response.put("message", "Mobile verified successfully");
        response.put("emailVerified", user.getEmailVerified());
        response.put("mobileVerified", true);
        response.put("fullyVerified", user.getIsVerified());

        return ResponseEntity.ok(response);
    }

    /**
     * Check verification status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getVerificationStatus(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        
        User user = findUserByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        response.put("success", true);
        response.put("emailVerified", Boolean.TRUE.equals(user.getEmailVerified()));
        response.put("mobileVerified", Boolean.TRUE.equals(user.getMobileVerified()));
        response.put("fullyVerified", Boolean.TRUE.equals(user.getIsVerified()));
        response.put("firebaseConfigured", firebaseService.isConfigured());

        return ResponseEntity.ok(response);
    }

    /**
     * Resend email OTP
     */
    @PostMapping("/resend-email-otp")
    public ResponseEntity<Map<String, Object>> resendEmailOTP(@RequestBody Map<String, String> request) {
        return sendEmailOTP(request);
    }

    /**
     * Get Firebase configuration for frontend
     */
    @GetMapping("/firebase-config")
    public ResponseEntity<Map<String, Object>> getFirebaseConfig() {
        return ResponseEntity.ok(firebaseService.getClientConfig());
    }

    /**
     * Skip mobile verification (for development or optional verification)
     */
    @PostMapping("/skip-mobile")
    public ResponseEntity<Map<String, Object>> skipMobileVerification(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String email = request.get("email");
        if (email == null) {
            response.put("success", false);
            response.put("error", "Email is required");
            return ResponseEntity.badRequest().body(response);
        }

        // Only allow skip in development mode (when Firebase is NOT configured)
        if (firebaseService.isConfigured()) {
            response.put("success", false);
            response.put("error", "Mobile verification is required");
            return ResponseEntity.badRequest().body(response);
        }

        User user = findUserByEmail(email);
        if (user == null) {
            response.put("success", false);
            response.put("error", "User not found");
            return ResponseEntity.badRequest().body(response);
        }

        user.setMobileVerified(true);
        
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            user.setIsVerified(true);
        }
        
        userRepository.save(user);

        response.put("success", true);
        response.put("message", "Mobile verification skipped (development mode)");
        response.put("fullyVerified", user.getIsVerified());

        return ResponseEntity.ok(response);
    }
}
