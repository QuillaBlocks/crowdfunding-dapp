const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["crowdfunding-client"],
  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    optimizePackageImports: ["crowdfunding-client", "@stellar/stellar-sdk"],
  },
};

module.exports = nextConfig;
