/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Gli errori ESLint (unused vars, any in chart.tsx generato, ecc.)
    // non devono bloccare il build su Vercel
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
