package com.example.demo.Config;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.logging.Logger;

@Component
@ConditionalOnProperty(name = "app.demo-users.enabled", havingValue = "true")
public class DemoUserSeeder implements ApplicationRunner {

    private static final List<DemoAccount> ACCOUNTS = List.of(
            new DemoAccount("user@example.com", "Demo", "Citizen", User.UserRole.CITIZEN),
            new DemoAccount("lawyer@example.com", "Demo", "Lawyer", User.UserRole.ADVOCATE),
            new DemoAccount("judge@example.com", "Demo", "Judge", User.UserRole.JUDGE)
    );

    private final UserAll userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String password;
    private final Logger logger = Logger.getLogger(DemoUserSeeder.class.getName());

    public DemoUserSeeder(
            UserAll userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.demo-users.password:password123}") String password) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        ACCOUNTS.forEach(this::ensureAccount);
        logger.info("Ensured the three documented demo accounts are available.");
    }

    private void ensureAccount(DemoAccount account) {
        User user = userRepository.searchByEmail(account.email());
        boolean isNew = user == null;
        if (user == null) {
            user = new User();
            user.setEmail(account.email());
        }

        user.setFirstName(account.firstName());
        user.setLastName(account.lastName());
        user.setRole(account.role());
        user.setIsLawyer(account.role() == User.UserRole.ADVOCATE);
        user.setIsJudge(account.role() == User.UserRole.JUDGE);
        user.setIsActive(true);
        user.setPassword(passwordEncoder.encode(password));
        if (isNew) {
            // @PrePersist applies normal signup defaults, including unverified state.
            userRepository.save(user);
        }
        user.setEmailVerified(true);
        user.setMobileVerified(true);
        user.setIsVerified(true);
        userRepository.save(user);
    }

    private record DemoAccount(
            String email,
            String firstName,
            String lastName,
            User.UserRole role) {
    }
}
