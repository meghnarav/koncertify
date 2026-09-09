package com.koncertify.engine;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@EnableScheduling
public class RateLimiterFilter implements Filter {

    private static volatile boolean botProtectionEnabled = true;
    private static final int MAX_REQUESTS_PER_SECOND = 15;

    /**
     * Per-IP request counters for the current second.
     * Evicted periodically by {@link #evictStaleCounters()} to prevent
     * unbounded memory growth under a high-cardinality IP range.
     */
    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();

    public static boolean isBotProtectionEnabled() {
        return botProtectionEnabled;
    }

    public static void setBotProtectionEnabled(boolean enabled) {
        botProtectionEnabled = enabled;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest  httpRequest  = (HttpServletRequest)  request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        if (botProtectionEnabled
                && (path.contains("/api/seats/book") || path.contains("/api/bookings"))) {

            String clientIp     = resolveClientIp(httpRequest);
            long   currentSecond = System.currentTimeMillis() / 1000;

            RequestCounter counter = requestCounts.compute(clientIp, (ip, existing) -> {
                if (existing == null || existing.timestamp != currentSecond) {
                    // New second window — reset counter atomically
                    return new RequestCounter(currentSecond, 1);
                }
                existing.count.incrementAndGet();
                return existing;
            });

            if (counter.count.get() > MAX_REQUESTS_PER_SECOND) {
                httpResponse.setStatus(429);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write(
                        "{\"error\":\"BOT MITIGATION TRIGGERED: Rate limit exceeded ("
                                + counter.count.get() + " req/s > "
                                + MAX_REQUESTS_PER_SECOND + " req/s). Request blocked.\"}");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    /**
     * Evicts counters older than 2 seconds every 60 seconds.
     * Keeps the map bounded even under a large number of unique client IPs.
     */
    @Scheduled(fixedDelay = 60_000)
    public void evictStaleCounters() {
        long cutoff = (System.currentTimeMillis() / 1000) - 2;
        Iterator<Map.Entry<String, RequestCounter>> it = requestCounts.entrySet().iterator();
        while (it.hasNext()) {
            if (it.next().getValue().timestamp < cutoff) {
                it.remove();
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    // ── Inner types ───────────────────────────────────────────────────────────

    private static final class RequestCounter {
        final long          timestamp;
        final AtomicInteger count;

        RequestCounter(long timestamp, int initialCount) {
            this.timestamp = timestamp;
            this.count     = new AtomicInteger(initialCount);
        }
    }
}
