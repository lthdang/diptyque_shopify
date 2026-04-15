import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  AppProvider as PolarisProvider,
  Frame,
  SkeletonPage,
} from "@shopify/polaris";
// Note: Polaris CSS is loaded globally via the links export in root.tsx
import enTranslations from "@shopify/polaris/locales/en.json";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

// AppShell is a child component so it can call useAppBridge() *inside* the
// AppProvider tree. It shows a skeleton while App Bridge is initializing on
// hard refresh, preventing the Polaris warning icon flash.
function AppShell() {
  const app = useAppBridge();

  // During the App Bridge session-token exchange on hard refresh, the hook
  // may return undefined. Show a skeleton rather than empty content so that
  // Frame has something to render and never falls back to the warning icon.
  if (!app) {
    return <SkeletonPage />;
  }

  return (
    <>
      <s-app-nav>
        <s-link href="/app">Store Overview</s-link>
        <s-link href="/app/additional">Additional page</s-link>
        <s-link href="/app/scheduled-publish">Scheduled Publishing</s-link>
      </s-app-nav>
      <Outlet />
    </>
  );
}

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      {/* PolarisProvider + Frame live here once at layout level.
          Frame provides the Toast context for all child routes.
          Never render Frame inside individual route components. */}
      <PolarisProvider i18n={enTranslations}>
        <Frame>
          <AppShell />
        </Frame>
      </PolarisProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
