package com.ninjabank.userservice.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private final Map<String, String> forgotPasswordOtps = new ConcurrentHashMap<>();

    public void saveForgotPasswordOtp(String email, String otp) {
        forgotPasswordOtps.put(email, otp);
    }

    public boolean verifyForgotPasswordOtp(String email, String otp) {
        return otp != null && otp.equals(forgotPasswordOtps.get(email));
    }
}
