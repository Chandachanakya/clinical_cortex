# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅ Active |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

Instead, please report them responsibly via email:

📧 **security@clinical-cortex.dev** *(or open a private security advisory on GitHub)*

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

| Action | Timeline |
|--------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 1 week |
| Patch release | Within 2 weeks of confirmation |

## Security Best Practices

When deploying Clinical Cortex, ensure:

1. **Never commit `.env` files** — they contain secrets
2. **Rotate JWT secret keys** regularly in production
3. **Use Connection Pooling** for database connections
4. **Enable Row Level Security (RLS)** in Supabase
5. **Keep dependencies updated** — run `pip audit` and `npm audit` periodically
6. **Use HTTPS** in production — never serve over plain HTTP
7. **Set strong database passwords** — avoid defaults
8. **Monitor audit logs** for unauthorized access patterns

## HIPAA Considerations

This system handles Protected Health Information (PHI). Deployers are responsible for:

- Ensuring BAA (Business Associate Agreement) with hosting providers
- Configuring encryption at rest and in transit
- Implementing access controls and audit trails
- Complying with local healthcare data regulations

---

> This security policy applies to the Clinical Cortex open-source project. Deployers are solely responsible for their production security posture.
