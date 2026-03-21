// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   // Keep your Python Proxy logic
//   rewrites: async () => {
//     return [
//       {
//         source: '/api/py/:path*',
//         destination:
//           process.env.NODE_ENV === 'development'
//             ? 'http://127.0.0.1:8000/:path*' 
//             : '/api/index.py',
//       },
//     ];
//   },

//   // FIX: Force Turbopack to ignore Node-specific worker calls in fflate
//   experimental: {
//     turbo: {
//       resolveAlias: {
//         "fflate": "fflate/browser",
//       },
//     },
//   },
  
//   // Optional: Ensures jspdf doesn't get messed up during transpilation
//   transpilePackages: ['jspdf', 'fflate'],
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Keep your Python Proxy logic
  rewrites: async () => {
  return [
    {
      source: '/api/py/:path*',
      destination:
        process.env.NODE_ENV === 'development'
          ? 'http://127.0.0.1:8000/:path*' 
          : '/api/index.py', // Vercel handles the mapping automatically
    },
  ];
},

  // 2. Transpile these to ensure the browser handles them correctly
  // This is the preferred way for jsPDF/fflate in Next.js 16
  transpilePackages: ['jspdf', 'fflate', 'html2canvas-pro'],

  // 3. Removed 'turbo' from experimental as it was causing warnings
  // Removed 'serverExternalPackages' for jspdf to fix the FATAL conflict
  experimental: {
    // If you need specific server-side external packages (like database drivers), 
    // put them here, but leave jspdf out.
  },
};

export default nextConfig;