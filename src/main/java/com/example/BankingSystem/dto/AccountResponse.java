package com.example.BankingSystem.dto;

import java.math.BigDecimal;

import com.example.BankingSystem.model.enums.AccountStatus;
import com.example.BankingSystem.model.enums.AccountType;

import lombok.Data;

@Data
public class AccountResponse {

    private String accountNumber;

    private AccountType accountType;

    private BigDecimal balance;

    private AccountStatus accountStatus;
}