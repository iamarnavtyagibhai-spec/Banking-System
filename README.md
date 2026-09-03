# 🏦 Enterprise Banking System Backend

A robust, secure, and production-ready **Banking System REST API** built with **Spring Boot 3**, **Spring Security 6 (JWT)**, **PostgreSQL (Neon)**, **Bucket4j Rate Limiting**, and **Brevo Transactional Email Service**.

---

## 🌟 Key Features

* **🔐 Authentication & Security**:
  * Stateless JWT authentication with role-based access control (`ADMIN` and `USER`).
  * 2-Step Registration with Email OTP Verification (`PendingUser` workflow).
  * Forgot Password and Reset Password via Email OTP verification.
  * Password hashing using **BCrypt**.
* **🛡️ Rate Limiting (Bucket4j)**:
  * IP-based rate limiting on sensitive authentication endpoints (Signup, Login, OTP verification, Password Reset) to mitigate brute-force attacks.
* **💳 Account & Transaction Management**:
  * Double-entry ledger money transfer with atomic transactional guarantees (`@Transactional`).
  * Self-transfer, inactive account, and negative/zero amount validation.
  * Complete transaction statement history (SENT / RECEIVED).
* **⚡ Admin Operations**:
  * Dedicated Admin endpoints for account deposits and maintenance.
* **🐳 Containerization & Deployment**:
  * Multi-stage `Dockerfile` with minimal JRE runtime and security non-root user.
  * `docker-compose.yml` for 1-command startup.
* **📬 Postman API Collection**:
  * Ready-to-import `Banking_System_API.postman_collection.json` with pre-configured requests and auto-token management.

---

## 📁 Project Structure

```
Banking-System/
├── server/                                   # Spring Boot Backend Service
│   ├── src/
│   │   ├── main/java/com/example/BankingSystem/
│   │   │   ├── controller/                   # REST Controllers (Auth, Account, Admin, Health)
│   │   │   ├── dto/                          # Request and Response DTOs
│   │   │   ├── exception/                    # Global Exception Handler & Custom Exceptions
│   │   │   ├── model/                        # JPA Entities (User, Account, Transaction, etc.)
│   │   │   ├── repository/                   # Spring Data JPA Repositories
│   │   │   ├── security/                     # JWT Filters, UserDetails & RateLimiter
│   │   │   └── service/                      # Business Logic Implementations
│   │   └── main/resources/
│   │       └── application.properties        # Application Configuration & Env bindings
│   ├── Dockerfile                            # Multi-stage Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── pom.xml                               # Maven Dependencies & Build Configuration
├── docker-compose.yml                        # Docker Compose Orchestration
├── Banking_System_API.postman_collection.json# Postman API Collection
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start with Docker

### Prerequisites
* [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### 1. Run with Docker Compose
```bash
docker compose up -d --build
```

### 2. View Live Logs
```bash
docker compose logs -f
```

### 3. Stop Containers
```bash
docker compose down
```

---

## 💻 Local Development (Without Docker)

### Prerequisites
* Java 17+
* Maven 3.9+ (or use included `./mvnw`)
* PostgreSQL Database

### Running the Server
```bash
cd server
./mvnw.cmd spring-boot:run
```

The server will start at: `http://localhost:8080`

---

## 📖 API Documentation & Endpoints

| Group | Method | Endpoint | Access | Description |
|---|---|---|---|---|
| **Health** | `GET` | `/auth/health` | Public | Health check |
| **Auth** | `POST` | `/auth/signup` | Public | Signup & send email OTP |
| **Auth** | `POST` | `/auth/verify-otp` | Public | Verify OTP & create savings account |
| **Auth** | `POST` | `/auth/resend-otp` | Public | Resend signup verification OTP |
| **Auth** | `POST` | `/auth/login` | Public | User login (returns JWT) |
| **Auth** | `POST` | `/auth/forgot-password` | Public | Request forgot password OTP |
| **Auth** | `POST` | `/auth/verify-forgot-otp` | Public | Verify forgot password OTP |
| **Auth** | `POST` | `/auth/reset-password` | Public | Set new password |
| **Account**| `GET` | `/account/me` | User (Bearer) | View account balance & details |
| **Account**| `POST` | `/account/transfer` | User (Bearer) | Transfer money to recipient account |
| **Account**| `GET` | `/account/history` | User (Bearer) | View transaction history |
| **Admin** | `POST` | `/admin/deposit` | Admin (Bearer)| Deposit funds into any account |

---

## 📬 Postman Import

1. Open Postman.
2. Click **Import** -> Select `Banking_System_API.postman_collection.json`.
3. Set your `baseUrl` (default: `http://localhost:8080`).
4. Execute `Login` request — the JWT token is automatically captured and applied to all protected routes!
