# Caching Strategy Configuration

## CACHING STRATEGY: Comprehensive caching configuration for optimal performance

This document describes the caching strategy for the application, including:
- Cache-Control headers (server configuration)
- ETag / Last-Modified support
- Service Worker caching strategies

---

## 1. Cache-Control Headers

### Server Configuration (Nginx)

For Astro static sites, Cache-Control headers are configured at the web server level. Here's the recommended configuration:

```nginx
# Static Assets (Images, Fonts) - Long-term cache with immutable
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header ETag on;
    access_log off;
}

location ~* \.(woff|woff2|ttf|eot|otf)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header ETag on;
    access_log off;
}

# CSS and JavaScript - Medium-term cache with versioning
location ~* \.(css|js)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, must-revalidate";
    add_header ETag on;
    access_log off;
}

# HTML Pages - Short-term cache with revalidation
location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600, must-revalidate";
    add_header ETag on;
    add_header Last-Modified on;
}

# Service Worker - Never cache
location = /sw.js {
    add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0";
    add_header Pragma "no-cache";
    add_header Expires "0";
}

# Manifest - Short cache
location = /manifest.webmanifest {
    expires 1d;
    add_header Cache-Control "public, max-age=86400, must-revalidate";
}
```

### Cache-Control Strategy by Resource Type

| Resource Type | Cache-Control | TTL | Strategy |
|--------------|---------------|-----|----------|
| Images (webp, jpg, png) | `public, max-age=31536000, immutable` | 1 year | Long-term cache |
| Fonts (woff2) | `public, max-age=31536000, immutable` | 1 year | Long-term cache |
| CSS | `public, max-age=2592000, must-revalidate` | 30 days | Medium-term with revalidation |
| JavaScript | `public, max-age=2592000, must-revalidate` | 30 days | Medium-term with revalidation |
| HTML | `public, max-age=3600, must-revalidate` | 1 hour | Short-term with revalidation |
| Service Worker | `no-cache, no-store, must-revalidate` | 0 | Never cache |

---

## 2. ETag / Last-Modified

### Server Configuration

ETag and Last-Modified headers are automatically handled by Nginx when enabled:

```nginx
# Enable ETag support (default in Nginx)
etag on;

# Enable Last-Modified (default in Nginx)
# Files are automatically served with Last-Modified header based on file modification time
```

### How It Works

1. **ETag**: Nginx generates ETag based on file modification time and size
2. **Last-Modified**: Nginx uses file's modification timestamp
3. **Client Behavior**: Browser sends `If-None-Match` (ETag) or `If-Modified-Since` (Last-Modified) headers
4. **Server Response**: 
   - If unchanged: `304 Not Modified` (saves bandwidth)
   - If changed: `200 OK` with new content

### Benefits

- **Bandwidth Savings**: 304 responses save bandwidth for unchanged resources
- **Faster Loads**: Browser can use cached version without re-downloading
- **Automatic**: Works transparently with browser cache

---

## 3. Service Worker Caching

### Current Implementation

Service Worker (`/public/sw.js`) implements optimized caching strategies:

#### Caching Strategies by Resource Type

| Resource Type | Strategy | TTL | Description |
|--------------|----------|-----|-------------|
| HTML | Network-first | 1 hour | Always try network first, fallback to cache |
| Images | Stale-while-revalidate | 1 year | Return cache immediately, update in background |
| Fonts/CSS | Cache-first | 1 year | Use cache if available, fetch if not |
| JavaScript | Stale-while-revalidate | 30 days | Return cache immediately, update in background |
| CDN Resources | Cache-first | 7 days | Cache CDN resources with shorter TTL |

### Service Worker Features

1. **Versioning**: Cache names include version (`ai-model-v2.0`)
2. **Automatic Cleanup**: Old caches are automatically deleted on activation
3. **TTL Support**: Checks cache expiration based on TTL
4. **Error Handling**: Graceful fallbacks for network failures
5. **Update Detection**: Automatically checks for Service Worker updates

### Cache Management

```javascript
// Cache names (versioned for easy updates)
const CACHE_NAME = 'ai-model-v2.0';
const RUNTIME_CACHE = 'runtime-v2.0';
const STATIC_CACHE = 'static-v2.0';
const CDN_CACHE = 'cdn-v2.0';
```

### Update Strategy

- **Install**: New SW installs in parallel, doesn't affect current SW
- **Activate**: New SW activates and takes control immediately (`skipWaiting`)
- **Cleanup**: Old caches are deleted on activation
- **Update Check**: Checks for updates every hour

---

## 4. Best Practices Applied

### ✅ Cache-Control Headers
- Static assets: `immutable` flag for versioned resources
- HTML: `must-revalidate` for content freshness
- Service Worker: `no-cache` to ensure always fresh

### ✅ ETag / Last-Modified
- Enabled on server for all resources
- Automatic 304 responses for unchanged resources
- Bandwidth savings for repeat visits

### ✅ Service Worker Caching
- Optimized strategies per resource type
- Versioned cache names for easy updates
- Automatic cleanup of old caches
- TTL-based expiration checking
- Graceful error handling

---

## 5. Performance Impact

### Expected Improvements

| Metric | Improvement | Reason |
|--------|-------------|--------|
| Repeat Visit Load Time | -70% | Service Worker + browser cache |
| Bandwidth Usage | -60% | ETag 304 responses + caching |
| Offline Support | ✅ | Service Worker fallbacks |
| Network Requests | -80% | Aggressive caching of static assets |

---

## 6. Monitoring

### Check Cache Headers

```bash
# Check Cache-Control header
curl -I https://illariooo.ru/fonts/inter-regular.woff2 | grep -i cache-control

# Check ETag header
curl -I https://illariooo.ru/fonts/inter-regular.woff2 | grep -i etag

# Check Last-Modified header
curl -I https://illariooo.ru/fonts/inter-regular.woff2 | grep -i last-modified
```

### Verify Service Worker

1. Open DevTools → Application → Service Workers
2. Check registration status
3. Verify cache contents in Cache Storage
4. Test offline functionality

---

## 7. Maintenance

### Updating Cache Versions

When updating Service Worker:
1. Increment `SW_VERSION` in `sw.js`
2. Update cache names
3. Old caches will be automatically cleaned up

### Cache Invalidation

For immediate cache invalidation:
- Change file names (e.g., `app-v1.js` → `app-v2.js`)
- Use query parameters with version (e.g., `style.css?v=2`)
- Service Worker will fetch new versions automatically

---

## Summary

✅ **Cache-Control**: Configured for optimal caching per resource type  
✅ **ETag / Last-Modified**: Enabled on server for bandwidth savings  
✅ **Service Worker**: Optimized strategies with versioning and TTL support  

All caching strategies are production-ready and follow industry best practices.

