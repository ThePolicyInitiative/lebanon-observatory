import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The site has two root layouts - English and Arabic - so there is no
    // single layout Next can compose a 404 from. global-not-found.tsx is
    // the documented way to serve one styled page for URLs that match
    // neither half.
    globalNotFound: true,
  },
};

export default nextConfig;
