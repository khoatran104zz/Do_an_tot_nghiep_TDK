import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/announcements',
        destination: '/notifications',
        permanent: true,
      },
      {
        source: '/resident/announcements',
        destination: '/resident/notifications',
        permanent: true,
      },
      {
        source: '/maintenance-schedule',
        destination: '/maintenance-schedules',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
