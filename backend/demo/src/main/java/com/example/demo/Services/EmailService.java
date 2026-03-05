package com.example.demo.Services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;

/**
 * Email service for sending OTP and verification emails
 */
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@ai-courtroom.com}")
    private String fromEmail;

    @Value("${app.name:AI Courtroom}")
    private String appName;

    private static final SecureRandom random = new SecureRandom();

    /**
     * Generate a 6-digit OTP
     */
    public String generateOTP() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Send OTP email for verification
     */
    public boolean sendOTPEmail(String toEmail, String otp, String userName) {
        if (mailSender == null) {
            System.out.println("[DEV MODE] Email OTP for " + toEmail + ": " + otp);
            return true; // Development mode - no mail sender configured
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Verify your " + appName + " account - OTP: " + otp);

            String htmlContent = buildOTPEmailTemplate(otp, userName);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            return true;
        } catch (MessagingException e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send simple text email
     */
    public boolean sendSimpleEmail(String toEmail, String subject, String body) {
        if (mailSender == null) {
            System.out.println("[DEV MODE] Email to " + toEmail + ": " + subject);
            return true;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
            return false;
        }
    }

    /**
     * Send welcome email after successful registration
     */
    public boolean sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Welcome to " + appName + "!";
        String body = "Dear " + userName + ",\n\n" +
                "Welcome to " + appName + "! Your account has been successfully verified.\n\n" +
                "You now have access to:\n" +
                "- 3 free AI legal consultations\n" +
                "- Case analysis and predictions\n" +
                "- Connect with verified lawyers\n\n" +
                "Upgrade to Pro for unlimited access!\n\n" +
                "Best regards,\n" +
                "The " + appName + " Team";
        
        return sendSimpleEmail(toEmail, subject, body);
    }

    /**
     * Send subscription confirmation email
     */
    public boolean sendSubscriptionEmail(String toEmail, String userName, String planName, String validUntil) {
        String subject = "Subscription Activated - " + planName;
        String body = "Dear " + userName + ",\n\n" +
                "Your " + planName + " subscription has been activated!\n\n" +
                "Valid until: " + validUntil + "\n\n" +
                "Enjoy your premium access to all AI legal features.\n\n" +
                "Best regards,\n" +
                "The " + appName + " Team";
        
        return sendSimpleEmail(toEmail, subject, body);
    }

    /**
     * Build HTML template for OTP email
     */
    private String buildOTPEmailTemplate(String otp, String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #1e3a8a 0%%, #3b82f6 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
                    .otp-box { background: linear-gradient(135deg, #d97706 0%%, #f59e0b 100%%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px 40px; border-radius: 10px; display: inline-block; margin: 20px 0; }
                    .footer { background: #1e293b; color: #94a3b8; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
                    .warning { color: #dc2626; font-size: 12px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚖️ AI Courtroom</h1>
                        <p>Email Verification</p>
                    </div>
                    <div class="content">
                        <p>Hello %s,</p>
                        <p>Your One-Time Password (OTP) for email verification is:</p>
                        <div style="text-align: center;">
                            <div class="otp-box">%s</div>
                        </div>
                        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                        <p class="warning">⚠️ Do not share this OTP with anyone. Our team will never ask for your OTP.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 AI Courtroom. All rights reserved.</p>
                        <p>If you didn't request this OTP, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, otp);
    }
}
