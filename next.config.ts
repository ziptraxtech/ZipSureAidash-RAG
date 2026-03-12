/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/py/:path*',
        destination:
          process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:8000/:path*' // Local proxy
            : '/api/index.py',               // Vercel production
      },
    ];
  },
};

export default nextConfig;