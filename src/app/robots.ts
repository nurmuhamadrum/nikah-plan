import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/user-guide", "/u/"],
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/vendors",
          "/undangan",
          "/angpao",
          "/panduan",
          "/settings",
          "/checkout",
          "/onboarding",
          "/join/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
