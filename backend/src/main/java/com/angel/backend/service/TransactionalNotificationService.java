package com.angel.backend.service;

import com.angel.backend.model.NotificationOutbox;
import com.angel.backend.model.PurchaseOrder;
import com.angel.backend.repository.NotificationOutboxRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class TransactionalNotificationService {
    private final NotificationOutboxRepository repository;
    private final JavaMailSender mailSender;
    private final RestClient restClient;
    private final boolean emailEnabled;
    private final boolean whatsappEnabled;
    private final String emailFrom;
    private final String whatsappUrl;
    private final String whatsappToken;
    private final String publicUrl;

    public TransactionalNotificationService(
        NotificationOutboxRepository repository,
        JavaMailSender mailSender,
        @Value("${app.notifications.email-enabled:false}") boolean emailEnabled,
        @Value("${app.notifications.whatsapp-enabled:false}") boolean whatsappEnabled,
        @Value("${app.notifications.email-from:}") String emailFrom,
        @Value("${app.notifications.whatsapp-webhook-url:}") String whatsappUrl,
        @Value("${app.notifications.whatsapp-token:}") String whatsappToken,
        @Value("${app.notifications.public-url:http://localhost:5173}") String publicUrl
    ) {
        this.repository = repository;
        this.mailSender = mailSender;
        this.emailEnabled = emailEnabled;
        this.whatsappEnabled = whatsappEnabled;
        this.emailFrom = emailFrom;
        this.whatsappUrl = whatsappUrl;
        this.whatsappToken = whatsappToken;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
        this.restClient = RestClient.create();
    }

    @Transactional
    public void queueOrderEvent(PurchaseOrder order, String eventType, String message) {
        String link = publicUrl + "/meu-pedido?n=" + order.getNumber() + "&t=" + order.getPublicTrackingToken();
        if (order.getEmail() != null && !order.getEmail().isBlank()) {
            queue(order, "EMAIL", eventType, order.getEmail(), "Atualização do pedido " + order.getNumber(), message, link);
        }
        if (order.getPhone() != null && !order.getPhone().isBlank()) {
            queue(order, "WHATSAPP", eventType, order.getPhone(), null, message, link);
        }
    }

    @Transactional
    public void queueAfterSalesEvent(PurchaseOrder order, String protocol, String accessToken, String eventType, String message) {
        String link = publicUrl + "/pos-venda?p=" + protocol + "&t=" + accessToken;
        if (order.getEmail() != null && !order.getEmail().isBlank()) {
            queue(order, "EMAIL", eventType, order.getEmail(), "Atualização da solicitação " + protocol, message, link);
        }
        if (order.getPhone() != null && !order.getPhone().isBlank()) {
            queue(order, "WHATSAPP", eventType, order.getPhone(), null, message, link);
        }
    }

    private void queue(PurchaseOrder order, String channel, String eventType, String recipient,
                       String subject, String message, String secureUrl) {
        NotificationOutbox item = new NotificationOutbox();
        item.setOrderId(order.getId());
        item.setOrderNumber(order.getNumber());
        item.setChannel(channel);
        item.setEventType(eventType);
        item.setRecipient(recipient);
        item.setSubject(subject);
        item.setMessage(message);
        item.setSecureUrl(secureUrl);
        item.setStatus(enabled(channel) ? "PENDING" : "AWAITING_CONFIGURATION");
        item.setNextAttemptAt(LocalDateTime.now());
        repository.save(item);
    }

    @Scheduled(fixedDelayString = "${app.notifications.dispatch-ms:30000}")
    public void dispatchPending() {
        List<NotificationOutbox> pending = repository
            .findTop50ByStatusInAndNextAttemptAtBeforeOrderByCreatedAtAsc(
                List.of("PENDING", "RETRY"), LocalDateTime.now().plusSeconds(1));
        pending.forEach(this::dispatch);
    }

    @Transactional
    public void retry(NotificationOutbox item) {
        item.setStatus(enabled(item.getChannel()) ? "PENDING" : "AWAITING_CONFIGURATION");
        item.setNextAttemptAt(LocalDateTime.now());
        item.setLastError(null);
        repository.save(item);
    }

    private void dispatch(NotificationOutbox item) {
        try {
            if ("EMAIL".equals(item.getChannel())) sendEmail(item);
            else sendWhatsapp(item);
            item.setStatus("SENT");
            item.setSentAt(LocalDateTime.now());
            item.setLastError(null);
        } catch (Exception exception) {
            int attempts = item.getAttempts() == null ? 1 : item.getAttempts() + 1;
            item.setAttempts(attempts);
            item.setStatus(attempts >= 5 ? "FAILED" : "RETRY");
            item.setNextAttemptAt(LocalDateTime.now().plusMinutes(Math.min(60, 1L << Math.min(attempts, 6))));
            item.setLastError(safeError(exception));
        }
        repository.save(item);
    }

    private void sendEmail(NotificationOutbox item) {
        if (!emailEnabled || emailFrom.isBlank()) throw new IllegalStateException("E-mail transacional não configurado");
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(emailFrom);
        mail.setTo(item.getRecipient());
        mail.setSubject(item.getSubject());
        mail.setText(item.getMessage() + "\n\nAcompanhe com segurança: " + item.getSecureUrl()
            + "\nNão compartilhe este link.");
        mailSender.send(mail);
    }

    private void sendWhatsapp(NotificationOutbox item) {
        if (!whatsappEnabled || whatsappUrl.isBlank()) throw new IllegalStateException("WhatsApp transacional não configurado");
        RestClient.RequestBodySpec request = restClient.post().uri(whatsappUrl);
        if (!whatsappToken.isBlank()) request.header("Authorization", "Bearer " + whatsappToken);
        request.body(Map.of(
            "to", item.getRecipient(),
            "message", item.getMessage() + "\nAcompanhe: " + item.getSecureUrl()
        )).retrieve().toBodilessEntity();
    }

    private boolean enabled(String channel) {
        return "EMAIL".equals(channel) ? emailEnabled && !emailFrom.isBlank() : whatsappEnabled && !whatsappUrl.isBlank();
    }

    private String safeError(Exception exception) {
        String value = exception.getMessage();
        if (value == null || value.isBlank()) value = exception.getClass().getSimpleName();
        return value.substring(0, Math.min(500, value.length()));
    }
}
