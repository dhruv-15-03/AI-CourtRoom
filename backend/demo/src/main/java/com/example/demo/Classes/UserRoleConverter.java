package com.example.demo.Classes;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class UserRoleConverter implements AttributeConverter<User.UserRole, String> {

    @Override
    public String convertToDatabaseColumn(User.UserRole attribute) {
        return attribute != null ? attribute.name() : null;
    }

    @Override
    public User.UserRole convertToEntityAttribute(String dbData) {
        if (dbData == null) return null;
        String v = dbData.trim().toUpperCase().replaceAll("\\s+", "_");
        // Map common frontend values
        if (v.equals("LAWYER")) return User.UserRole.ADVOCATE;
        if (v.equals("USER") || v.equals("CITIZEN")) return User.UserRole.CITIZEN;
        if (v.equals("JUDGE")) return User.UserRole.JUDGE;
        if (v.equals("SENIOR_ADVOCATE")) return User.UserRole.SENIOR_ADVOCATE;
        try {
            return User.UserRole.valueOf(v);
        } catch (IllegalArgumentException ex) {
            return User.UserRole.CITIZEN;
        }
    }
}
