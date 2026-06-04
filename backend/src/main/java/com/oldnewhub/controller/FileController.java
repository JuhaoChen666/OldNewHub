package com.oldnewhub.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif", "bmp");
    private static final Map<String, MediaType> MEDIA_TYPE_MAP = Map.of(
            "jpg", MediaType.IMAGE_JPEG,
            "jpeg", MediaType.IMAGE_JPEG,
            "png", MediaType.IMAGE_PNG,
            "webp", new MediaType("image", "webp"),
            "gif", MediaType.IMAGE_GIF,
            "bmp", new MediaType("image", "bmp")
    );

    /**
     * Serve uploaded item images from Assets/{userId}/{itemId}/{filename}
     */
    @GetMapping("/{userId}/{itemId}/{filename:.+}")
    public ResponseEntity<Resource> getImage(
            @PathVariable Long userId,
            @PathVariable Long itemId,
            @PathVariable String filename) {

        try {
            // Resolve Assets directory relative to the project (works for both dev and prod)
            String userDir = System.getProperty("user.dir");
            Path assetsRoot = Paths.get(userDir, "backend", "src", "main", "resources", "Assets");

            // If not found, try classpath-relative root
            if (!Files.exists(assetsRoot)) {
                assetsRoot = Paths.get(userDir, "src", "main", "resources", "Assets");
            }

            Path imagePath = assetsRoot
                    .resolve(String.valueOf(userId))
                    .resolve(String.valueOf(itemId))
                    .resolve(filename)
                    .normalize();

            // Security: ensure the resolved path stays within Assets
            if (!imagePath.startsWith(assetsRoot.normalize())) {
                return ResponseEntity.badRequest().build();
            }

            if (!Files.exists(imagePath) || !Files.isReadable(imagePath)) {
                return ResponseEntity.notFound().build();
            }

            // Determine content type from extension
            String filenameLower = filename.toLowerCase();
            String ext = filenameLower.substring(filenameLower.lastIndexOf('.') + 1);
            if (!ALLOWED_EXTENSIONS.contains(ext)) {
                return ResponseEntity.badRequest().build();
            }

            MediaType mediaType = MEDIA_TYPE_MAP.getOrDefault(ext, MediaType.APPLICATION_OCTET_STREAM);
            byte[] bytes = Files.readAllBytes(imagePath);

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                    .body(new ByteArrayResource(bytes));

        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
