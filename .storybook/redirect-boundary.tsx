import { useContext, type ReactNode } from "react";
// The extensionless import intentionally keeps the actual Next.js boundary.
import { RedirectBoundary as NextRedirectBoundary } from "next/dist/client/components/redirect-boundary";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Storybook 10.6 provides the pre-16.4 layout context. Next 16.4's internal
 * redirect boundary reads a segment cache that isolated stories do not have.
 * Let that boundary use Next's supported root-layout fallback, then restore
 * Storybook's context for the story. Routing behavior remains mocked by the
 * official framework. This adapter is only loaded by Storybook's Vite config.
 * Remove when @storybook/nextjs-vite supports parentRenderTree.
 */
export function RedirectBoundary({ children }: { children: ReactNode }) {
  const layout = useContext(LayoutRouterContext);
  return (
    <LayoutRouterContext.Provider value={null}>
      <NextRedirectBoundary>
        <LayoutRouterContext.Provider value={layout}>
          {children}
        </LayoutRouterContext.Provider>
      </NextRedirectBoundary>
    </LayoutRouterContext.Provider>
  );
}
