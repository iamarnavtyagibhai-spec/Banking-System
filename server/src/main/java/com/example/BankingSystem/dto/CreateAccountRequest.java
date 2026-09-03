package com.example.BankingSystem.dto;

import com.example.BankingSystem.model.enums.AccountType;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateAccountRequest {

    @NotNull(message = "Account type is required")
    private AccountType accountType;

}