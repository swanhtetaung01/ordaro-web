import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // a self-contained server for the container: `node server.js`, no node_modules to install
  output: "standalone",
  poweredByHeader: false,
};

export default withNextIntl(nextConfig);
