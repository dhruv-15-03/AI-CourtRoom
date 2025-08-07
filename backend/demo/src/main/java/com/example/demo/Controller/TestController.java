package com.example.demo.Controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
@CrossOrigin(origins = {"http://localhost:3000", "https://ai-court-room.vercel.app"})
public class TestController {
    
    @PostMapping(value = "/json", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, Object>> testJson(@RequestBody Map<String, Object> data) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "JSON request processed successfully");
        response.put("receivedData", data);
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("message", "Backend server is running");
        
        return ResponseEntity.ok(response);
    }
}
