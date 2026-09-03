package com.example.BankingSystem.dto;


import java.math.BigDecimal;

import lombok.Data;

@Data
public class TransferRequest {

    private String receiverAccountNumber;

    private BigDecimal amount;

}