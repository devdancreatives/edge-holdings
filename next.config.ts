import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ["/push-sw.js"],
  },
});

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/graphql": [
      "./node_modules/tiny-secp256k1/**/*",
      "./node_modules/tiny-secp256k1/lib/secp256k1.wasm",
    ],
  },
};

export default withPWA(nextConfig);
