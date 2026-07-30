package com.koncertify.engine;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class IdempotencyFilter implements Filter {

    private final StringRedisTemplate redisTemplate;
    private final Map<String, CachedResponse> memoryStore = new ConcurrentHashMap<>();

    public IdempotencyFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String idempotencyKey = httpRequest.getHeader("Idempotency-Key");
        String method = httpRequest.getMethod();

        // Only enforce idempotency on state-changing POST/PUT requests with key
        if ("POST".equalsIgnoreCase(method) && idempotencyKey != null && !idempotencyKey.trim().isEmpty()) {
            String cacheKey = "idempotency:" + idempotencyKey.trim();

            // 1. Check Redis cache or in-memory fallback
            String cachedBody = getFromCache(cacheKey);
            if (cachedBody != null) {
                httpResponse.setStatus(HttpServletResponse.SC_OK);
                httpResponse.setContentType("application/json");
                httpResponse.setHeader("X-Cache-Lookup", "HIT-IDEMPOTENT");
                httpResponse.getWriter().write(cachedBody);
                return;
            }

            // 2. Wrap response to capture generated output
            ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(httpResponse);

            try {
                chain.doFilter(request, responseWrapper);
            } finally {
                int status = responseWrapper.getStatus();
                if (status >= 200 && status < 300) {
                    byte[] bodyBytes = responseWrapper.getContentAsByteArray();
                    String responseBody = new String(bodyBytes, responseWrapper.getCharacterEncoding());
                    
                    saveToCache(cacheKey, responseBody, Duration.ofHours(24));
                }
                responseWrapper.copyBodyToResponse();
            }
            return;
        }

        chain.doFilter(request, response);
    }

    private String getFromCache(String cacheKey) {
        try {
            return redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            CachedResponse cached = memoryStore.get(cacheKey);
            if (cached != null && System.currentTimeMillis() < cached.expireAt) {
                return cached.body;
            }
            return null;
        }
    }

    private void saveToCache(String cacheKey, String body, Duration ttl) {
        try {
            redisTemplate.opsForValue().set(cacheKey, body, ttl);
        } catch (Exception e) {
            long expireAt = System.currentTimeMillis() + ttl.toMillis();
            memoryStore.put(cacheKey, new CachedResponse(body, expireAt));
        }
    }

    private static class CachedResponse {
        final String body;
        final long expireAt;

        CachedResponse(String body, long expireAt) {
            this.body = body;
            this.expireAt = expireAt;
        }
    }
}
