package com.example.BankingSystem.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "pending_users")
@Data
public class PendingUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(unique = true)
    private String email;

    private String password;

    private String phoneNumber;

    private LocalDate dateOfBirth;

    private String otp;

    private LocalDateTime otpExpiry;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}