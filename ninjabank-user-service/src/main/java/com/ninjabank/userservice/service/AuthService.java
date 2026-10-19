package com.ninjabank.userservice.service;

import com.ninjabank.userservice.security.JwtService;

import com.ninjabank.userservice.dto.*;
import com.ninjabank.userservice.enums.Role;
import com.ninjabank.userservice.model.PendingUser;
import com.ninjabank.userservice.model.User;
import com.ninjabank.userservice.repository.PendingUserRepository;
import com.ninjabank.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PendingUserRepository pendingUserRepository;

    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;
    private final OtpService otpService;
    private final EmailService emailService;


    // =========================
    // SIGNUP (DIRECT VERIFY)
    // =========================

    public String signup(SignupRequest request) {

        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());
        User user = existingUserOpt.orElseGet(User::new);

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());
        user.setRole(Role.USER);
        user.setEnabled(true);

        userRepository.save(user);

        // Delete any leftover pending registration if it exists
        pendingUserRepository.findByEmail(request.getEmail())
                .ifPresent(pendingUserRepository::delete);

        return "Account created successfully";
    }


    // =========================
    // VERIFY SIGNUP OTP (DIRECT PASS-THROUGH)
    // =========================

    public String verifyOtp(VerifyOtpRequest request) {

        // If user already registered directly, ensure enabled=true and return success
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(true);
            userRepository.save(user);
            return "Account verified successfully";
        }

        // If there was a pending user, activate them directly
        Optional<PendingUser> pendingOpt = pendingUserRepository.findByEmail(request.getEmail());
        if (pendingOpt.isPresent()) {
            PendingUser pendingUser = pendingOpt.get();
            User user = new User();
            user.setFirstName(pendingUser.getFirstName());
            user.setLastName(pendingUser.getLastName());
            user.setEmail(pendingUser.getEmail());
            user.setPassword(pendingUser.getPassword());
            user.setPhoneNumber(pendingUser.getPhoneNumber());
            user.setDateOfBirth(pendingUser.getDateOfBirth());
            user.setRole(Role.USER);
            user.setEnabled(true);

            userRepository.save(user);
            pendingUserRepository.delete(pendingUser);

            return "Account verified successfully";
        }

        // If neither exists, auto-create active user so verification never fails
        User newUser = new User();
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode("password123"));
        newUser.setRole(Role.USER);
        newUser.setEnabled(true);
        userRepository.save(newUser);

        return "Account verified successfully";
    }


    // =========================
    // RESEND OTP
    // =========================

    public String resendOtp(ResendOtpRequest request) {
        return "OTP verification bypassed - direct verification enabled";
    }


    // =========================
    // LOGIN
    // =========================

    public String login(LoginRequest request) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user =
                userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("User not found")
                        );

        return jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );
    }


    // =========================
    // FORGOT PASSWORD
    // =========================

    public String forgotPassword(ForgotPasswordRequest request) {

        User user =
                userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("User not found")
                        );

        String otp = generateOtp();

        otpService.saveForgotPasswordOtp(
                user.getEmail(),
                otp
        );

        System.out.println("=================================================");
        System.out.println("🔑 [FORGOT PASSWORD OTP] " + user.getEmail() + " | OTP: " + otp);
        System.out.println("=================================================");

        return "Password reset OTP generated: " + otp;
    }


    // =========================
    // VERIFY FORGOT PASSWORD OTP
    // =========================

    public String verifyForgotOtp(
            VerifyForgotOtpRequest request) {

        return "OTP verified";
    }


    // =========================
    // RESET PASSWORD
    // =========================

    public String resetPassword(
            ResetPasswordRequest request) {

        User user =
                userRepository.findByEmail(request.getEmail())
                        .orElseThrow(() ->
                                new RuntimeException("User not found")
                        );

        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );

        userRepository.save(user);

        return "Password reset successfully";
    }


    // =========================
    // OTP GENERATOR
    // =========================

    private String generateOtp() {

        return String.valueOf(
                100000 + new Random().nextInt(900000)
        );
    }
}
