package com.ninjabank.userservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ninjabank.userservice.dto.ForgotPasswordRequest;
import com.ninjabank.userservice.dto.LoginRequest;
import com.ninjabank.userservice.dto.ResendOtpRequest;
import com.ninjabank.userservice.dto.ResetPasswordRequest;
import com.ninjabank.userservice.dto.SignupRequest;
import com.ninjabank.userservice.dto.VerifyOtpRequest;
import com.ninjabank.userservice.security.RateLimitService;
import com.ninjabank.userservice.service.AuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private RateLimitService rateLimitService;

    @GetMapping("/health")
    public String health() {
        return "NinjaBank User Service is running healthy!";
    }

    @PostMapping("/signup")
    public String signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "SIGNUP")) {
            throw new RuntimeException("Too many signup attempts. Try again later.");
        }

        return authService.signUp(request);
    }

    @PostMapping("/login")
    public String login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "LOGIN")) {
            throw new RuntimeException("Too many login attempts. Try again later.");
        }

        return authService.login(request);
    }

    @PostMapping("/resend-otp")
    public String resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "RESEND_OTP")) {
            throw new RuntimeException("Too many OTP requests. Try again later.");
        }

        return authService.resendOtp(request);
    }

    @PostMapping("/verify-otp")
    public String verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "VERIFY_OTP")) {
            throw new RuntimeException("Too many OTP verification attempts. Try again later.");
        }

        return authService.verifyOtp(request);
    }

    @PostMapping("/forgot-password")
    public String forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "FORGOT_PASSWORD")) {
            throw new RuntimeException("Too many password reset requests. Try again later.");
        }

        return authService.forgotPassword(request);
    }

    @PostMapping("/verify-forgot-otp")
    public String verifyForgotOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "VERIFY_FORGOT_OTP")) {
            throw new RuntimeException("Too many OTP verification attempts. Try again later.");
        }

        return authService.verifyForgotOtp(request);
    }

    @PostMapping("/reset-password")
    public String resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {

        String ip = httpRequest.getRemoteAddr();

        if (!rateLimitService.isAllowed(ip, "RESET_PASSWORD")) {
            throw new RuntimeException("Too many password reset attempts. Try again later.");
        }

        return authService.resetPassword(request);
    }
}
