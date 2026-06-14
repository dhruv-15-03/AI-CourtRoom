package com.example.demo;

import com.example.demo.Config.JwtProvider;
import com.example.demo.Config.RoleAuthorities;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end RBAC checks against the real security filter chain. A token's role
 * authorities (embedded by {@link JwtProvider} at login) must gate the
 * role-restricted controllers. The original code left authorities empty, so
 * {@code @PreAuthorize("hasRole('JUDGE')")} could never have passed or failed
 * meaningfully.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RbacIntegrationTest {

    static {
        if (System.getenv("JWT_SECRET") == null && System.getProperty("JWT_SECRET") == null) {
            System.setProperty("JWT_SECRET", "test-only-jwt-secret-please-override-0123456789");
        }
    }

    @Autowired
    private MockMvc mockMvc;

    private static String tokenFor(String email, String... authorities) {
        List<SimpleGrantedAuthority> granted = java.util.Arrays.stream(authorities)
                .map(SimpleGrantedAuthority::new)
                .toList();
        Authentication auth = new UsernamePasswordAuthenticationToken(email, null, granted);
        return JwtProvider.generateToken(auth);
    }

    @Test
    void judgeEndpoint_withoutAuthentication_isForbidden() throws Exception {
        mockMvc.perform(get("/api/judge/dashboard"))
                .andExpect(status().isForbidden());
    }

    @Test
    void judgeEndpoint_withCitizenRole_isForbidden() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/judge/dashboard").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void lawyerEndpoint_withCitizenRole_isForbidden() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/lawyer/dashboard").header("Authorization", token))
                .andExpect(status().isForbidden());
    }

    @Test
    void judgeEndpoint_withJudgeRole_passesAuthorization() throws Exception {
        String token = tokenFor("judge@test.com", RoleAuthorities.ROLE_JUDGE, RoleAuthorities.ROLE_CITIZEN);
        // The judge role clears @PreAuthorize; the handler may still fail because
        // no matching user exists in the empty H2 schema, but it must NOT be a 403.
        mockMvc.perform(get("/api/judge/dashboard").header("Authorization", token))
                .andExpect(result -> assertNotEquals(403, result.getResponse().getStatus()));
    }
}
