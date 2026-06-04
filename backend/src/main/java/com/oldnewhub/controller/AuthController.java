package com.oldnewhub.controller;

import com.oldnewhub.entity.User;
import com.oldnewhub.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String username = body.get("username");
            String password = body.get("password");
            if (username == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
            }
            return ResponseEntity.ok(authService.login(username, password));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            String username = user.getUsername();
            String password = user.getPassword();
            String email = user.getEmail();
            if (username == null || username.isBlank() ||
                password == null || password.isBlank() ||
                email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username, password, and email are required"));
            }
            return ResponseEntity.ok(authService.register(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
