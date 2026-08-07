package com.example.BankingSystem.service;

import java.util.List;

import com.example.BankingSystem.dto.AccountResponse;
import com.example.BankingSystem.dto.DepositRequest;
import com.example.BankingSystem.dto.SignupRequest;
import com.example.BankingSystem.dto.TransactionHistoryResponse;
import com.example.BankingSystem.dto.TransferRequest;
import com.example.BankingSystem.model.Account;

import jakarta.transaction.Transactional;

public interface AccountService {
    public String getMyAccountDetails();
    @Transactional
    public String transfer(TransferRequest request);
    public List<TransactionHistoryResponse> getTransactionHistory() ;
    AccountResponse getMyAccount();
   

  

}