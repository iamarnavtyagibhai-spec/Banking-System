package com.example.BankingSystem.dto;

import lombok.Data;

@Data
public class VerifyForgotOtpRequest {

    private String email;

    private String otp;

}