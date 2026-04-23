import type { NextConfig } from "next";
import { tmpdir } from 'os';
import { join } from 'path';

const nextConfig: NextConfig = {
  // Allow dev access from network IP for mobile testing
  allowedDevOrigins: ['192.168.1.11'],
  
  // Move build cache to local temp dir to avoid slow network filesystem
  distDir: process.env.NODE_ENV === 'development' 
    ? join(tmpdir(), 'gestion-pyme-next-dev')
    : '.next',
  
  // Skip type checking during build (we run tsc --noEmit separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Turbopack config
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
};

export default nextConfig;
