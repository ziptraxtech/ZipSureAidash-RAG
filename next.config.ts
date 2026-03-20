/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your Python Proxy logic
  rewrites: async () => {
    return [
      {
        source: '/api/py/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/:path*' 
            : '/api/index.py',
      },
    ];
  },

  // FIX: Force Turbopack to ignore Node-specific worker calls in fflate
  experimental: {
    turbo: {
      resolveAlias: {
        "fflate": "fflate/browser",
      },
    },
  },
  
  // Optional: Ensures jspdf doesn't get messed up during transpilation
  transpilePackages: ['jspdf', 'fflate'],
};

export default nextConfig;