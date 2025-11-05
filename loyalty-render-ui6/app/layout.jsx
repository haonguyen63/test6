import "./globals.css";
import AutoLogout from "./_components/AutoLogout";
import Nav from "./_components/Nav";

export const metadata = { title: "Điểm tích lũy", description: "Clean build" };

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AutoLogout />
        <Nav />
        <div style={{maxWidth: '960px', margin: '1rem auto'}}>{children}</div>
      </body>
    </html>
  );
}
