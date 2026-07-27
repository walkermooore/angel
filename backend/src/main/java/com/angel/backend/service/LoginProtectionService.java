package com.angel.backend.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginProtectionService {
    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public long retryAfter(String account, String ip) {
        Attempt attempt = attempts.get(key(account, ip));
        if (attempt == null || attempt.failures < 5) return 0;
        return Math.max(0, attempt.blockedUntil - Instant.now().getEpochSecond());
    }

    public void failure(String account, String ip) {
        attempts.compute(key(account, ip), (ignored, current) -> {
            Attempt attempt = current == null ? new Attempt() : current;
            attempt.failures++;
            long progressiveDelay = Math.min(900, (long) Math.pow(2, Math.min(attempt.failures, 9)));
            if (attempt.failures >= 5) progressiveDelay = Math.max(progressiveDelay, 900);
            attempt.blockedUntil = Instant.now().getEpochSecond() + progressiveDelay;
            return attempt;
        });
    }

    public void success(String account, String ip) {
        attempts.remove(key(account, ip));
    }

    private String key(String account, String ip) { return account + ":" + ip; }
    private static final class Attempt { private int failures; private long blockedUntil; }
}
