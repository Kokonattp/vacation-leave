/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // ถ้า repo ชื่อ vacation-leave ให้ใส่ basePath
   basePath: '/vacation-leave',
}

module.exports = nextConfig
