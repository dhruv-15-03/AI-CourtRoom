package com.example.demo.Implementation;

import com.example.demo.Classes.User;
import com.example.demo.Repository.UserAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerUser implements UserDetailsService {
    @Autowired
    private UserAll userAll;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user=userAll.searchByEmail(email);
        if(user==null){

            throw new UsernameNotFoundException("User not found");
        }
        List<GrantedAuthority> authorities=new ArrayList<>();
        return new org.springframework.security.core.userdetails.User(user.getEmail(),user.getPassword(),authorities);
    }
}
