# Addressr Integration Guide - Australian Address Autocomplete

## Overview

This guide will help you deploy Addressr (self-hosted Australian address lookup using G-NAF data) on your DigitalOcean infrastructure.

**Benefits:**
- ✅ Free (no API fees)
- ✅ Self-hosted (complete control)
- ✅ G-NAF official Australian address data
- ✅ Fast autocomplete
- ✅ No external dependencies

---

## Step 1: Deploy Addressr on DigitalOcean

### Option A: Docker Deployment (Recommended)

**1. SSH into your DigitalOcean droplet:**
```bash
ssh root@your-droplet-ip
```

**2. Install Docker (if not already installed):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

**3. Create Addressr directory:**
```bash
mkdir -p /opt/addressr
cd /opt/addressr
```

**4. Download G-NAF dataset:**
```bash
# Download latest G-NAF from data.gov.au
wget https://data.gov.au/data/dataset/19432f89-dc3a-4ef3-b943-5326ef1dbecc/resource/4b084096-65e4-4c8e-abbe-5e54ff85f42f/download/nov23_gnaf_pipeseparatedvalue.zip

# Or use the direct link to latest release
# Check: https://data.gov.au/dataset/ds-dga-19432f89-dc3a-4ef3-b943-5326ef1dbecc

# Extract
unzip nov23_gnaf_pipeseparatedvalue.zip -d gnaf-data
```

**5. Run Addressr Docker container:**
```bash
docker run -d \
  --name addressr \
  --restart unless-stopped \
  -p 8080:8080 \
  -v /opt/addressr/gnaf-data:/data \
  mountainpass/addressr:latest
```

**6. Verify it's running:**
```bash
curl http://localhost:8080/api/addresses?q=George%20Street
```

---

### Option B: Manual Node.js Deployment

**1. Install Node.js and dependencies:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

**2. Clone Addressr:**
```bash
git clone https://github.com/mountain-pass/addressr.git
cd addressr
npm install
```

**3. Download and configure G-NAF data:**
```bash
# Download as above, then configure path in addressr config
```

**4. Start Addressr:**
```bash
npm start
```

**5. Set up PM2 for production:**
```bash
npm install -g pm2
pm2 start npm --name "addressr" -- start
pm2 save
pm2 startup
```

---

## Step 2: Configure Nginx Reverse Proxy (Optional but Recommended)

**1. Install Nginx:**
```bash
apt-get install nginx
```

**2. Create Nginx config:**
```bash
nano /etc/nginx/sites-available/addressr
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name addressr.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Enable and restart:**
```bash
ln -s /etc/nginx/sites-available/addressr /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## Step 3: Update Luna Integration

**Once Addressr is deployed, update the API endpoint:**

### File: `/app/app/api/[[...path]]/route.js`

**Find this section:**
```javascript
// Address search (placeholder for Addressr)
if (pathname === '/api/address-search') {
  try {
    const url = new URL(request.url)
    const searchQuery = url.searchParams.get('q') || ''
    
    // TODO: Replace with real Addressr API call when deployed
```

**Replace with:**
```javascript
// Address search (Addressr)
if (pathname === '/api/address-search') {
  try {
    const url = new URL(request.url)
    const searchQuery = url.searchParams.get('q') || ''
    
    if (!searchQuery || searchQuery.length < 3) {
      return NextResponse.json({ suggestions: [] })
    }
    
    // Call Addressr API
    const addressrUrl = process.env.ADDRESSR_URL || 'http://localhost:8080'
    const response = await fetch(
      `${addressrUrl}/api/addresses?q=${encodeURIComponent(searchQuery)}&limit=10`
    )
    
    if (!response.ok) {
      throw new Error('Addressr API error')
    }
    
    const data = await response.json()
    
    // Transform Addressr format to our format
    const suggestions = data.addresses.map(addr => ({
      street: addr.streetAddress || addr.address,
      suburb: addr.locality,
      state: addr.state,
      postcode: addr.postcode,
      line2: addr.flatNumber ? `Unit ${addr.flatNumber}` : ''
    }))
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Addressr error:', error)
    return NextResponse.json({ suggestions: [] }, { status: 200 })
  }
}
```

**Add to `.env`:**
```env
# Addressr Configuration
ADDRESSR_URL=http://localhost:8080
# Or if using external domain: https://addressr.yourdomain.com
```

---

## Step 4: Test the Integration

**1. Test Addressr directly:**
```bash
curl "http://localhost:8080/api/addresses?q=George%20Street&limit=5"
```

**Expected response:**
```json
{
  "addresses": [
    {
      "address": "1 George Street",
      "locality": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "streetAddress": "1 George Street"
    },
    ...
  ]
}
```

**2. Test via Luna:**
- Go to `/luna`
- Proceed to Stage 2
- Start typing an address in the residential address field
- You should see real Australian addresses appear

---

## Step 5: Production Checklist

- [ ] Addressr deployed and running
- [ ] G-NAF data downloaded and loaded (latest version)
- [ ] Nginx reverse proxy configured (optional)
- [ ] ADDRESSR_URL environment variable set
- [ ] API endpoint updated with real Addressr call
- [ ] Restart Next.js: `sudo supervisorctl restart nextjs`
- [ ] Test address autocomplete in Luna
- [ ] Verify manual entry fallback works
- [ ] Test on mobile devices

---

## Troubleshooting

### Addressr not starting?
```bash
# Check logs
docker logs addressr

# Or if using PM2
pm2 logs addressr
```

### No results appearing?
- Check G-NAF data is properly loaded
- Verify ADDRESSR_URL is correct
- Check API response format matches expected structure
- Look for CORS issues (should be fine with same domain)

### Performance issues?
- Ensure G-NAF data is indexed (should be automatic)
- Consider adding Redis cache layer
- Use Nginx caching

---

## Alternative: Use Free Third-Party API (Temporary)

If you want to get started quickly while setting up Addressr, you can use Australia Post's free API temporarily:

**Update the endpoint to:**
```javascript
// Australia Post PAF API (free tier)
const response = await fetch(
  `https://auspost.com.au/api/postcode/search.json?q=${encodeURIComponent(searchQuery)}`,
  {
    headers: {
      'Auth-Key': process.env.AUSPOST_API_KEY
    }
  }
)
```

**Note:** This requires API key signup and has rate limits. Addressr is better for production.

---

## Summary

**Current State:**
- ✅ Frontend component ready (`AddressAutocomplete.js`)
- ✅ API endpoint placeholder ready
- ✅ Manual entry fallback working
- ⏳ Waiting for Addressr deployment

**After Addressr deployment:**
- Just update the API endpoint code
- Add ADDRESSR_URL to .env
- Restart Next.js
- Real Australian address autocomplete will work instantly!

---

**Estimated Setup Time:** 30-60 minutes  
**Difficulty:** Moderate (mostly just following commands)

**Need help?** The Addressr GitHub has great documentation: https://github.com/mountain-pass/addressr
