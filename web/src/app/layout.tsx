import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { FeedbackProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "باجیمو — بودجه رفاهی سازمانی", template: "%s | باجیمو" },
  description: "بودجه ورزش و تفریح کارکنان را یک‌جا مدیریت کنید: باشگاه، استخر، سینما و بیشتر — با بودجه شرکت.",
};

export const viewport: Viewport = {
  themeColor: "#059673",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased">
        <AuthProvider>
          <FeedbackProvider>{children}</FeedbackProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
