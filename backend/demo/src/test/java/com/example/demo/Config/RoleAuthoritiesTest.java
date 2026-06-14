package com.example.demo.Config;

import com.example.demo.Classes.User;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the User -> role-authority mapping that underpins RBAC. The original
 * bug shipped every user with an empty authority list, so these assertions guard
 * against a regression to "no roles".
 */
class RoleAuthoritiesTest {

    @Test
    void everyUserIsAtLeastCitizen() {
        List<String> roles = RoleAuthorities.roleNames(new User());
        assertTrue(roles.contains(RoleAuthorities.ROLE_CITIZEN));
        assertFalse(roles.contains(RoleAuthorities.ROLE_JUDGE));
        assertFalse(roles.contains(RoleAuthorities.ROLE_LAWYER));
    }

    @Test
    void nullUserDefaultsToCitizen() {
        List<String> roles = RoleAuthorities.roleNames(null);
        assertEquals(List.of(RoleAuthorities.ROLE_CITIZEN), roles);
    }

    @Test
    void judgeFlagGrantsJudgeRole() {
        User user = new User();
        user.setIsJudge(true);
        List<String> roles = RoleAuthorities.roleNames(user);
        assertTrue(roles.contains(RoleAuthorities.ROLE_JUDGE));
        assertTrue(roles.contains(RoleAuthorities.ROLE_CITIZEN));
    }

    @Test
    void lawyerFlagGrantsLawyerRole() {
        User user = new User();
        user.setIsLawyer(true);
        assertTrue(RoleAuthorities.roleNames(user).contains(RoleAuthorities.ROLE_LAWYER));
    }

    @Test
    void judgeRoleEnumGrantsJudgeRoleWithoutFlag() {
        User user = new User();
        user.setRole(User.UserRole.HIGH_COURT_JUDGE);
        assertTrue(RoleAuthorities.roleNames(user).contains(RoleAuthorities.ROLE_JUDGE));
    }

    @Test
    void adminRoleEnumGrantsAdminRole() {
        User user = new User();
        user.setRole(User.UserRole.ADMIN);
        assertTrue(RoleAuthorities.roleNames(user).contains(RoleAuthorities.ROLE_ADMIN));
    }

    @Test
    void authoritiesMirrorRoleNames() {
        User user = new User();
        user.setIsJudge(true);
        List<String> authorityStrings = RoleAuthorities.authorities(user).stream()
                .map(a -> a.getAuthority())
                .toList();
        assertTrue(authorityStrings.contains(RoleAuthorities.ROLE_JUDGE));
        assertTrue(authorityStrings.contains(RoleAuthorities.ROLE_CITIZEN));
    }
}
