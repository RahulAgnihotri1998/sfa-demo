/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent browsers from caching HTML pages so they always fetch
  // the current document (which references current chunk hashes).
  // This eliminates ChunkLoadError after redeployments.
  async headers() {
    return [
      {
        // Match all page routes but NOT _next/static assets
        // (static assets are already cache-busted by their content hash in the filename)
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
