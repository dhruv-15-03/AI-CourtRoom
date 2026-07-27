package com.example.demo.Config;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DemoUserSeederTest {

    @Test
    void createsDocumentedAccountsAsVerifiedUsers() {
        UserAll repository = mock(UserAll.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        Map<String, User> stored = new HashMap<>();

        when(repository.searchByEmail(any())).thenAnswer(invocation ->
                stored.get(invocation.getArgument(0, String.class)));
        when(repository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0, User.class);
            stored.put(user.getEmail(), user);
            return user;
        });
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");

        new DemoUserSeeder(repository, passwordEncoder, "password123").run(null);

        assertEquals(3, stored.size());
        assertAccount(stored.get("user@example.com"), User.UserRole.CITIZEN, false, false);
        assertAccount(stored.get("lawyer@example.com"), User.UserRole.ADVOCATE, true, false);
        assertAccount(stored.get("judge@example.com"), User.UserRole.JUDGE, false, true);
        verify(passwordEncoder, times(3)).encode("password123");
    }

    @Test
    void repairsExistingAccountCredentialsAndVerificationState() {
        UserAll repository = mock(UserAll.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        User existingUser = new User();
        existingUser.setEmail("user@example.com");
        existingUser.setPassword("stale-password");
        existingUser.setIsVerified(false);

        when(repository.searchByEmail("user@example.com")).thenReturn(existingUser);
        when(repository.save(any(User.class))).thenAnswer(invocation ->
                invocation.getArgument(0, User.class));
        when(passwordEncoder.encode("password123")).thenReturn("encoded-password");

        new DemoUserSeeder(repository, passwordEncoder, "password123").run(null);

        assertAccount(existingUser, User.UserRole.CITIZEN, false, false);
        verify(repository, times(5)).save(any(User.class));
    }

    private void assertAccount(
            User user,
            User.UserRole role,
            boolean lawyer,
            boolean judge) {
        assertEquals(role, user.getRole());
        assertEquals("encoded-password", user.getPassword());
        assertEquals(lawyer, user.getIsLawyer());
        assertEquals(judge, user.getIsJudge());
        assertTrue(user.getIsActive());
        assertTrue(user.getEmailVerified());
        assertTrue(user.getMobileVerified());
        assertTrue(user.getIsVerified());
        assertFalse(user.getFirstName().isBlank());
        assertFalse(user.getLastName().isBlank());
    }
}
