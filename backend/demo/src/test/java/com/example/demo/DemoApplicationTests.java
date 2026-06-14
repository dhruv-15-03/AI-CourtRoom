package com.example.demo;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class DemoApplicationTests {

	static {
		// The application now fails fast when JWT_SECRET is absent. Provide a
		// throwaway secret for the Spring context-load test (only set if the
		// environment hasn't already supplied one).
		if (System.getenv("JWT_SECRET") == null && System.getProperty("JWT_SECRET") == null) {
			System.setProperty("JWT_SECRET", "test-only-jwt-secret-please-override-0123456789");
		}
	}

	@Test
	void contextLoads() {
	}

}
