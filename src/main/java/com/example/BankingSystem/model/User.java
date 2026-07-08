package com.example.BankingSystem.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.BankingSystem.model.enums.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name="users")
@Data
public class User {
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

private Role role;

private Boolean enabled;

private LocalDateTime createdAt;

private LocalDateTime updatedAt;

}
