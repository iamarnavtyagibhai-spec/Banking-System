package com.example.BankingSystem.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.User;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByAccountNumber(String accountNumber);

    Optional<Account> findByUser(User user);
    boolean existsByAccountNumber(String accountNumber);

}
