package com.angel.backend;

import com.angel.backend.messaging.NotificationQueuePublisher;
import com.angel.backend.model.NotificationOutbox;
import com.angel.backend.repository.NotificationOutboxRepository;
import com.angel.backend.service.TransactionalNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(properties = "app.notifications.dispatch-ms=3600000")
@ActiveProfiles("test")
@Import(TransactionalNotificationRabbitTests.RabbitTestConfig.class)
class TransactionalNotificationRabbitTests {
    @Autowired
    private NotificationOutboxRepository repository;
    @Autowired
    private TransactionalNotificationService service;
    @Autowired
    private RecordingPublisher publisher;

    @BeforeEach
    void prepare() {
        repository.deleteAll();
        publisher.reset();
    }

    @Test
    void publicaNotificacaoPendenteNoRabbitMq() {
        NotificationOutbox item = repository.save(pending());

        service.dispatchPending();

        NotificationOutbox saved = repository.findById(item.getId()).orElseThrow();
        assertEquals("QUEUED", saved.getStatus());
        assertEquals(item.getId(), publisher.publishedId);
    }

    @Test
    void mantemOutboxPendenteQuandoRabbitMqEstaIndisponivel() {
        NotificationOutbox item = repository.save(pending());
        publisher.fail = true;

        service.dispatchPending();

        NotificationOutbox saved = repository.findById(item.getId()).orElseThrow();
        assertEquals("PENDING", saved.getStatus());
        assertNotNull(saved.getNextAttemptAt());
        assertNotNull(saved.getLastError());
    }

    private NotificationOutbox pending() {
        NotificationOutbox item = new NotificationOutbox();
        item.setOrderNumber("ANG-PORTFOLIO");
        item.setChannel("EMAIL");
        item.setEventType("PORTFOLIO_TEST");
        item.setRecipient("recipient@example.invalid");
        item.setMessage("Mensagem de teste");
        item.setSecureUrl("http://localhost:5173/meu-pedido");
        item.setStatus("PENDING");
        item.setNextAttemptAt(LocalDateTime.now());
        return item;
    }

    @TestConfiguration
    static class RabbitTestConfig {
        @Bean
        RecordingPublisher recordingPublisher() {
            return new RecordingPublisher();
        }
    }

    static class RecordingPublisher implements NotificationQueuePublisher {
        private UUID publishedId;
        private boolean fail;

        @Override
        public void publish(UUID notificationId) {
            if (fail) throw new IllegalStateException("broker offline");
            publishedId = notificationId;
        }

        @Override
        public void sendToDeadLetter(UUID notificationId, String reason) {
        }

        void reset() {
            publishedId = null;
            fail = false;
        }
    }
}
