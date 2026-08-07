package com.example.BankingSystem.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.Transaction;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {
            List<Transaction> findBySenderOrReceiver(
        Account sender,
        Account receiver
);

}