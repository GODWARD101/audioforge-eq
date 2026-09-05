import { GlassPanel } from "@/components/GlassPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildDefaultSettings } from "@/lib/audio/AudioEngine";
import type { Preset } from "@/lib/audio/types";
import { createFactoryPreset } from "@/lib/persistence";
import { useAudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Check, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * Factory preset EQ curves (10-band mode). Each array holds the per-band gain
 * in dB for the ISO frequencies [31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k].
 */
const FACTORY_GAINS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  "Bass Boost": [6, 6, 5, 3, 1, 0, 0, 0, 0, 0],
  "Treble Boost": [0, 0, 0, 0, 0, 0, 1, 3, 5, 6],
  Vocal: [0, 0, -1, -2, 1, 4, 4, 2, 0, 0],
  Rock: [5, 4, 2, 0, -2, -1, 1, 3, 4, 4],
  Pop: [3, 3, 2, 1, 0, 1, 2, 3, 3, 2],
  Electronic: [6, 5, 4, 2, 0, 0, 1, 2, 4, 5],
  Classical: [0, 0, 0, 0, 0, 0, 1, 2, 3, 3],
  Podcast: [0, 0, -2, -1, 2, 4, 4, 3, 1, 0],
};

function buildFactoryPresets(): Preset[] {
  const base = buildDefaultSettings();
  return Object.entries(FACTORY_GAINS).map(([name, gains], i) => {
    const eq = {
      ...base.eq,
      bands: base.eq.bands.map((b, j) => ({ ...b, gain: gains[j] ?? 0 })),
    };
    return createFactoryPreset(`factory-${i}`, name, { ...base, eq });
  });
}

export const FACTORY_PRESETS = buildFactoryPresets();

/**
 * Seed the built-in factory presets into the store once. Factory presets are
 * static and always available; user presets are appended after them and
 * persisted through the store's own actions.
 */
export function seedFactoryPresets(): void {
  const { presets } = useAudioStore.getState();
  if (presets.some((p) => p.isFactory)) return;
  useAudioStore.setState({ presets: [...FACTORY_PRESETS, ...presets] });
}

interface PresetCardProps {
  preset: Preset;
  index: number;
  active: boolean;
  onApply: (id: string) => void;
  onRename?: () => void;
  onDelete?: () => void;
}

function PresetCard({
  preset,
  index,
  active,
  onApply,
  onRename,
  onDelete,
}: PresetCardProps) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors",
        active
          ? "border-accent/60 bg-accent/10"
          : "border-border bg-card/40 hover:border-accent/40",
      )}
      data-ocid={`preset_item.${index}`}
    >
      <button
        type="button"
        onClick={() => onApply(preset.id)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
        data-ocid={`preset_apply.${index}`}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            active
              ? "bg-accent text-accent-foreground"
              : "bg-primary/15 text-primary",
          )}
        >
          {active ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-foreground">
            {preset.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {preset.isFactory ? "Factory" : "Custom"}
          </span>
        </span>
      </button>
      {!preset.isFactory && (
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRename}
            aria-label={`Rename ${preset.name}`}
            data-ocid={`preset_rename.${index}`}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${preset.name}`}
            data-ocid={`preset_delete.${index}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function PresetList() {
  const presets = useAudioStore((s) => s.presets);
  const applyPreset = useAudioStore((s) => s.applyPreset);
  const renamePreset = useAudioStore((s) => s.renamePreset);
  const deletePreset = useAudioStore((s) => s.deletePreset);
  const savePreset = useAudioStore((s) => s.savePreset);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [renameTarget, setRenameTarget] = useState<Preset | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Preset | null>(null);

  const factory = presets.filter((p) => p.isFactory);
  const user = presets.filter((p) => !p.isFactory);

  const handleApply = (id: string) => {
    applyPreset(id);
    setActiveId(id);
  };

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    savePreset(name);
    setSaveName("");
    setSaveOpen(false);
  };

  const handleRename = () => {
    if (!renameTarget) return;
    const name = renameName.trim();
    if (!name) return;
    renamePreset(renameTarget.id, name);
    setRenameTarget(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deletePreset(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Presets
          </h2>
          <p className="text-sm text-muted-foreground">
            Factory and saved tuning snapshots
          </p>
        </div>
        <Button
          onClick={() => setSaveOpen(true)}
          data-ocid="preset_save_button"
        >
          <Plus className="mr-2 size-4" aria-hidden="true" />
          Save current
        </Button>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Factory
        </h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {factory.map((p, i) => (
            <PresetCard
              key={p.id}
              preset={p}
              index={i}
              active={activeId === p.id}
              onApply={handleApply}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          My presets
        </h3>
        {user.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center"
            data-ocid="preset_empty_state"
          >
            <p className="text-sm text-muted-foreground">
              No saved presets yet. Tune the EQ and effects, then save your
              current settings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {user.map((p, i) => (
              <PresetCard
                key={p.id}
                preset={p}
                index={i}
                active={activeId === p.id}
                onApply={handleApply}
                onRename={() => {
                  setRenameTarget(p);
                  setRenameName(p.name);
                }}
                onDelete={() => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent data-ocid="preset_save_modal">
          <DialogHeader>
            <DialogTitle>Save preset</DialogTitle>
            <DialogDescription>
              Capture the current EQ and effects settings as a new preset.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset name</Label>
            <Input
              id="preset-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. My mix"
              data-ocid="preset_name_input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveOpen(false)}
              data-ocid="preset_save_cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!saveName.trim()}
              data-ocid="preset_save_confirm"
            >
              Save preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
      >
        <DialogContent data-ocid="preset_rename_modal">
          <DialogHeader>
            <DialogTitle>Rename preset</DialogTitle>
            <DialogDescription>Give this preset a new name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-name">Preset name</Label>
            <Input
              id="rename-name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              data-ocid="preset_rename_input"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              data-ocid="preset_rename_cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={!renameName.trim()}
              data-ocid="preset_rename_confirm"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="preset_delete_modal">
          <DialogHeader>
            <DialogTitle>Delete preset</DialogTitle>
            <DialogDescription>
              Delete “{deleteTarget?.name}”? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="preset_delete_cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-ocid="preset_delete_confirm"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassPanel>
  );
}
