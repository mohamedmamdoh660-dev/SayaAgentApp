import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SearchableDropdownProvider } from "@/context/SearchableDropdownContext";
import { Toaster } from "sonner";
import { ThemeProviderWrapper } from "@/context/theme-provider-wrapper";
import PointerEventsFix from "@/utils/pointer-events";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} font-sans antialiased`}>
      <body>
        <AuthProvider>
          <SearchableDropdownProvider>
            <ThemeProviderWrapper>
              {children}
              <Toaster position="top-center" duration={3000} richColors />
              <PointerEventsFix />
            </ThemeProviderWrapper>
          </SearchableDropdownProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
