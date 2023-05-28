const nextConfig = {
    experimental: {
      esmExternals: 'loose',
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  };
  
  module.exports = nextConfig;
  