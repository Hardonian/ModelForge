# MODELForge Operational Runbook: Credential & Secret Rotation

## 1. Overview & Rotation Cadence

To maintain strict zero-trust security posture, enterprise credentials must be rotated on a regular schedule or immediately following any suspected compromise:

- **Database Credentials**: Every 90 days.
- **Hugging Face Hub Access Tokens**: Every 90 days or upon developer departure.
- **Stripe Webhook Signing Secrets**: Annually or during webhook endpoint migration.
- **Worker Authentication HMAC Keys**: Every 60 days.

---

## 2. Database Password Rotation

1. Generate a high-entropy password (>= 32 characters, uppercase, lowercase, numbers, symbols).
2. Update the role in PostgreSQL:

   ```sql
   ALTER USER modelforge_app WITH PASSWORD 'NEW_STRONG_PASSWORD_HERE';
   ```

3. Update `DATABASE_URL` in cloud secrets manager (e.g. AWS Secrets Manager / Vault).
4. Perform rolling restart of web application and control plane containers.
5. Verify connectivity:

   ```bash
   curl -s https://api.modelforge.dev/api/health | jq .
   ```

---

## 3. Hugging Face Access Token Rotation

1. Navigate to Hugging Face Settings -> Access Tokens.
2. Create a new token with `read` permissions for private enterprise model weights.
3. Update `HF_TOKEN` environment variable in deployment cluster.
4. Revoke the old token after confirming successful model card lookup.

---

## 4. Stripe Webhook Secret Rotation

1. In the Stripe Dashboard -> Developers -> Webhooks, select the ModelForge endpoint.
2. Click **Roll Secret** and set expiration window to 24 hours (allows both secrets during transition).
3. Update `STRIPE_WEBHOOK_SECRET` in production configuration.
4. Verify incoming payment event signatures.
