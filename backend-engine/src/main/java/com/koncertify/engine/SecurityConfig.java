package com.koncertify.engine.config;

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
            // 1. Force our custom CORS configuration source directly into the filter engine
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 2. Disable CSRF security checks for stateless cross-origin traffic
            .csrf(csrf -> csrf.disable())
            
            // 3. Permit all incoming requests entirely to clear out security walls
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers("/api/organizer/**").hasAuthority("ROLE_ORGANIZER")
                .requestMatchers("/api/bookings/**").hasAuthority("ROLE_CUSTOMER")
                .requestMatchers("/api/events/**").permitAll() // Anyone can browse
            )

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Explicitly white-list your exact frontend domain and local developer builds
        configuration.setAllowedOrigins(List.of(
            "https://koncert-ify.vercel.app", 
            "http://localhost:3000"
        ));
        
        // Pass essential headers and authorization parameters
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        
        // Apply this sweeping rule to every single API endpoint root path structure
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}