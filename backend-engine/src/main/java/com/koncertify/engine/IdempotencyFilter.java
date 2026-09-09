package com.koncertify.engine;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@EnableScheduling
public class IdempotencyFilter implements Filter {

    private final StringRedisTemplate redisTemplate;

    /**
     * In-memory fallback cache used when Redis is unavailable.
     * Evicted periodically by {@link #evictExpiredEntries()} to prevent unbounded growth.
     */
    private final Map<String, CachedResponse> memoryStore = new ConcurrentHashMap<>();

    public IdempotencyFilter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  httpRequest  = (HttpServletRequest)  request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String idempotencyKey = httpRequest.getHeader("Idempotency-Key");
        String method         = httpRequest.getMethod();

        // Only enforce idempotency on state-changing POST requests that carry a key
        if ("POST".equalsIgnoreCase(method)
                && idempotencyKey != null
                && !idempotencyKey.isBlank()) {

            String cacheKey = "idempotency:" + idempotencyKey.trim();

            // 1. Return cached response if this key was already processed
            String cachedBody = getFromCache(cacheKey);
            if (cachedBody != null) {
                httpResponse.setStatus(HttpServletResponse.SC_OK);
                httpResponse.setContentType("application/json");
                httpResponse.setHeader("X-Idempotency-Cache", "HIT");
                httpResponse.getWriter().write(cachedBody);
                return;
            }

            // 2. Wrap response so we can capture the body for caching
            ContentCachingResponseWrapper responseWrapper =
                    new ContentCachingResponseWrapper(httpResponse);

            try {
                chain.doFilter(request, responseWrapper);
            } finally {
                int    status    = responseWrapper.getStatus();
                byte[] bodyBytes = responseWrapper.getContentAsByteArray();

                // Only cache successful responses that have a non-empty body.
                // Skipping empty-body / 204 No Content prevents replaying blank responses.
                if (status >= 200 && status < 300
                        && bodyBytes != null
                        && bodyBytes.length > 0) {

                    String responseBody = new String(bodyBytes, responseWrapper.getCharacterEncoding());
                    saveToCache(cacheKey, responseBody, Duration.ofHours(24));
                }

                // Always copy the real body back to the original response
                responseWrapper.copyBodyToResponse();
            }
            return;
        }

        chain.doFilter(request, response);
    }

    // ── Cache helpers ─────────────────────────────────────────────────────────

    private String getFromCache(String cacheKey) {
        try {
            return redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception e) {
            // Redis unavailable — fall back to in-memory store
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
            // Redis unavailable — persist to in-memory fallback
            long expireAt = System.currentTimeMillis() + ttl.toMillis();
            memoryStore.put(cacheKey, new CachedResponse(body, expireAt));
        }
    }

    /**
     * Evicts expired entries from the in-memory fallback store every 10 minutes
     * to prevent unbounded memory growth under prolonged Redis outages.
     */
    @Scheduled(fixedDelay = 600_000)
    public void evictExpiredEntries() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<String, CachedResponse>> it = memoryStore.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().expireAt < now) {
                it.remove();
            }
        }
    }

    // ── Inner types ───────────────────────────────────────────────────────────

    private static final class CachedResponse {
        final String body;
        final long   expireAt;

        CachedResponse(String body, long expireAt) {
            this.body     = body;
            this.expireAt = expireAt;
        }
    }
}
