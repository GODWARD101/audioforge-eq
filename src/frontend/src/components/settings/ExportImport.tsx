import { GlassPanel } from "@/components/GlassPanel";
import { Button } from "@/components/ui/button";
import { downloadState, importState } from "@/lib/persistence";
import { useAudioStore } from "@/lib/store";
import { Download, FileJson, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Export / import of the full configuration. Exports every setting, preset,
 * profile, and the active theme as a single JSON file; imports a previously
 * exported file back and applies it. Also offers a full reset to defaults.
 */
export function ExportImport() {
  const settings = useAudioStore((s) => s.settings);
  const theme = useAudioStore((s) => s.theme);
  const presets = useAudioStore((s) => s.presets);
  const profiles = useAudioStore((s) => s.profiles);
  const activeProfileId = useAudioStore((s) => s.activeProfileId);
  const storeImport = useAudioStore((s) => s.importState);
  const resetAll = useAudioStore((s) => s.resetAll);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    downloadState({
      version: 1,
      theme,
      settings,
      presets,
      profiles,
      activeProfileId,
    });
    toast.success("Settings exported", {
      description: "Your configuration was downloaded as a JSON file.",
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      // Validate before applying so a bad file never clobbers current state.
      importState(text);
      storeImport(text);
      toast.success("Settings imported", {
        description: "Your configuration was restored.",
      });
    } catch {
      toast.error("Import failed", {
        description: "That file is not a valid AudioForge settings file.",
      });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReset = () => {
    resetAll();
    toast.success("Settings reset", {
      description: "All settings were restored to defaults.",
    });
  };

  return (
    <GlassPanel className="p-6 sm:p-8" data-ocid="settings_export_panel">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <FileJson className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Backup &amp; restore
          </h2>
          <p className="text-sm text-muted-foreground">
            Export everything as a single JSON file, or import one back.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Button
          variant="outline"
          onClick={handleExport}
          data-ocid="settings_export_button"
          className="h-auto flex-col items-start gap-2 p-4 text-left"
        >
          <Download className="size-5" aria-hidden="true" />
          <span>
            <span className="block font-semibold">Export settings</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Download audioforge-settings.json
            </span>
          </span>
        </Button>

        <Button
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          data-ocid="settings_import_button"
          className="h-auto flex-col items-start gap-2 p-4 text-left"
        >
          <Upload className="size-5" aria-hidden="true" />
          <span>
            <span className="block font-semibold">Import settings</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {importing ? "Reading file…" : "Restore from a JSON file"}
            </span>
          </span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleReset}
          data-ocid="settings_reset_button"
          className="h-auto flex-col items-start gap-2 p-4 text-left text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          <span>
            <span className="block font-semibold">Reset to defaults</span>
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              Clear all settings and presets
            </span>
          </span>
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="settings_import_input"
        aria-label="Import settings file"
      />
    </GlassPanel>
  );
}
