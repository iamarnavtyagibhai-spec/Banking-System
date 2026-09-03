# ==========================================
# Multi-Stage Dockerfile for Banking System
# ==========================================

# ------------------------------------------
# Stage 1: Build JAR using Maven
# ------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Copy pom.xml and download dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production package
COPY src ./src
RUN mvn clean package -DskipTests

# ------------------------------------------
# Stage 2: Lightweight Production Runtime
# ------------------------------------------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Add non-root system user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy compiled JAR from build stage
COPY --from=builder /app/target/*.jar app.jar

# Expose default Spring Boot application port
EXPOSE 8080

# Configure JVM memory optimizations for container environment
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Run application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
