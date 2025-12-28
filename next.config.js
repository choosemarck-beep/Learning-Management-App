/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  // Allow external connections
  experimental: {
    serverActions: {
      allowedOrigins: [
        '192.168.1.4:3000', 
        'localhost:3000',
        'wallet-boston-symptoms-eagle.trycloudflare.com',
        'https://wallet-boston-symptoms-eagle.trycloudflare.com',
        // Cloudflare Pages URLs (will be added after deployment)
        '*.pages.dev',
      ],
    },
  },
};

module.exports = withPWA(nextConfig);

