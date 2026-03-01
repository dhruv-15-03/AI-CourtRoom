package com.example.demo.Controller;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import com.example.demo.Implementation.CustomerUser;
import com.example.demo.Response.AuthResponse;
import com.example.demo.Response.Login;
import com.example.demo.Config.JwtProvider;
import com.example.demo.Services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room-iota.vercel.app", "https://ai-courtroom.vercel.app"})
public class AuthController {
    @Autowired
    private UserAll userAll;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private CustomerUser customerUser;
    @Autowired
    private EmailService emailService;
    
    @PostMapping("/signup")
    public ResponseEntity<?> add(@RequestBody User user) throws Exception {
        User newUser = new User();

        User check=userAll.searchByEmail(user.getEmail());
        if(check!=null){
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "User already exists with email: " + user.getEmail());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        }
        newUser.setDescription(user.getDescription());
        newUser.setRole(user.getRole());
        newUser.setBench(user.getBench());
        newUser.setFees(user.getFees());
        newUser.setImage(user.getImage());
        newUser.setMobile(user.getMobile());
        newUser.setSpecialisation(user.getSpecialisation());
        newUser.setExperience(user.getExperience());
        newUser.setCourt(user.getCourt());
        newUser.setIsLawyer(user.getRole() == User.UserRole.ADVOCATE || 
                           user.getRole() == User.UserRole.SENIOR_ADVOCATE ||
                           user.getRole() == User.UserRole.PUBLIC_PROSECUTOR);
        newUser.setIsJudge(user.getRole() == User.UserRole.JUDGE ||
                          user.getRole() == User.UserRole.DISTRICT_JUDGE ||
                          user.getRole() == User.UserRole.HIGH_COURT_JUDGE ||
                          user.getRole() == User.UserRole.SUPREME_COURT_JUDGE);
        newUser.setFirstName(user.getFirstName());
        newUser.setLastName(user.getLastName());
        newUser.setEmail(user.getEmail());
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Set verification status as false initially
        newUser.setEmailVerified(false);
        newUser.setMobileVerified(false);
        newUser.setIsVerified(false);
        
        // Generate and set email OTP
        String otp = emailService.generateOTP();
        newUser.setEmailOtp(otp);
        newUser.setEmailOtpExpiry(LocalDateTime.now().plusMinutes(10));
        newUser.setEmailOtpAttempts(0);
        
        // Save user
        userAll.save(newUser);
        
        // Send verification OTP email
        String userName = newUser.getFirstName() != null ? newUser.getFirstName() : "User";
        emailService.sendOTPEmail(user.getEmail(), otp, userName);
        
        // Return response indicating verification needed
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Registration successful. Please verify your email.");
        response.put("requiresVerification", true);
        response.put("email", user.getEmail());
        response.put("emailVerified", false);
        response.put("mobileVerified", false);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Login login) throws Exception {
        // First check if user exists
        User user = userAll.searchByEmail(login.getEmail());
        if (user == null) {
            throw new BadCredentialsException("Invalid email or password");
        }
        
        // Verify password
        if (!passwordEncoder.matches(login.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        
        // Check verification status
        boolean emailVerified = Boolean.TRUE.equals(user.getEmailVerified());
        boolean mobileVerified = Boolean.TRUE.equals(user.getMobileVerified());
        boolean fullyVerified = Boolean.TRUE.equals(user.getIsVerified());
        
        // If not fully verified, return verification required response
        if (!fullyVerified) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("requiresVerification", true);
            response.put("email", user.getEmail());
            response.put("emailVerified", emailVerified);
            response.put("mobileVerified", mobileVerified);
            response.put("message", "Please complete verification to login");
            
            // If email not verified, send new OTP
            if (!emailVerified) {
                String otp = emailService.generateOTP();
                user.setEmailOtp(otp);
                user.setEmailOtpExpiry(LocalDateTime.now().plusMinutes(10));
                userAll.save(user);
                
                String userName = user.getFirstName() != null ? user.getFirstName() : "User";
                emailService.sendOTPEmail(user.getEmail(), otp, userName);
                response.put("otpSent", true);
            }
            
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
        
        // User is verified - proceed with login
        Authentication authentication = authenticate(login.getEmail(), login.getPassword());
        String token = JwtProvider.generateToken(authentication);
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userAll.save(user);
        
        return ResponseEntity.ok(new AuthResponse(token, "Login Successfully"));
    }

    private Authentication authenticate(String email, String password)  {
        UserDetails userDetails=customerUser.loadUserByUsername(email);
        if(userDetails==null){
            throw new BadCredentialsException("Invalid email");
        }
        if(!passwordEncoder.matches(password,userDetails.getPassword())){
            throw new BadCredentialsException("Password is incorrect");

        }
        return new UsernamePasswordAuthenticationToken(userDetails,null,userDetails.getAuthorities());
    }
}
