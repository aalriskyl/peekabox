import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  experimental: {
    turbo: {
      resolveAlias: {
        '@': [path.resolve(__dirname, './src')],
      },
    },
  },
  webpack: (config) => {
    // Add path aliases for Webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
};

export default nextConfig;
