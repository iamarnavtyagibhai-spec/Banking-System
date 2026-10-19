package com.ninjabank.userservice.service;

import java.util.List;
import java.util.Map;

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

    @Value("${brevo.sender.name:NinjaBank}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtpEmail(String email, String otp) {
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
                    <body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #1a73e8;">NinjaBank - OTP Verification</h2>
                        <p>Hello,</p>
                        <p>Your verification code for NinjaBank is:</p>
                        <div style="background: #f1f3f4; padding: 15px 25px; border-radius: 8px; display: inline-block; margin: 15px 0;">
                            <span style="color: #1a73e8; letter-spacing: 6px; font-size: 32px; font-weight: bold;">%s</span>
                        </div>
                        <p>This code is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #888;">If you did not request this OTP, please ignore this email.</p>
                    </body>
                </html>
                """.formatted(otp);

        Map<String, Object> body = Map.of(
                "sender", sender,
                "to", receivers,
                "subject", "NinjaBank Verification OTP: " + otp,
                "htmlContent", html
        );

        System.out.println("=================================================");
        System.out.println("🔑 [NINJABANK OTP DISPATCH] Sending to: " + email + " | OTP: " + otp);
        System.out.println("=================================================");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            System.out.println("✅ Brevo Email Sent Successfully: " + response.getBody());
        } catch (Exception e) {
            System.err.println("⚠️ Brevo Email Send Failed: " + e.getMessage());
            System.out.println("💡 OTP was generated and printed in console: " + otp);
        }
    }
}
