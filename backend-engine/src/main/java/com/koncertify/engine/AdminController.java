package com.koncertify.engine;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @GetMapping("/bot-protection")
    public ResponseEntity<Map<String, Object>> getBotProtectionStatus() {
        return ResponseEntity.ok(Map.of(
            "enabled", RateLimiterFilter.isBotProtectionEnabled(),
            "maxRequestsPerSec", 15
        ));
    }

    @PostMapping("/bot-protection")
    public ResponseEntity<Map<String, Object>> toggleBotProtection(@RequestParam boolean enabled) {
        RateLimiterFilter.setBotProtectionEnabled(enabled);
        return ResponseEntity.ok(Map.of(
            "enabled", RateLimiterFilter.isBotProtectionEnabled(),
            "message", "Bot mitigation rate limiter is now " + (enabled ? "ENABLED" : "DISABLED")
        ));
    }
}
