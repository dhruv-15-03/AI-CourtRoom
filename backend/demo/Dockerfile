# Use Eclipse Temurin (official OpenJDK distribution) - Alpine for smaller image size
FROM eclipse-temurin:17-jre-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the built JAR file
COPY --chown=spring:spring target/*.jar app.jar

# Switch to non-root user
USER spring:spring

# Expose the application port
EXPOSE 8081

# Configure JVM for containerized environment
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Run the application with optimized JVM settings
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
