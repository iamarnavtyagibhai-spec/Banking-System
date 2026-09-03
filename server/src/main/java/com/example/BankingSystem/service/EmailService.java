package com.example.BankingSystem.service;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String apiKey;

    @Value("${brevo.sender.email:iamarnavtyagibhai@11798839.brevosend.com}")
    private String senderEmail;

    @Value("${brevo.sender.name:Banking System}")
    private String senderName;

    @Autowired
    private RestTemplate restTemplate;

    public void sendOtp(String email, String otp) {

        String url = "https://api.brevo.com/v3/smtp/email";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> sender = Map.of(
                "name", senderName,
                "email", senderEmail
        );

        Map<String, Object> receiver = Map.of(
                "email", email
        );

        List<Map<String, Object>> receivers = List.of(receiver);

        String html = """
                <html>
                    <body>
                        <h2>OTP Verification</h2>
                        <p>Your OTP is:</p>
                        <h1>%s</h1>
                        <p>This OTP is valid for 5 minutes.</p>
                    </body>
                </html>
                """.formatted(otp);

        Map<String, Object> body = Map.of(
                "sender", sender,
                "to", receivers,
                "subject", "OTP Verification",
                "htmlContent", html
        );

        System.out.println("=================================================");
        System.out.println("🔑 [OTP DISPATCH] Email: " + email + " | OTP: " + otp);
        System.out.println("=================================================");

        HttpEntity<Map<String, Object>> entity =
                new HttpEntity<>(body, headers);
        try {
            ResponseEntity<String> response =
                    restTemplate.postForEntity(
                            url,
                            entity,
                            String.class
                    );

            System.out.println("✅ Brevo Response: " + response.getBody());
        } catch (Exception e) {
            System.err.println("⚠️ Brevo Sending Notice: " + e.getMessage());
            System.out.println("💡 OTP was generated and saved. Use OTP: " + otp + " to verify.");
        }
    }
}