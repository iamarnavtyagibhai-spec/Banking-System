package com.ninjabank.userservice.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.ninjabank.userservice.model.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime createdAt;

    private String otp;

    private LocalDateTime otpExpiry;

    private boolean enabled;

    private LocalDateTime updatedAt;

    private String forgotPasswordOtp;

    private LocalDateTime forgotPasswordOtpExpiry;

    private boolean forgotPasswordOtpVerified;
}
