package com.example.BankingSystem.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.User;

import jakarta.persistence.LockModeType;

public interface AccountRepository extends JpaRepository<Account, Long> {

    // Used during money transfer to lock the account row
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Account> findByAccountNumber(String accountNumber);

    // Used to find the logged-in user's account.
    // Lock is needed here because this account is modified during transfer.
    Optional<Account> findByUser(User user);

    // Used to check whether an account number already exists
    boolean existsByAccountNumber(String accountNumber);
}