# Security Policy

## Reporting Security Issues

Sutra is built with a **Security-First** mindset for enterprise mission-critical deployments.

If you discover a security vulnerability in Sutra, please do **NOT** open a public issue. Instead, report it privately to the maintainers:

* Email: `security@sutra-os.org` (or via GitHub Security Advisories)

We will respond promptly within 48 hours to assess the vulnerability and coordinate a patch release.

## Security Architecture Principles

* **Least Privilege**: All access is controlled by explicit RBAC and tenant boundaries.
* **Tamper-Evident Audit Logging**: All data mutations generate immutable audit trail entries with user, IP, and diff snapshots.
* **Isolated Tenants**: Multi-tenancy isolation enforced at query and database level.
* **Encrypted Secrets**: Sensitive identifiers (PAN, GSTIN, API keys, bank credentials) must be tokenized or encrypted at rest.
