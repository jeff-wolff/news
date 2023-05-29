const nextConfig = {
    experimental: {
      esmExternals: 'loose',
      dangerouslyAllowSVG: true,
    },
    images: {
      domains: ['*'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  };
  
  module.exports = nextConfig;
  