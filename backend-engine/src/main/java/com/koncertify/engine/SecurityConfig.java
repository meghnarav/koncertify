package com.koncertify.engine;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Enable CORS using the configuration source bean defined below
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 2. Disable CSRF for development/stateless APIs so POST requests pass through
            .csrf(csrf -> csrf.disable())
            // 3. Configure public and protected endpoints
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health", "/api/seats/**", "/api/events/**").permitAll()
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Match the origin your frontend is running on
        configuration.setAllowedOrigins(List.of("https://koncert-ify.vercel.app"));
        
        // Explicitly allow all HTTP standard methods
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"));
        
        // Allow all headers to prevent authentication token blocks
        configuration.setAllowedHeaders(List.of("*"));
        
        // Allow cookies/auth headers if needed
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}