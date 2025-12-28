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
  // Allow external connections for development
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        // Vercel URLs will be automatically allowed
      ],
    },
  },
};

module.exports = withPWA(nextConfig);

