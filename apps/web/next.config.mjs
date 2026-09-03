/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@modelforge/benchmark-schema',
    '@modelforge/hardware-registry',
    '@modelforge/model-fit',
    '@modelforge/optimizer',
    '@modelforge/database',
    '@modelforge/api-client'
  ],
  reactStrictMode: true,
  poweredByHeader: false
};

export default nextConfig;
