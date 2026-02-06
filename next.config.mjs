/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    allowedDevOrigins: ["supermental-tonette-rhizomatous.ngrok-free.dev"],
  },
};

export default nextConfig;
