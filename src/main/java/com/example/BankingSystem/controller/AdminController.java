package com.example.BankingSystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.BankingSystem.dto.AdminDepositRequest;
import com.example.BankingSystem.service.AdminService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @PostMapping("/deposit")
    public String deposit(@RequestBody AdminDepositRequest request) {
        return adminService.deposit(request);
    }
}