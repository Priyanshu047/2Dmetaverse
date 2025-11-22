# Environment Configuration Examples

This file contains example environment configurations for different deployment scenarios.

## Development (Local)

```env
# .env (local development)
PORT=3001
MONGODB_URI=mongodb://localhost:27017/metaverse
JWT_SECRET=dev-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Development (MongoDB Atlas)

```env
# .env (with cloud MongoDB)
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metaverse?retryWrites=true&w=majority
JWT_SECRET=dev-secret-key-change-in-production
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Production (Cloud Hosted)

```env
# .env (production)
PORT=3001
MONGODB_URI=mongodb+srv://produser:strongpassword@production-cluster.mongodb.net/metaverse?retryWrites=true&w=majority
JWT_SECRET=use-very-strong-random-string-here-minimum-32-characters
CLIENT_URL=https://yourdomain.com
NODE_ENV=production
```

## Staging Environment

```env
# .env (staging)
PORT=3001
MONGODB_URI=mongodb+srv://staginguser:password@staging-cluster.mongodb.net/metaverse-staging?retryWrites=true&w=majority
JWT_SECRET=staging-secret-different-from-production
CLIENT_URL=https://staging.yourdomain.com
NODE_ENV=staging
```

## Docker Development

```env
# .env (Docker)
PORT=3001
MONGODB_URI=mongodb://mongo:27017/metaverse
JWT_SECRET=docker-dev-secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## Environment Variable Reference

### PORT
- **Description**: Port number for the HTTP server
- **Default**: 3001
- **Required**: No
- **Example**: `3001`, `8080`, `5000`

### MONGODB_URI
- **Description**: MongoDB connection string
- **Default**: `mongodb://localhost:27017/metaverse`
- **Required**: Yes (for production)
- **Formats**:
  - Local: `mongodb://localhost:27017/database_name`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/database_name`
  - Authentication: `mongodb://username:password@host:port/database_name`

### JWT_SECRET
- **Description**: Secret key for signing JWT tokens
- **Default**: Insecure default (for development only)
- **Required**: Yes (MUST change in production)
- **Recommendations**:
  - Minimum 32 characters
  - Use random string generator
  - Different for each environment
  - Never commit to version control
- **Generate**:
  ```bash
  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  
  # PowerShell
  -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
  ```

### CLIENT_URL
- **Description**: Frontend application URL (for CORS)
- **Default**: `http://localhost:5173`
- **Required**: Yes
- **Examples**:
  - Local: `http://localhost:5173`
  - Production: `https://app.yourdomain.com`
  - Multiple: (requires code change to array)

### NODE_ENV
- **Description**: Application environment mode
- **Default**: `development`
- **Required**: No
- **Values**: `development`, `production`, `staging`, `test`
- **Effects**:
  - Development: Verbose logging, stack traces
  - Production: Minimal logging, no stack traces

## MongoDB Atlas Setup

1. **Create Account**: Go to https://www.mongodb.com/cloud/atlas
2. **Create Cluster**: Choose free tier (M0)
3. **Create Database User**:
   - Go to Database Access
   - Add New Database User
   - Save username and password
4. **Whitelist IP**:
   - Go to Network Access
   - Add IP Address
   - Use `0.0.0.0/0` for development (allow all)
   - Use specific IPs for production
5. **Get Connection String**:
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `metaverse`

## Security Best Practices

### ✅ DO:
- Use different JWT_SECRET for each environment
- Store .env files outside version control (.gitignore)
- Use strong, random secrets (32+ characters)
- Rotate secrets periodically
- Use environment-specific MongoDB databases
- Enable MongoDB authentication in production
- Use HTTPS in production (CLIENT_URL)
- Whitelist specific IPs for MongoDB access

### ❌ DON'T:
- Commit .env files to Git
- Use default secrets in production
- Share secrets in plaintext
- Use same secrets across environments
- Allow all IPs (0.0.0.0/0) in production MongoDB
- Use HTTP in production

## Deployment Platforms

### Vercel / Netlify (Serverless)
Not recommended for this backend (uses persistent Socket.io connections)

### Heroku
```env
# Config Vars (Heroku Dashboard)
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Railway / Render
Similar to Heroku, set environment variables in dashboard

### AWS EC2 / DigitalOcean
Create `.env` file on server or use environment variables

### Docker
Use `.env` file or pass as arguments:
```bash
docker run -e PORT=3001 -e MONGODB_URI=... -e JWT_SECRET=... your-image
```

## Testing Different Environments

### Switch to Staging
```bash
# Copy staging config
cp .env.staging .env

# Restart server
npm run dev
```

### Use Production MongoDB in Development
```bash
# Temporarily update .env
MONGODB_URI=mongodb+srv://...production...

# Be careful! Don't modify production data
```

## Checklist Before Production

- [ ] Strong JWT_SECRET (32+ random characters)
- [ ] Production MongoDB cluster
- [ ] MongoDB authentication enabled
- [ ] IP whitelist configured (not 0.0.0.0/0)
- [ ] HTTPS for CLIENT_URL
- [ ] NODE_ENV=production
- [ ] .env file secured (not in Git)
- [ ] Secrets stored in hosting platform's env vars
- [ ] Different secrets from development
- [ ] MongoDB backups enabled
- [ ] Monitoring/logging set up

---

**Remember**: The `.env` file is gitignored. Never commit secrets to version control.
