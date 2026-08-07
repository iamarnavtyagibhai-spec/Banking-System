package com.example.BankingSystem.service;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.BankingSystem.dto.AdminDepositRequest;
import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.User;
import com.example.BankingSystem.repository.AccountRepository;
import com.example.BankingSystem.repository.UserRepository;

import jakarta.transaction.Transactional;
@Service
public class AdminService {


    @Autowired
    AccountRepository  accountRepository;
    @Autowired
    UserRepository  userRepository;

    @Transactional
    public String deposit(AdminDepositRequest request){
     Account account = accountRepository
        .findByAccountNumber(request.getAccountNumber())
        .orElseThrow(() -> new RuntimeException("Account not found"));
    if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
    throw new RuntimeException("Amount must be greater than zero");
}
    account.setBalance(
    account.getBalance().add(request.getAmount())
);

  return "Deposit Successfully";
    }

}
