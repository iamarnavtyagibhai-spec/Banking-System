package com.example.BankingSystem.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

@Service
public class OtpService {

    private final SecureRandom random = new SecureRandom();

    public String generateOtp() {
        return String.valueOf(100000 + random.nextInt(900000));
    }

    public boolean isOtpExpired(LocalDateTime otpExpiry) {

        if (otpExpiry == null) {
            return true;
        }

        return LocalDateTime.now().isAfter(otpExpiry);
    }
}
