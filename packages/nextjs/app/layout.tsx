import "@rainbow-me/rainbowkit/styles.css";
import { Toaster } from "react-hot-toast";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";
import { ThemeProvider } from "~~/components/ThemeProvider";
import { UserActivityProvider } from "~~/contexts/UserActivityContext";
import { MobileBottomNav } from "~~/components/MobileBottomNav";
import AuthProvider from "~~/components/AuthProvider";
import "~~/styles/globals.css";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Lunargistics Platform",
  description: "Monitor and manage space activities",
});

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  return (
    <html suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider enableSystem>
            <ScaffoldEthAppWithProviders>
              <UserActivityProvider>
                {children}
                <MobileBottomNav />
              </UserActivityProvider>
            </ScaffoldEthAppWithProviders>
          </ThemeProvider>
        </AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            // Можно настроить стили для темной/светлой темы, если Toaster не подхватывает их автоматически
            // For dark theme compatibility with DaisyUI, some explicit styling might be needed
            // if default toasts don't look good on the dark background.
            // Example:
            // success: { iconTheme: { primary: '#00A9E0', secondary: '#F0F0F0'}},
            // error: { iconTheme: { primary: '#FF8863', secondary: '#F0F0F0'}},
            // style: { background: '#1A2B41', color: '#F0F0F0', border: '1px solid #263C5A' },
          }}
        />
      </body>
    </html>
  );
};

export default ScaffoldEthApp;
