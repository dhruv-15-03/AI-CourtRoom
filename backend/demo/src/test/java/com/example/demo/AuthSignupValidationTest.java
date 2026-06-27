package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies Bean Validation (@Valid) on POST /auth/signup. Malformed registration
 * payloads must be rejected with a clean 400 (shaped by {@code GlobalExceptionHandler})
 * before any persistence or e-mail side effect runs, instead of slipping through to
 * the database or surfacing as a generic 500.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthSignupValidationTest {

    static {
        if (System.getenv("JWT_SECRET") == null && System.getProperty("JWT_SECRET") == null) {
            System.setProperty("JWT_SECRET", "test-only-jwt-secret-please-override-0123456789");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Test
    void signup_withBlankEmail_returns400WithFieldError() throws Exception {
        String body = """
                {"email":"","password":"longenough","role":"CITIZEN"}
                """;
        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.details.email").exists());
    }

    @Test
    void signup_withShortPassword_returns400WithFieldError() throws Exception {
        String body = """
                {"email":"new.user@example.com","password":"short","role":"CITIZEN"}
                """;
        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    void signup_withMissingRole_returns400WithFieldError() throws Exception {
        String body = """
                {"email":"another.user@example.com","password":"longenough"}
                """;
        mockMvc.perform(post("/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.role").exists());
    }
}
