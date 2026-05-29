import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AuthProvider } from "./context/AuthContext";

export const metadata = {
  title: "FinSim — Live 10 Years in 15 Minutes",
  description:
    "A personal finance life simulator. Make real decisions, see real consequences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="bg-[#0A0A0A] text-[#F5F5F5]">
        <AppProviders>
          <AuthProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#F59E0B] text-black rounded font-medium"
            >
              Skip to main content
            </a>

            <main id="main-content">{children}</main>
          </AuthProvider>
        </AppProviders>
      </body>
    </html>
  );
}
