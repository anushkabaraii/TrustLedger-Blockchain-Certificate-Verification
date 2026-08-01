# TrustLedger – Blockchain Certificate Verification System

TrustLedger is a blockchain-inspired digital certificate issuance and verification system developed using Node.js, Express.js, EJS, CSS, and a JSON database.

The system allows an administrator to issue digital certificates while public users can verify certificate authenticity using a Certificate ID or QR code.

## Features

- Admin Authentication
- Admin Dashboard
- Digital Certificate Issuance
- Certificate List Management
- Public Certificate Verification
- QR Code Verification
- SHA-256 Certificate Hashing
- Previous Hash Linking
- Certificate Tamper Detection
- Blockchain Chain Integrity Validation
- Blockchain Records
- Printable Digital Certificates
- Responsive User Interface

## Technologies Used

- HTML5
- CSS3
- Bootstrap
- JavaScript
- Node.js
- Express.js
- EJS
- JSON Database
- SHA-256 Cryptographic Hashing
- QR Code Generation

## System Flow

Public User:

Home → Verify Certificate → View Verified Certificate

Administrator:

Admin Login → Dashboard → Issue Certificate → Certificate List → Verify Certificate → Blockchain Records → Logout

## Blockchain-Inspired Implementation

Each certificate is assigned a SHA-256 cryptographic hash based on its certificate data.

New certificate records also store the hash of the previous certificate, creating a linked hash chain.

During verification, TrustLedger recalculates the certificate hash and compares it with the stored hash. If certificate data has been modified, the system detects the integrity failure.

The system also validates links between certificate records to detect modifications to the blockchain-style chain.

> Note: This academic project demonstrates blockchain principles through SHA-256 hash chaining and tamper detection. It does not use a decentralized Ethereum blockchain network.

## Security

- Admin-only protected routes
- Session-based authentication
- Environment variables for credentials and session secrets
- SHA-256 integrity verification
- Hash-chain validation
- Tamper detection

## Installation

Install dependencies:

```bash
npm install
