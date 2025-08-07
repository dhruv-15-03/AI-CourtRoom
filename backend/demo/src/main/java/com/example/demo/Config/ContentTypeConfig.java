package com.example.demo.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class ContentTypeConfig implements WebMvcConfigurer {

    @Override
    public void configureMessageConverters(List<HttpMessageConverter<?>> converters) {
        MappingJackson2HttpMessageConverter jsonConverter = new MappingJackson2HttpMessageConverter();
        
        jsonConverter.setSupportedMediaTypes(List.of(
            MediaType.APPLICATION_JSON,
            MediaType.valueOf("application/json;charset=UTF-8"),
            MediaType.valueOf("application/json;charset=utf-8"),
            MediaType.valueOf("application/json; charset=UTF-8"),
            MediaType.valueOf("application/json; charset=utf-8")
        ));
        
        converters.add(0, jsonConverter); // Add at the beginning to prioritize
    }
}
