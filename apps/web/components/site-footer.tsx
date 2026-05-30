import { APP_NAME } from "@asur/constants";

export function SiteFooter() {
  return (
    <footer className="footer">
      <p>
        {APP_NAME} Commerce Platform. Built for premium streetwear, offline vendor fulfillment, and mobile-first drop launches.
      </p>
      <p>Next.js on Vercel · Node.js + Express on Railway · MongoDB Atlas · Razorpay · Cloudflare R2</p>
    </footer>
  );
}
