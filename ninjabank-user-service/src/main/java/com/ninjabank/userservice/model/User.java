package com.ninjabank.userservice.model;

import com.ninjabank.userservice.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;

    private String lastName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Role role;

    private String otp;

    private LocalDateTime otpExpiry;

    @Column(nullable = false)
    private boolean enabled = true;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private String forgotPasswordOtp;

    private LocalDateTime forgotPasswordOtpExpiry;

    @Column(nullable = false)
    private boolean forgotPasswordOtpVerified = false;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        enabled = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
