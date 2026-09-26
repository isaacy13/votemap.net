# OAuth callback

Vanilla HTTP. See [../README.md](../README.md).

```bash
# from repo root
node mvp/oauth/callback.mjs
```

Export `handleRequest(request, env)` to mount on Workers, Lambda Function URLs, etc. Pass secrets as a plain `env` object — no Cloudflare KV, D1, or other vendor APIs.
