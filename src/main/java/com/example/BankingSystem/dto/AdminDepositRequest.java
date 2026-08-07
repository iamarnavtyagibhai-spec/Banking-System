package com.example.BankingSystem.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class AdminDepositRequest {

    private String accountNumber;
    private BigDecimal amount;

}