package com.example.BankingSystem.service;

import com.example.BankingSystem.repository.PendingUserRepository;
import com.example.BankingSystem.service.EmailService;

import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.BankingSystem.dto.ForgotPasswordRequest;
import com.example.BankingSystem.dto.LoginRequest;
import com.example.BankingSystem.dto.ResendOtpRequest;
import com.example.BankingSystem.dto.ResetPasswordRequest;
import com.example.BankingSystem.dto.SignupRequest;
import com.example.BankingSystem.dto.VerifyOtpRequest;
import com.example.BankingSystem.model.Account;
import com.example.BankingSystem.model.PendingUser;
import com.example.BankingSystem.model.User;
import com.example.BankingSystem.model.enums.AccountStatus;
import com.example.BankingSystem.model.enums.AccountType;
import com.example.BankingSystem.model.enums.Role;
import com.example.BankingSystem.repository.AccountRepository;
import com.example.BankingSystem.repository.UserRepository;
import com.example.BankingSystem.security.JwtService;
@Service
public class AuthService {
    @Autowired
    OtpService otpService;
    @Autowired
    EmailService emailService;
    @Autowired
    PendingUserRepository pendingUserRepository;
    @Autowired
    PasswordEncoder passwordencoder;
    @Autowired
    JwtService jwtservice;


     @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AuthenticationManager authenticationmanager;
    @Autowired
    AccountNumberGenerator accountNumber;




    public String login(LoginRequest request) {
         authenticationmanager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
    );

        return jwtservice.generateToken(request.getEmail());

}
public String signUp(SignupRequest request) {

    // Check if user is already verified
    if (userRepository.findByEmail(request.getEmail()).isPresent()) {
        throw new RuntimeException("Email already registered");
    }

    // Find existing pending user or create new one
    PendingUser pendingUser = pendingUserRepository
            .findByEmail(request.getEmail())
            .orElse(new PendingUser());

    pendingUser.setFirstName(request.getFirstName());
    pendingUser.setLastName(request.getLastName());
    pendingUser.setEmail(request.getEmail());
    pendingUser.setPassword(passwordencoder.encode(request.getPassword()));
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

    emailService.sendOtp(
            pendingUser.getEmail(),
            otp
    );
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

    if (pendingUser.getOtp() == null ||
    !pendingUser.getOtp().equals(request.getOtp())) {
    throw new RuntimeException("Invalid OTP");
}

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

    // Create Account
    Account account = new Account();

    account.setUser(user);
    account.setAccountNumber(accountNumber.generateAccountNumber());
    account.setBalance(BigDecimal.ZERO);
    account.setAccountType(AccountType.SAVINGS);
    account.setAccountStatus(AccountStatus.ACTIVE);
    account.setCreatedAt(LocalDateTime.now());
    account.setUpdatedAt(LocalDateTime.now());

    accountRepository.save(account);

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

    emailService.sendOtp(
            pendingUser.getEmail(),
            otp
    );

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
    if (user.isForgotPasswordOtpVerified()==false){
        return "password change unsucesfull";


    }

   
    user.setForgotPasswordOtpVerified(false);
    user.setPassword(passwordencoder.encode(request.getNewPassword()));
    user.setUpdatedAt(LocalDateTime.now());
    user.setForgotPasswordOtp(null);
    user.setForgotPasswordOtpExpiry(null);
    user.setUpdatedAt(LocalDateTime.now());

    userRepository.save(user);

    return "Password changed successfully";
}

}