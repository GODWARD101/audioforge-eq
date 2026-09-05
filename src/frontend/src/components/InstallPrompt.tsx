import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { Download } from "lucide-react";

/**
 * Install button shown in the header once the PWA meets installability
 * criteria. Triggers the native browser install flow for Android/Windows.
 * Renders nothing when the app is not installable or already installed.
 */
export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={promptInstall}
      data-ocid="install_button"
      className="hidden sm:inline-flex"
    >
      <Download className="size-4" aria-hidden="true" />
      Install app
    </Button>
  );
}
