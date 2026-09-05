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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { usePersistedState } from "@/hooks/use-persisted-state";
import type { Profile, ProfileType } from "@/lib/audio/types";
import { useAudioStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Check,
  Headphones,
  Laptop,
  Plus,
  Radio,
  Trash2,
  Usb,
} from "lucide-react";
import { useEffect, useState } from "react";

const PROFILE_META: Record<
  ProfileType,
  { label: string; icon: typeof Laptop; hint: string }
> = {
  builtin: {
    label: "Built-in speaker",
    icon: Laptop,
    hint: "Laptop or monitor speakers",
  },
  wired: {
    label: "Wired headphones",
    icon: Headphones,
    hint: "3.5mm or wired headset",
  },
  bluetooth: {
    label: "Bluetooth",
    icon: Radio,
    hint: "Wireless headphones or earbuds",
  },
  "usb-dac": { label: "USB DAC", icon: Usb, hint: "External DAC or amp" },
};

const PROFILE_TYPES: ProfileType[] = [
  "builtin",
  "wired",
  "bluetooth",
  "usb-dac",
];

/** Infer a profile type from an audio output device label. */
function inferProfileType(label: string): ProfileType | null {
  const l = label.toLowerCase();
  if (
    l.includes("bluetooth") ||
    l.includes("bt-") ||
    l.includes("airpods") ||
    l.includes("wireless")
  ) {
    return "bluetooth";
  }
  if (
    l.includes("usb") ||
    l.includes("dac") ||
    l.includes("audio interface") ||
    l.includes("scarlett")
  ) {
    return "usb-dac";
  }
  if (
    l.includes("headphone") ||
    l.includes("headset") ||
    l.includes("earbud") ||
    l.includes("earphone")
  ) {
    return "wired";
  }
  if (
    l.includes("speaker") ||
    l.includes("built-in") ||
    l.includes("monitor")
  ) {
    return "builtin";
  }
  return null;
}

export function ProfileSelector() {
  const profiles = useAudioStore((s) => s.profiles);
  const activeProfileId = useAudioStore((s) => s.activeProfileId);
  const saveProfile = useAudioStore((s) => s.saveProfile);
  const deleteProfile = useAudioStore((s) => s.deleteProfile);
  const applyProfile = useAudioStore((s) => s.applyProfile);

  const [autoSwitch, setAutoSwitch] = usePersistedState(
    "audioforge.autoswitch",
    false,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<ProfileType>("wired");
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);

  // Auto-switch the active profile to match the connected output device.
  useEffect(() => {
    if (!autoSwitch) return;
    const detect = () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      void navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const outputs = devices.filter((d) => d.kind === "audiooutput");
          const active = outputs.find((d) => d.label) ?? outputs[0];
          if (!active) return;
          const type = inferProfileType(active.label);
          if (!type) return;
          const profile = profiles.find((p) => p.type === type);
          if (profile && profile.id !== activeProfileId) {
            applyProfile(profile.id);
          }
        })
        .catch(() => {
          // device enumeration unavailable — auto-switch stays idle
        });
    };
    detect();
    navigator.mediaDevices?.addEventListener?.("devicechange", detect);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", detect);
    };
  }, [autoSwitch, profiles, activeProfileId, applyProfile]);

  const handleAdd = () => {
    const name = addName.trim();
    if (!name) return;
    saveProfile(name, addType);
    setAddName("");
    setAddOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProfile(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <GlassPanel className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Profiles
          </h2>
          <p className="text-sm text-muted-foreground">
            Per-device tuning for your audio output
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} data-ocid="profile_add_button">
          <Plus className="mr-2 size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div
        className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 p-3"
        data-ocid="profile_autoswitch"
      >
        <div>
          <p className="text-sm font-medium text-foreground">
            Auto-switch by device
          </p>
          <p className="text-xs text-muted-foreground">
            Apply the matching profile when the output device changes
          </p>
        </div>
        <Switch
          checked={autoSwitch}
          onCheckedChange={setAutoSwitch}
          aria-label="Auto-switch profile by output device"
          data-ocid="profile_autoswitch_toggle"
        />
      </div>

      {profiles.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-border bg-card/30 p-6 text-center"
          data-ocid="profile_empty_state"
        >
          <p className="text-sm text-muted-foreground">
            No profiles yet. Add a profile for each device you listen on.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {profiles.map((p, i) => {
            const meta = PROFILE_META[p.type];
            const Icon = meta.icon;
            const active = p.id === activeProfileId;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors",
                  active
                    ? "border-accent/60 bg-accent/10"
                    : "border-border bg-card/40 hover:border-accent/40",
                )}
                data-ocid={`profile_item.${i}`}
              >
                <button
                  type="button"
                  onClick={() => applyProfile(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                  data-ocid={`profile_apply.${i}`}
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
                      <Icon className="size-4" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {meta.label}
                    </span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(p)}
                  aria-label={`Delete ${p.name}`}
                  data-ocid={`profile_delete.${i}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add profile dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="profile_add_modal">
          <DialogHeader>
            <DialogTitle>Add profile</DialogTitle>
            <DialogDescription>
              Save the current tuning for a specific output device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Profile name</Label>
              <Input
                id="profile-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Home speakers"
                data-ocid="profile_name_input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-type">Device type</Label>
              <Select
                value={addType}
                onValueChange={(v) => setAddType(v as ProfileType)}
              >
                <SelectTrigger
                  id="profile-type"
                  data-ocid="profile_type_select"
                >
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {PROFILE_META[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              data-ocid="profile_add_cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!addName.trim()}
              data-ocid="profile_add_confirm"
            >
              Add profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete profile dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent data-ocid="profile_delete_modal">
          <DialogHeader>
            <DialogTitle>Delete profile</DialogTitle>
            <DialogDescription>
              Delete “{deleteTarget?.name}”? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="profile_delete_cancel"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-ocid="profile_delete_confirm"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlassPanel>
  );
}
