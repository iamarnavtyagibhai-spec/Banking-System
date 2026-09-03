package com.example.BankingSystem.service;

import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.BankingSystem.repository.AccountRepository;
@Service
public class AccountNumberGenerator {
@Autowired
private AccountRepository accountRepository;

public String generateAccountNumber() {

    Random random = new Random();

    while (true) {

        String accountNumber = String.valueOf(
                100000000000L + (long) (random.nextDouble() * 900000000000L)
        );

        if (!accountRepository.existsByAccountNumber(accountNumber)) {
            return accountNumber;
        }
    }
}

}
