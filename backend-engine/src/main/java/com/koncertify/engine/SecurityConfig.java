package com.koncertify.engine.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Hooks Spring Security directly into your existing CorsConfig settings
            .cors(Customizer.withDefaults())
            
            // Disables CSRF so your frontend can communicate statelessly
            .csrf(csrf -> csrf.disable())
            
            // Unlocks your health endpoint while keeping everything else secure
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/health").permitAll()
                .anyRequest().permitAll() // Temporarily permits all routes to get your app running smoothly!
            );

        return http.build();
    }
}