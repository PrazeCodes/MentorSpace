package com.mentorspace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MentorSpaceApplication {

    public static void main(String[] args) {
        // Secrets are provided via environment variables (see .env.example).
        // application.properties reads them with ${VAR} substitution.
        SpringApplication.run(MentorSpaceApplication.class, args);
    }
}
