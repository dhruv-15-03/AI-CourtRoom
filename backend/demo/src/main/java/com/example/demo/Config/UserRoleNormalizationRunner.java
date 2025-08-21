package com.example.demo.Config;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

@Component
public class UserRoleNormalizationRunner implements CommandLineRunner {

    private final UserAll userAll;
    private final Logger logger = Logger.getLogger(UserRoleNormalizationRunner.class.getName());

    public UserRoleNormalizationRunner(UserAll userAll) {
        this.userAll = userAll;
    }

    @Override
    public void run(String... args) {
        logger.info("UserRoleNormalizationRunner starting: scanning users to ensure role flags are consistent.");
        List<User> users;
        try {
            users = userAll.findAll();
        } catch (Exception e) {
            logger.log(Level.SEVERE, "Failed to load users for normalization", e);
            return;
        }

        int checked = 0;
        int fixed = 0;

        for (User u : users) {
            checked++;
            try {
                User.UserRole role = u.getRole();
                // Defensive: if role is null, treat as CITIZEN
                if (role == null) {
                    u.setRole(User.UserRole.CITIZEN);
                    u.setIsLawyer(false);
                    u.setIsJudge(false);
                    userAll.save(u);
                    fixed++;
                    logger.info(String.format("Normalized null role for user id=%d to CITIZEN", u.getId()));
                    continue;
                }

                boolean shouldBeLawyer = isRoleLawyer(role);
                boolean shouldBeJudge = isRoleJudge(role);

                Boolean currentLawyer = u.getIsLawyer();
                Boolean currentJudge = u.getIsJudge();

                // Null-safe comparison
                boolean lawyerMismatch = (currentLawyer == null && shouldBeLawyer) || (currentLawyer != null && currentLawyer != shouldBeLawyer);
                boolean judgeMismatch = (currentJudge == null && shouldBeJudge) || (currentJudge != null && currentJudge != shouldBeJudge);

                if (lawyerMismatch || judgeMismatch) {
                    u.setIsLawyer(shouldBeLawyer);
                    u.setIsJudge(shouldBeJudge);
                    userAll.save(u);
                    fixed++;
                    logger.info(String.format("Fixed flags for user id=%d: role=%s isLawyer=%s isJudge=%s", u.getId(), role.name(), shouldBeLawyer, shouldBeJudge));
                }

            } catch (Exception ex) {
                logger.log(Level.WARNING, "Skipping user during normalization due to error: " + (u == null ? "null" : u.getId()), ex);
            }
        }

        logger.info(String.format("UserRoleNormalizationRunner finished. Checked=%d fixed=%d", checked, fixed));
    }

    private boolean isRoleLawyer(User.UserRole role) {
        if (role == null) return false;
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

    private boolean isRoleJudge(User.UserRole role) {
        if (role == null) return false;
        switch (role) {
            case JUDGE:
            case DISTRICT_JUDGE:
            case ADDITIONAL_DISTRICT_JUDGE:
            case SESSIONS_JUDGE:
            case HIGH_COURT_JUDGE:
            case CHIEF_JUSTICE_HIGH_COURT:
            case SUPREME_COURT_JUDGE:
            case CHIEF_JUSTICE_INDIA:
                return true;
            default:
                return false;
        }
    }
}
