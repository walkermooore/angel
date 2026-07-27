package com.angel.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest(properties = "app.rate-limit.enabled=true")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RateLimitIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void limitsRepeatedAdministrativeLoginAttempts() throws Exception {
        int lastStatus = 0;
        for (int attempt = 0; attempt < 11; attempt++) {
            lastStatus = mockMvc.perform(post("/api/auth/login")
                    .header("X-Forwarded-For", "203.0.113.50")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"rate-limit@example.com\",\"password\":\"invalid-password\"}"))
                .andReturn().getResponse().getStatus();
        }
        assertThat(lastStatus).isEqualTo(429);
    }
}
