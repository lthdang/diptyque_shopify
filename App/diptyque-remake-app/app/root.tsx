import type { LinksFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";
// Import Polaris CSS at the root level so it is injected into <head> on first
// byte — prevents the FOUC / "Skip to content" flash on hard refresh.
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Root-level ErrorBoundary — rendered before any Polaris/App Bridge context
// exists, so we use plain HTML only (no Polaris components) to ensure the
// error message is always visible and never shows unstyled Polaris SVG icons.
export function ErrorBoundary() {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Error</title>
      </head>
      <body
        style={{
          fontFamily: "Inter, sans-serif",
          padding: "2rem",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
          Something went wrong
        </h1>
        <p style={{ color: "#666", marginBottom: "1rem" }}>{message}</p>
        <a href="/app" style={{ color: "#5c6ac4" }}>
          Return to dashboard
        </a>
      </body>
    </html>
  );
}
