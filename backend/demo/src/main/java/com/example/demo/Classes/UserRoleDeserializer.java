package com.example.demo.Classes;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;

public class UserRoleDeserializer extends JsonDeserializer<User.UserRole> {
    @Override
    public User.UserRole deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        String value = p.getText();
        if (value == null) return null;
        String v = value.trim().toUpperCase().replaceAll("\\s+", "_");

        // Common mappings
        if (v.equals("LAWYER")) return User.UserRole.ADVOCATE;
        if (v.equals("USER") || v.equals("CITIZEN")) return User.UserRole.CITIZEN;
        if (v.equals("JUDGE")) return User.UserRole.JUDGE;
        if (v.equals("SENIOR_ADVOCATE")) return User.UserRole.SENIOR_ADVOCATE;
        // Try direct match
        try {
            return User.UserRole.valueOf(v);
        } catch (IllegalArgumentException ex) {
            // fallback to CITIZEN
            return User.UserRole.CITIZEN;
        }
    }
}
