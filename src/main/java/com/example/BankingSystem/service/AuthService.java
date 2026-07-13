package com.example.BankingSystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.BankingSystem.dto.LoginRequest;
import com.example.BankingSystem.dto.SignupRequest;
import com.example.BankingSystem.model.User;
import com.example.BankingSystem.repository.UserRepository;
import com.example.BankingSystem.security.JwtService;

@Service
public class AuthService {

    private final PasswordEncoder passwordencoder;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    UserRepository repo;
    @Autowired
    JwtService jwtservice;


    AuthService(PasswordEncoder passwordencoder) {
        this.passwordencoder = passwordencoder;
    }


    public String login(LoginRequest request) {
         authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    request.getEmail(),
                    request.getPassword()
            )
    );

        return jwtservice.generateToken(request.getEmail());

}
public String signUp(SignupRequest request){
    
        if (repo.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordencoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        user.setDateOfBirth(request.getDateOfBirth());

        repo.save(user);
        return "User Saved Succesfully";

}


}