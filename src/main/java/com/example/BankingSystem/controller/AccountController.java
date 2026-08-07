package com.example.BankingSystem.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.example.BankingSystem.dto.CreateAccountRequest;
import com.example.BankingSystem.dto.DepositRequest;
import com.example.BankingSystem.dto.TransactionHistoryResponse;
import com.example.BankingSystem.dto.TransferRequest;
import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.service.AccountService;

@RestController
@RequestMapping("/account")
public class AccountController {

    @Autowired
    private AccountService accountService;


    // Deposit

    // Transfer
    @PostMapping("/transfer")
    public String transfer(@RequestBody TransferRequest request) {
        return accountService.transfer(request);
    }

    // Account Details
    @GetMapping("/me")
    public AccountResponse getMyAccount() {
        return accountService.getMyAccount();
    }

    // Transaction History
    @GetMapping("/history")
    public List<TransactionHistoryResponse> getHistory() {
        return accountService.getTransactionHistory();
    }

}