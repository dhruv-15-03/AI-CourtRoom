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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B-3 — verifies the list endpoints support opt-in {@code Pageable} pagination
 * while remaining backward compatible with the legacy bare-array shape.
 *
 * <p>When {@code ?page=} (or {@code ?size=}) is supplied the endpoint returns
 * the same envelope established by {@code AuditController}
 * ({@code content / totalPages / totalElements / page / size}). Without those
 * params it still returns a JSON array, now served from a bounded query.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PaginationIntegrationTest {

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
    void casesAll_withPageParam_returnsPaginationEnvelope() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/cases/all?page=0&size=5").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").exists())
                .andExpect(jsonPath("$.totalPages").exists())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    void casesAll_withoutPageParam_returnsLegacyArray() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/cases/all").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void lawyers_withPageParam_returnsPaginationEnvelope() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/user/lawyers?page=0&size=5").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(5));
    }

    @Test
    void lawyers_withoutPageParam_returnsLegacyArray() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/user/lawyers").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void casesAll_sizeAboveMax_isClampedToHundred() throws Exception {
        String token = tokenFor("citizen@test.com", RoleAuthorities.ROLE_CITIZEN);
        mockMvc.perform(get("/api/cases/all?page=0&size=9999").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }
}
