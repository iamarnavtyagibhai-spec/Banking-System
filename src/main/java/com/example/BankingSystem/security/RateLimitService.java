package com.example.BankingSystem.security;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import io.github.bucket4j.Bucket;

@Service
public class RateLimitService {

    private final Map<String, Bucket> buckets =
            new ConcurrentHashMap<>();

    public boolean isAllowed(String ip, String endpoint) {

        String key = ip + ":" + endpoint;

        Bucket bucket = buckets.computeIfAbsent(
                key,
                k -> createBucket(endpoint)
        );

        return bucket.tryConsume(1);
    }

    private Bucket createBucket(String endpoint) {

        return switch (endpoint) {

            case "LOGIN", "SIGNUP" ->
                    Bucket.builder()
                            .addLimit(limit -> limit
                                    .capacity(5)
                                    .refillIntervally(
                                            5,
                                            Duration.ofMinutes(1)
                                    ))
                            .build();

            case "VERIFY_OTP", "VERIFY_FORGOT_OTP" ->
                    Bucket.builder()
                            .addLimit(limit -> limit
                                    .capacity(5)
                                    .refillIntervally(
                                            5,
                                            Duration.ofMinutes(5)
                                    ))
                            .build();

            case "RESEND_OTP", "FORGOT_PASSWORD" ->
                    Bucket.builder()
                            .addLimit(limit -> limit
                                    .capacity(3)
                                    .refillIntervally(
                                            3,
                                            Duration.ofMinutes(10)
                                    ))
                            .build();

            case "RESET_PASSWORD" ->
                    Bucket.builder()
                            .addLimit(limit -> limit
                                    .capacity(5)
                                    .refillIntervally(
                                            5,
                                            Duration.ofMinutes(10)
                                    ))
                            .build();

            default ->
                    throw new IllegalArgumentException(
                            "Unknown endpoint: " + endpoint
                    );
        };
    }
}