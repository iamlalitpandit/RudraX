# 🔐 Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 4.5.x   | ✅ Yes             |
| < 4.5   | ❌ No              |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in RudraX Army, please **do not** create a public GitHub issue.

Instead, report it privately:

- **Email**: lalittheonly@gmail.com
- **Telegram**: [@imlalitpandit](https://t.me/imlalitpandit)

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response timeline

- **24 hours**: Acknowledgment of receipt
- **7 days**: Initial assessment and fix timeline
- **30 days**: Patch release (if critical)

## Security Features in RudraX

RudraX Army has built-in security features:

- **JWT Authentication**: HS256 with PBKDF2-SHA512 password hashing
- **Approval Gates**: Human-in-the-loop for destructive operations (L1/L2/L3)
- **PII Detection**: Automatic redaction of emails, API keys, credentials
- **Code Sandbox**: Isolated execution with timeout protection
- **Guardrails**: Content filtering, consistency checking, hallucination detection
- **CSP Headers**: Content Security Policy enforced on WebUI

## Disclosure Policy

We follow coordinated disclosure:
1. Reporter submits vulnerability privately
2. We assess and verify
3. We develop and test fix
4. We release patch + advisory
5. Reporter gets credit (if desired)

Thank you for helping keep RudraX Army secure! 🔱
