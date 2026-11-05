/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@known/core", "@known/chain", "@known/memory"],
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
