import "../styles/globals.css";

export const metadata = {
  title: "Sillah",
  description: "Sillah — your gateway to health, family, and care",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
