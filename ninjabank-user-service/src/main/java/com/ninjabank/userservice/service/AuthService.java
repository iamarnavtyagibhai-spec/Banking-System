package com.ninjabank.userservice.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ninjabank.userservice.dto.ForgotPasswordRequest;
import com.ninjabank.userservice.dto.LoginRequest;
import com.ninjabank.userservice.dto.ResendOtpRequest;
import com.ninjabank.userservice.dto.ResetPasswordRequest;
import com.ninjabank.userservice.dto.SignupRequest;
import com.ninjabank.userservice.dto.VerifyOtpRequest;
import com.ninjabank.userservice.model.PendingUser;
import com.ninjabank.userservice.model.User;
import com.ninjabank.userservice.model.enums.Role;
import com.ninjabank.userservice.repository.PendingUserRepository;
import com.ninjabank.userservice.repository.UserRepository;
import com.ninjabank.userservice.security.JwtService;

@Service
public class AuthService {

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PendingUserRepository pendingUserRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthenticationManager authenticationManager;

    public String login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        return jwtService.generateToken(request.getEmail());
    }

    public String signUp(SignupRequest request) {
        // Check if user is already verified and exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        // Find existing pending user or initialize a new one
        PendingUser pendingUser = pendingUserRepository
                .findByEmail(request.getEmail())
                .orElse(new PendingUser());

        pendingUser.setFirstName(request.getFirstName());
        pendingUser.setLastName(request.getLastName());
        pendingUser.setEmail(request.getEmail());
        pendingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        pendingUser.setPhoneNumber(request.getPhoneNumber());
        pendingUser.setDateOfBirth(request.getDateOfBirth());

        String otp = otpService.generateOtp();

        pendingUser.setOtp(otp);
        pendingUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        if (pendingUser.getCreatedAt() == null) {
            pendingUser.setCreatedAt(LocalDateTime.now());
        }
        pendingUser.setUpdatedAt(LocalDateTime.now());

        pendingUserRepository.save(pendingUser);

        emailService.sendOtp(pendingUser.getEmail(), otp);

        return "OTP sent successfully";
    }

    @Transactional
    public String verifyOtp(VerifyOtpRequest request) {
        PendingUser pendingUser = pendingUserRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (otpService.isOtpExpired(pendingUser.getOtpExpiry())) {
            pendingUserRepository.delete(pendingUser);
            throw new RuntimeException("OTP Expired. Please signup again.");
        }

        if (pendingUser.getOtp() == null || !pendingUser.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        // 1. Create and persist User entity
        User user = new User();
        user.setFirstName(pendingUser.getFirstName());
        user.setLastName(pendingUser.getLastName());
        user.setEmail(pendingUser.getEmail());
        user.setPassword(pendingUser.getPassword());
        user.setPhoneNumber(pendingUser.getPhoneNumber());
        user.setDateOfBirth(pendingUser.getDateOfBirth());
        user.setRole(Role.USER);
        user.setEnabled(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        // NOTE: In this microservices architecture, Account creation is decoupled!
        // User Service responsibility finishes upon persisting the user.
        // Account Service will independently handle account generation.

        // 2. Remove pending user entry
        pendingUserRepository.delete(pendingUser);

        return "Email verified successfully";
    }

    public String resendOtp(ResendOtpRequest request) {
        PendingUser pendingUser = pendingUserRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Please signup first"));

        String otp = otpService.generateOtp();

        pendingUser.setOtp(otp);
        pendingUser.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        pendingUser.setUpdatedAt(LocalDateTime.now());

        pendingUserRepository.save(pendingUser);

        emailService.sendOtp(pendingUser.getEmail(), otp);

        return "OTP resent successfully";
    }

    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateOtp();

        user.setForgotPasswordOtp(otp);
        user.setForgotPasswordOtpExpiry(LocalDateTime.now().plusMinutes(5));
        user.setForgotPasswordOtpVerified(false);

        userRepository.save(user);

        emailService.sendOtp(user.getEmail(), otp);

        return "OTP sent successfully";
    }

    public String verifyForgotOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (otpService.isOtpExpired(user.getForgotPasswordOtpExpiry())) {
            user.setForgotPasswordOtp(null);
            user.setForgotPasswordOtpExpiry(null);
            user.setForgotPasswordOtpVerified(false);

            userRepository.save(user);

            throw new RuntimeException("OTP Expired");
        }

        if (user.getForgotPasswordOtp() == null ||
                !user.getForgotPasswordOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        user.setForgotPasswordOtpVerified(true);
        userRepository.save(user);

        return "OTP verified successfully";
    }

    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isForgotPasswordOtpVerified()) {
            throw new RuntimeException("Password reset unverified. Please verify OTP first.");
        }

        user.setForgotPasswordOtpVerified(false);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setForgotPasswordOtp(null);
        user.setForgotPasswordOtpExpiry(null);
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        return "Password changed successfully";
    }
}
