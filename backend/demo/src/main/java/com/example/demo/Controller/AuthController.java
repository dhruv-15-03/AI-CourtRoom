package com.example.demo.Controller;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import com.example.demo.Implementation.CustomerUser;
import com.example.demo.Response.AuthResponse;
import com.example.demo.Response.Login;
import com.example.demo.Config.JwtProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class AuthController {
    @Autowired
    private UserAll userAll;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private CustomerUser customerUser;
    @PostMapping("/signup")
    public AuthResponse add(@RequestBody User user) throws Exception {
        User newUser = new User();

        User check=userAll.searchByEmail(user.getEmail());
        if(check!=null){
            throw new Exception("User exist with email :" + user.getEmail());
        }
        newUser.setDescription(user.getDescription());
        newUser.setRole(user.getRole());
        newUser.setBench(user.getBench());
        newUser.setFees(user.getFees());
        newUser.setImage(user.getImage());
        newUser.setMobile(user.getMobile());
        newUser.setSpecialisation(user.getSpecialisation());
        newUser.setYears(user.getYears());
        newUser.setCourt(user.getCourt());
        newUser.setIsLawyer(user.getRole().equalsIgnoreCase("lawyer"));
        newUser.setIsJudge(user.getRole().equalsIgnoreCase("judge"));
        newUser.setFirstName(user.getFirstName());
        newUser.setLastName(user.getLastName());
        newUser.setEmail(user.getEmail()); // Fix: Set email field
        newUser.setPassword(passwordEncoder.encode(user.getPassword()));
        
        // Save user first to get a valid user with email
        userAll.save(newUser);
        
        // Create authentication with the email
        Authentication authentication=new UsernamePasswordAuthenticationToken(newUser.getEmail(),newUser.getPassword());
        String token = JwtProvider.generateToken(authentication);

        return new AuthResponse(token,"Registered Successfully");
    }
    @PostMapping("/login")
    public AuthResponse login(@RequestBody Login login) throws Exception {
        Authentication authentication=authenticate(login.getEmail(),login.getPassword());
        String token = JwtProvider.generateToken(authentication);
        return new AuthResponse(token,"Login Successfully");

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
