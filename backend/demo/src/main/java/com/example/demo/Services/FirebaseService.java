package com.example.demo.Services;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Firebase service for phone authentication
 * Uses Firebase's free tier for phone OTP verification
 */
@Service
public class FirebaseService {

    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

    @Value("${firebase.credentials.path:}")
    private String firebaseCredentialsPath;

    @Value("${firebase.credentials.json:}")
    private String firebaseCredentialsJson;

    @Value("${firebase.project.id:}")
    private String firebaseProjectId;

    private boolean initialized = false;

    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseOptions options;
                
                if (firebaseCredentialsJson != null && !firebaseCredentialsJson.isEmpty()) {
                    // Use JSON string from environment variable
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(
                                    new ByteArrayInputStream(firebaseCredentialsJson.getBytes(StandardCharsets.UTF_8))))
                            .build();
                    FirebaseApp.initializeApp(options);
                    initialized = true;
                    logger.info("Firebase initialized with credentials JSON");
                } else if (firebaseCredentialsPath != null && !firebaseCredentialsPath.isEmpty()) {
                    // Use file path
                    options = FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(
                                    new FileInputStream(firebaseCredentialsPath)))
                            .build();
                    FirebaseApp.initializeApp(options);
                    initialized = true;
                    logger.info("Firebase initialized with credentials file");
                } else {
                    logger.warn("Firebase credentials not configured - running in development mode");
                    initialized = false;
                }
            } else {
                initialized = true;
            }
        } catch (IOException e) {
            logger.error("Failed to initialize Firebase", e);
            initialized = false;
        }
    }

    /**
     * Verify a Firebase ID token from phone authentication
     * @param idToken The Firebase ID token from client
     * @return Map containing uid and phone number if valid, null if invalid
     */
    public Map<String, String> verifyPhoneToken(String idToken) {
        if (!initialized) {
            // Development mode - accept any token and return mock data
            logger.warn("Firebase not configured; accepting phone token without verification (development mode).");
            Map<String, String> result = new HashMap<>();
            result.put("uid", "dev_" + System.currentTimeMillis());
            result.put("phoneNumber", "+91XXXXXXXXXX");
            return result;
        }

        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            String phoneNumber = (String) decodedToken.getClaims().get("phone_number");

            if (phoneNumber == null) {
                logger.warn("Firebase token does not contain a phone number");
                return null;
            }

            Map<String, String> result = new HashMap<>();
            result.put("uid", uid);
            result.put("phoneNumber", phoneNumber);
            return result;
        } catch (FirebaseAuthException e) {
            logger.error("Failed to verify Firebase token", e);
            return null;
        }
    }

    /**
     * Check if Firebase is properly configured
     */
    public boolean isConfigured() {
        return initialized;
    }

    /**
     * Get Firebase configuration for frontend
     * Returns config needed for Firebase SDK initialization
     */
    public Map<String, Object> getClientConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("projectId", firebaseProjectId);
        config.put("configured", initialized);
        return config;
    }
}
