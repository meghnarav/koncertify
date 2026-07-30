package com.koncertify.engine;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiterFilter implements Filter {

    private static volatile boolean botProtectionEnabled = true;
    private static final int MAX_REQUESTS_PER_SECOND = 15;
    
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
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();

        // Apply rate limiting specifically on seat booking endpoints when protection is enabled
        if (botProtectionEnabled && (path.contains("/api/seats/book") || path.contains("/api/bookings"))) {
            String clientIp = getClientIP(httpRequest);
            long currentSecond = System.currentTimeMillis() / 1000;

            RequestCounter counter = requestCounts.compute(clientIp, (ip, existingCounter) -> {
                if (existingCounter == null || existingCounter.timestamp != currentSecond) {
                    return new RequestCounter(currentSecond, 1);
                }
                existingCounter.count.incrementAndGet();
                return existingCounter;
            });

            if (counter.count.get() > MAX_REQUESTS_PER_SECOND) {
                httpResponse.setStatus(429); // 429 Too Many Requests
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write(
                    "{\"error\": \"BOT MITIGATION LAYER TRIGGERED: Request rate limit exceeded (" + 
                    counter.count.get() + " req/s > " + MAX_REQUESTS_PER_SECOND + " req/s max limit). Bot abuse prevented.\"}"
                );
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }

    private static class RequestCounter {
        final long timestamp;
        final AtomicInteger count;

        RequestCounter(long timestamp, int initialCount) {
            this.timestamp = timestamp;
            this.count = new AtomicInteger(initialCount);
        }
    }
}
