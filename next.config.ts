import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // disable: process.env.NODE_ENV === "development", // Only run PWA in Production
  workboxOptions: {
    disableDevLogs: true,
  },
  // swcMinify removed from here because it doesn't belong to PWA options
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // You can add standard Next.js config here if needed
  // swcMinify: true,
};

export default withPWA(nextConfig);