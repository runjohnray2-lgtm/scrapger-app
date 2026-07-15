/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["playwright", "nodemailer", "cheerio"],
}

module.exports = nextConfig
