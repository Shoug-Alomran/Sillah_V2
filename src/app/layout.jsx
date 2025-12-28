import "../styles/globals.css";
import LogoutButton from "../components/navbar/LogoutButton";

export const metadata = {
  title: "Sillah",
  description: "Sillah — your gateway to health, family, and care",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
      </head>
      <body>
        <header style={{ padding: "10px", background: "#f0f4f8" }}>
          <nav style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <a href="/">Home</a> | <a href="/auth/login">Login</a> |{" "}
              <a href="/auth/signup">Patient Signup</a> |{" "}
              <a href="/auth/signup-doctor">Doctor Signup</a>
            </div>
            <div>
              <LogoutButton />
            </div>
          </nav>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}
