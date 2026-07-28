package com.angel.backend.service;

import com.angel.backend.exception.CheckoutException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.Base64;

@Service
public class ImageStorageService {
    private static final long MAX_SIZE = 2L * 1024 * 1024;
    private final Path directory;
    private final String publicBaseUrl;

    public ImageStorageService(
        @Value("${app.media.directory:./data/uploads}") String directory,
        @Value("${app.media.public-base-url:http://localhost:8081/api/media/images}") String publicBaseUrl
    ) {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        this.publicBaseUrl = publicBaseUrl.replaceFirst("/+$", "");
        try {
            Files.createDirectories(this.directory);
        } catch (IOException exception) {
            throw new IllegalStateException("Não foi possível preparar o diretório de imagens.", exception);
        }
    }

    public StoredImage store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Selecione uma imagem.");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new CheckoutException(HttpStatus.PAYLOAD_TOO_LARGE, "A imagem deve ter no máximo 2 MB.");
        }
        try {
            byte[] header = file.getInputStream().readNBytes(16);
            String extension = extension(header);
            String contentType = Map.of("jpg", "image/jpeg", "png", "image/png", "webp", "image/webp").get(extension);
            String filename = UUID.randomUUID() + "." + extension;
            Path temporary = Files.createTempFile(directory, "upload-", ".tmp");
            try {
                Files.copy(file.getInputStream(), temporary, StandardCopyOption.REPLACE_EXISTING);
                Files.move(temporary, directory.resolve(filename), StandardCopyOption.ATOMIC_MOVE);
            } finally {
                Files.deleteIfExists(temporary);
            }
            return new StoredImage(filename, publicBaseUrl + "/" + filename, contentType, file.getSize());
        } catch (CheckoutException exception) {
            throw exception;
        } catch (IOException exception) {
            throw new CheckoutException(HttpStatus.INTERNAL_SERVER_ERROR, "Não foi possível armazenar a imagem.");
        }
    }

    public String migrateDataUrl(String value) {
        if (value == null || !value.startsWith("data:image/")) return value;
        int separator = value.indexOf(',');
        if (separator < 0 || !value.substring(0, separator).endsWith(";base64")) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Imagem legada inválida.");
        }
        try {
            byte[] bytes = Base64.getDecoder().decode(value.substring(separator + 1));
            if (bytes.length > MAX_SIZE) {
                throw new CheckoutException(HttpStatus.PAYLOAD_TOO_LARGE, "A imagem legada excede 2 MB.");
            }
            String extension = extension(java.util.Arrays.copyOf(bytes, Math.min(16, bytes.length)));
            String filename = UUID.randomUUID() + "." + extension;
            Files.write(directory.resolve(filename), bytes);
            return publicBaseUrl + "/" + filename;
        } catch (IllegalArgumentException | IOException exception) {
            throw new IllegalStateException("Não foi possível migrar uma imagem legada.", exception);
        }
    }

    public Path resolve(String filename) {
        if (filename == null || !filename.matches("[0-9a-fA-F-]{36}\\.(jpg|png|webp)")) {
            throw new CheckoutException(HttpStatus.NOT_FOUND, "Imagem não encontrada.");
        }
        Path file = directory.resolve(filename).normalize();
        if (!file.startsWith(directory) || !Files.isRegularFile(file)) {
            throw new CheckoutException(HttpStatus.NOT_FOUND, "Imagem não encontrada.");
        }
        return file;
    }

    public String contentType(String filename) {
        if (filename.endsWith(".png")) return "image/png";
        if (filename.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    public void validateReference(String value) {
        if (value == null || value.isBlank()) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST, "Informe uma imagem.");
        }
        boolean allowed = value.startsWith("https://")
            || value.startsWith("http://localhost:")
            || value.startsWith("http://127.0.0.1:");
        if (!allowed || value.length() > 2_048) {
            throw new CheckoutException(HttpStatus.BAD_REQUEST,
                "A imagem deve ser uma URL segura gerada pelo serviço de arquivos.");
        }
    }

    private String extension(byte[] data) {
        boolean jpeg = data.length >= 3
            && (data[0] & 0xff) == 0xff && (data[1] & 0xff) == 0xd8 && (data[2] & 0xff) == 0xff;
        boolean png = data.length >= 8
            && (data[0] & 0xff) == 0x89 && data[1] == 0x50 && data[2] == 0x4e && data[3] == 0x47;
        boolean webp = data.length >= 12
            && data[0] == 'R' && data[1] == 'I' && data[2] == 'F' && data[3] == 'F'
            && data[8] == 'W' && data[9] == 'E' && data[10] == 'B' && data[11] == 'P';
        if (jpeg) return "jpg";
        if (png) return "png";
        if (webp) return "webp";
        throw new CheckoutException(HttpStatus.BAD_REQUEST,
            "O conteúdo do arquivo não corresponde a JPEG, PNG ou WebP.");
    }

    public record StoredImage(String filename, String url, String contentType, long size) {}
}
