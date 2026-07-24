package com.angel.backend;

import com.angel.backend.enums.Status;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.PurchaseOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SecurityAndOrderIntegrationTests {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    private String token;

    @BeforeEach
    void authenticate() throws Exception {
        purchaseOrderRepository.deleteAll();
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"integration@angel.test","password":"integration-password-123"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andReturn().getResponse().getContentAsString();

        Matcher matcher = TOKEN_PATTERN.matcher(response);
        assertThat(matcher.find()).isTrue();
        token = matcher.group(1);
    }

    @Test
    void rejectsInvalidCredentialsAndProtectsAdministrativeEndpoints() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"integration@angel.test","password":"wrong-password"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/pedidos"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/pedidos")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    void updatesStatusAndTrackingWithJwt() throws Exception {
        PurchaseOrder order = new PurchaseOrder();
        order.setNumber("ANG-INTEGRATION-001");
        order.setEmail("cliente@angel.test");
        order.setSubtotal(BigDecimal.TEN);
        order.setShipping(BigDecimal.ZERO);
        order.setTotal(BigDecimal.TEN);
        order.setStatus(Status.PENDENTE);
        order = purchaseOrderRepository.saveAndFlush(order);

        mockMvc.perform(patch("/api/pedidos/{id}/status", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"Pago\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("Pago"));

        mockMvc.perform(patch("/api/pedidos/{id}/tracking-code", order.getId())
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"trackingCode\":\"AA123456789BR\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.trackingCode").value("AA123456789BR"));

        PurchaseOrder saved = purchaseOrderRepository.findById(order.getId()).orElseThrow();
        assertThat(saved.getStatus()).isEqualTo(Status.PAGO);
        assertThat(saved.getTrackingCode()).isEqualTo("AA123456789BR");
    }

    @Test
    void updatesAndReadsInstitutionalPolicies() throws Exception {
        mockMvc.perform(put("/api/paginas-institucionais")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "termsContent":"Termos de integração",
                      "exchangesContent":"Trocas de integração",
                      "privacyContent":"Privacidade de integração"
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.termsContent").value("Termos de integração"));

        mockMvc.perform(get("/api/paginas-institucionais"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.exchangesContent").value("Trocas de integração"))
            .andExpect(jsonPath("$.privacyContent").value("Privacidade de integração"));
    }
}
