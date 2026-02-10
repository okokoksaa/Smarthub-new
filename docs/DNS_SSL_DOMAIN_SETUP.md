# DNS / SSL / Domain Setup

## Recommended domains
- Frontend: `app.<domain>` (Vercel)
- API: `api.<domain>` (Railway/Render)

## DNS records
1. `app.<domain>`
   - CNAME -> Vercel target (`cname.vercel-dns.com` or project-provided value)
2. `api.<domain>`
   - CNAME -> Railway/Render service hostname
3. Root (`<domain>`)
   - A/ALIAS/ANAME -> Vercel as provider recommends

## SSL
- Vercel: automatic certificate after domain verification.
- Railway/Render: automatic certificate after DNS propagation.

## App config updates
- Frontend env: `VITE_API_GATEWAY_URL=https://api.<domain>/api/v1`
- Backend env: `CORS_ORIGIN=https://app.<domain>,https://<domain>`

## Verification
- `dig app.<domain> +short`
- `dig api.<domain> +short`
- `curl -I https://app.<domain>`
- `curl -I https://api.<domain>/api/v1/health`
