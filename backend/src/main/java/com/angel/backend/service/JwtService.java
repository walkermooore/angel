package com.angel.backend.service;

import com.angel.backend.model.AdminUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;
    private final Duration expiration;

    public JwtService(JwtEncoder jwtEncoder, @Value("${app.security.jwt-expiration}") Duration expiration) {
        this.jwtEncoder = jwtEncoder;
        this.expiration = expiration;
    }

    public IssuedToken createToken(AdminUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(expiration);
        String tokenId = UUID.randomUUID().toString();
        JwtClaimsSet claims = JwtClaimsSet.builder()
            .issuer("angel-api")
            .issuedAt(now)
            .expiresAt(expiresAt)
            .id(tokenId)
            .subject(user.getEmail())
            .claim("scope", user.getRole())
            .claim("name", user.getName())
            .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return new IssuedToken(
            jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue(),
            tokenId,
            expiresAt
        );
    }

    public record IssuedToken(String value, String id, Instant expiresAt) {}
}
