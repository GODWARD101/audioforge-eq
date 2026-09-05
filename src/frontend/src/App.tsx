import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "@/router";
import { RouterProvider } from "@tanstack/react-router";

/**
 * App shell: theme + tooltip providers wrapping the TanStack Router.
 * The router's root route renders the Layout, which hosts the page content.
 */
export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
