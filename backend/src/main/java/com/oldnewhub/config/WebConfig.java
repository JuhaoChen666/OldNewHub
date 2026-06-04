package com.oldnewhub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String assetPath = resolveAssetPath().toUri().toString();
        registry.addResourceHandler("/Assets/**")
                .addResourceLocations(assetPath);
    }

    /**
     * Resolve the Assets directory robustly, trying multiple strategies
     * so it works regardless of the launch working directory.
     */
    private Path resolveAssetPath() {
        String userDir = System.getProperty("user.dir");

        // Strategy 1: {user.dir}/backend/src/main/resources/Assets (launched from project root)
        Path path = Paths.get(userDir, "backend", "src", "main", "resources", "Assets");
        if (Files.exists(path)) return path.toAbsolutePath();

        // Strategy 2: {user.dir}/src/main/resources/Assets (launched from backend/ dir)
        path = Paths.get(userDir, "src", "main", "resources", "Assets");
        if (Files.exists(path)) return path.toAbsolutePath();

        // Strategy 3: Fallback to the original relative path
        return Paths.get("backend/src/main/resources/Assets").toAbsolutePath();
    }
}
