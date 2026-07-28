package com.angel.backend.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;

@Service
public class TotpService {
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    private final SecureRandom random = new SecureRandom();

    public String generateSecret() {
        byte[] value = new byte[20];
        random.nextBytes(value);
        return encodeBase32(value);
    }

    public boolean verify(String secret, String code) {
        if (secret == null || code == null || !code.matches("\\d{6}")) return false;
        long counter = System.currentTimeMillis() / 30_000L;
        for (long offset = -1; offset <= 1; offset++) {
            if (generate(secret, counter + offset).equals(code)) return true;
        }
        return false;
    }

    public String provisioningUri(String secret, String email) {
        return "otpauth://totp/Angell:" + url(email) + "?secret=" + secret
            + "&issuer=Angell&algorithm=SHA1&digits=6&period=30";
    }

    private String generate(String secret, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(decodeBase32(secret), "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
            return String.format("%06d", binary % 1_000_000);
        } catch (Exception exception) {
            throw new IllegalStateException("Não foi possível validar o código de segurança.", exception);
        }
    }

    private String encodeBase32(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte value : bytes) {
            buffer = (buffer << 8) | (value & 0xff);
            bits += 8;
            while (bits >= 5) {
                result.append(ALPHABET.charAt((buffer >> (bits - 5)) & 31));
                bits -= 5;
            }
        }
        if (bits > 0) result.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        return result.toString();
    }

    private byte[] decodeBase32(String value) {
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        int buffer = 0, bits = 0;
        for (char character : value.toUpperCase().toCharArray()) {
            int index = ALPHABET.indexOf(character);
            if (index < 0) continue;
            buffer = (buffer << 5) | index;
            bits += 5;
            if (bits >= 8) {
                output.write((buffer >> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }
        return output.toByteArray();
    }

    private String url(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}
