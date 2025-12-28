# Cloudflare Pages Troubleshooting Guide

## Common Issues and Solutions

### Issue: Build Fails with Next.js Errors

**Solution**: Cloudflare Pages may need the `@cloudflare/next-on-pages` adapter for full Next.js 14 compatibility.

1. **Install the adapter**:
```bash
npm install --save-dev @cloudflare/next-on-pages
```

2. **Update package.json** build script:
```json
{
  "scripts": {
    "build": "npx @cloudflare/next-on-pages",
    "pages:build": "npx @cloudflare/next-on-pages"
  }
}
```

3. **Update Cloudflare Pages build settings**:
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`

### Issue: API Routes Not Working

**Possible Causes**:
- Serverless functions not properly configured
- Environment variables not set
- CORS issues

**Solutions**:
1. **Check environment variables** are set in Cloudflare Pages dashboard
2. **Verify API routes** are in `app/api` directory
3. **Check Cloudflare Pages logs** for specific errors
4. **Ensure NEXTAUTH_URL** matches your Cloudflare Pages URL exactly

### Issue: Database Connection Fails

**Solutions**:
1. **Verify DATABASE_URL** is correct in Cloudflare environment variables
2. **Check Railway database** is running and accessible
3. **Verify IP allowlist** in Railway (if enabled, you may need to allow Cloudflare IPs)
4. **Test connection** from your local machine first

### Issue: Authentication Not Working

**Solutions**:
1. **Check NEXTAUTH_URL** matches your Cloudflare Pages URL exactly (no trailing slash)
2. **Verify NEXTAUTH_SECRET** is set and matches between deployments
3. **Clear browser cookies** and try again
4. **Check browser console** for authentication errors

### Issue: Images Not Loading

**Solutions**:
1. **Verify image domains** in `next.config.js` if using external images
2. **Check image paths** are correct (relative vs absolute)
3. **Ensure images** are in `public` folder or properly uploaded

### Issue: PWA Not Working

**Solutions**:
1. **Check service worker** is generated in `public` folder
2. **Verify PWA config** in `next.config.js`
3. **Test in production** (PWA often disabled in development)

## Getting Help

1. **Check Cloudflare Pages Logs**:
   - Go to your project → "Deployments" → Click on deployment → "View build logs"

2. **Check Browser Console**:
   - Open browser DevTools (F12)
   - Look for errors in Console tab

3. **Check Network Tab**:
   - See which requests are failing
   - Check response codes and error messages

4. **Cloudflare Community**:
   - https://community.cloudflare.com/
   - Search for similar issues

5. **Cloudflare Pages Docs**:
   - https://developers.cloudflare.com/pages/
   - https://developers.cloudflare.com/pages/framework-guides/nextjs/

## Performance Tips

1. **Enable Cloudflare CDN** (automatic with Pages)
2. **Use Cloudflare Images** for image optimization
3. **Enable Cloudflare Analytics** to monitor performance
4. **Set up Cloudflare Workers** for edge computing (advanced)

## Security Checklist

- [ ] Environment variables are set (not hardcoded)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are not exposed in client-side code
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled (if needed)

