package com.angel.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class SecretEncryptionService {
    private final SecretKeySpec key;
    private final SecureRandom random = new SecureRandom();

    public SecretEncryptionService(@Value("${app.security.jwt-secret}") String secret) throws Exception {
        this.key = new SecretKeySpec(MessageDigest.getInstance("SHA-256")
            .digest(secret.getBytes(StandardCharsets.UTF_8)), "AES");
    }

    public String encrypt(String value) {
        try {
            byte[] iv = new byte[12];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, iv));
            byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
            byte[] result = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, result, 0, iv.length);
            System.arraycopy(encrypted, 0, result, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(result);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível proteger a credencial.", exception);
        }
    }

    public String decrypt(String value) {
        try {
            byte[] input = Base64.getDecoder().decode(value);
            byte[] iv = java.util.Arrays.copyOfRange(input, 0, 12);
            byte[] encrypted = java.util.Arrays.copyOfRange(input, 12, input.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível ler a credencial protegida.", exception);
        }
    }
}
