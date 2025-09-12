// Removed RainbowKit styles - using Privy instead
import { ScaffoldEthApp, ScaffoldEthProviders } from "~~/app/providers";
import AuthProvider from "~~/components/AuthProvider";
import { MobileBottomNav } from "~~/components/MobileBottomNav";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { UserActivityProvider } from "~~/contexts/UserActivityContext";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Lunargistics Platform",
  description: "Monitor and manage space activities",
});

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof global === 'undefined') {
                window.global = window;
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider enableSystem>
            <ScaffoldEthProviders>
              <ScaffoldEthApp>
                <UserActivityProvider>
                  {children}
                  <MobileBottomNav />
                </UserActivityProvider>
              </ScaffoldEthApp>
            </ScaffoldEthProviders>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
