import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Emit routes as `login/index.html` instead of `login.html` so the
  // FastAPI StaticFiles(html=True) mount can resolve bare paths like `/login`.
  trailingSlash: true,
};

export default nextConfig;
