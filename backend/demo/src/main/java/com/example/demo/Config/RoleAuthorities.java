package com.example.demo.Config;

import com.example.demo.Classes.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Single source of truth for translating a {@link User} into Spring Security
 * role authorities.
 *
 * <p>Roles are coarse-grained (CITIZEN / LAWYER / JUDGE / ADMIN) and derived
 * from the persisted {@code isLawyer}/{@code isJudge} flags — the same signals
 * the controllers already trust — with the rich {@link User.UserRole} enum as a
 * fallback. Every authenticated user is at least a CITIZEN.</p>
 */
public final class RoleAuthorities {

    private RoleAuthorities() {
    }

    public static final String ROLE_CITIZEN = "ROLE_CITIZEN";
    public static final String ROLE_LAWYER = "ROLE_LAWYER";
    public static final String ROLE_JUDGE = "ROLE_JUDGE";
    public static final String ROLE_ADMIN = "ROLE_ADMIN";

    /**
     * Returns the role names (e.g. {@code ROLE_JUDGE}) that apply to the user.
     */
    public static List<String> roleNames(User user) {
        Set<String> roles = new LinkedHashSet<>();
        roles.add(ROLE_CITIZEN);
        if (user != null) {
            if (Boolean.TRUE.equals(user.getIsLawyer()) || isAdvocateRole(user.getRole())) {
                roles.add(ROLE_LAWYER);
            }
            if (Boolean.TRUE.equals(user.getIsJudge()) || isJudgeRole(user.getRole())) {
                roles.add(ROLE_JUDGE);
            }
            if (user.getRole() == User.UserRole.ADMIN) {
                roles.add(ROLE_ADMIN);
            }
        }
        return new ArrayList<>(roles);
    }

    /**
     * Returns the granted authorities that apply to the user.
     */
    public static List<GrantedAuthority> authorities(User user) {
        List<GrantedAuthority> authorities = new ArrayList<>();
        for (String role : roleNames(user)) {
            authorities.add(new SimpleGrantedAuthority(role));
        }
        return authorities;
    }

    private static boolean isJudgeRole(User.UserRole role) {
        if (role == null) {
            return false;
        }
        switch (role) {
            case JUDGE:
            case DISTRICT_JUDGE:
            case ADDITIONAL_DISTRICT_JUDGE:
            case SESSIONS_JUDGE:
            case MAGISTRATE:
            case HIGH_COURT_JUDGE:
            case CHIEF_JUSTICE_HIGH_COURT:
            case SUPREME_COURT_JUDGE:
            case CHIEF_JUSTICE_INDIA:
                return true;
            default:
                return false;
        }
    }

    private static boolean isAdvocateRole(User.UserRole role) {
        if (role == null) {
            return false;
        }
        switch (role) {
            case ADVOCATE:
            case SENIOR_ADVOCATE:
            case ADDITIONAL_SOLICITOR_GENERAL:
            case SOLICITOR_GENERAL:
            case ATTORNEY_GENERAL:
            case PUBLIC_PROSECUTOR:
                return true;
            default:
                return false;
        }
    }
}
