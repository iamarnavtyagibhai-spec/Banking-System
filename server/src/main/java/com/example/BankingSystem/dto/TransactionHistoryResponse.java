package com.example.BankingSystem.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.BankingSystem.model.enums.TransactionStatus;

import lombok.Data;
@Data
public class TransactionHistoryResponse {

    private String direction; // SEND or RECEIVE

    private String otherAccount;

    private BigDecimal amount;

    private LocalDateTime createdAt;

    private TransactionStatus status;
}