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
import com.example.BankingSystem.service.AccountService;
import com.example.BankingSystem.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {


    @Autowired
    private AuthService authService;
    @Autowired
    private AccountService accountService;

    @PostMapping("/signup")
    public String signup(@Valid @RequestBody SignupRequest request) {
        
        

        return authService.signUp(request);

       
    }

    @PostMapping("/login")
    public String login(@Valid @RequestBody LoginRequest request) {

        return authService.login(request);
    }
    @PostMapping("/resend-otp")
public String resendOtp(@RequestBody ResendOtpRequest request) {

    return authService.resendOtp(request);

}
@PostMapping("/verify-otp")
public String verifyOtp(@RequestBody VerifyOtpRequest request) {

    return authService.verifyOtp(request);

}

    @PostMapping("/forgot-password")
    public String forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }
        
@PostMapping("/reset-password")
    public String resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
    @PostMapping("/verify-forgot-otp")
public String verifyForgotOtp(@Valid @RequestBody VerifyOtpRequest request) {

    return authService.verifyForgotOtp(request);

}

}