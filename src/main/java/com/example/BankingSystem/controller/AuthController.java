package com.example.BankingSystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.BankingSystem.dto.ForgotPasswordRequest;
import com.example.BankingSystem.dto.LoginRequest;
import com.example.BankingSystem.dto.ResendOtpRequest;
import com.example.BankingSystem.dto.ResetPasswordRequest;
import com.example.BankingSystem.dto.SignupRequest;
import com.example.BankingSystem.dto.VerifyOtpRequest;
import com.example.BankingSystem.security.RateLimitService;
import com.example.BankingSystem.service.AccountService;
import com.example.BankingSystem.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private AccountService accountService;

    @Autowired
    private RateLimitService rateLimitService;


    @PostMapping("/signup")
    public String signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "SIGNUP")) {
            throw new RuntimeException(
                    "Too many signup attempts. Try again later."
            );
        }

        return authService.signUp(request);
    }


    @PostMapping("/login")
    public String login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "LOGIN")) {
            throw new RuntimeException(
                    "Too many login attempts. Try again later."
            );
        }

        return authService.login(request);
    }


    @PostMapping("/resend-otp")
    public String resendOtp(
            @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "RESEND_OTP")) {
            throw new RuntimeException(
                    "Too many OTP requests. Try again later."
            );
        }

        return authService.resendOtp(request);
    }


    @PostMapping("/verify-otp")
    public String verifyOtp(
            @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "VERIFY_OTP")) {
            throw new RuntimeException(
                    "Too many OTP verification attempts. Try again later."
            );
        }

        return authService.verifyOtp(request);
    }


    @PostMapping("/forgot-password")
    public String forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "FORGOT_PASSWORD")) {
            throw new RuntimeException(
                    "Too many password reset requests. Try again later."
            );
        }

        return authService.forgotPassword(request);
    }


    @PostMapping("/verify-forgot-otp")
    public String verifyForgotOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "VERIFY_FORGOT_OTP")) {
            throw new RuntimeException(
                    "Too many OTP verification attempts. Try again later."
            );
        }

        return authService.verifyForgotOtp(request);
    }


    @PostMapping("/reset-password")
    public String resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "RESET_PASSWORD")) {
            throw new RuntimeException(
                    "Too many password reset attempts. Try again later."
            );
        }

        return authService.resetPassword(request);
    }
}