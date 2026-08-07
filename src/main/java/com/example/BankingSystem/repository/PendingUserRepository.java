package com.example.BankingSystem.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.BankingSystem.model.PendingUser;


public interface PendingUserRepository
        extends JpaRepository<PendingUser, Long> {

    Optional<PendingUser> findByEmail(String email);

}
