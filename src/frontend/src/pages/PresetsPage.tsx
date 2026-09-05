import {
  PresetList,
  seedFactoryPresets,
} from "@/components/presets/PresetList";
import { ProfileSelector } from "@/components/presets/ProfileSelector";
import { useEffect } from "react";

/**
 * Presets & profiles workspace. Renders the factory + user preset system and
 * the per-device headphone/speaker profile selector, both wired to the global
 * audio store and persistence layer.
 */
export function PresetsPage() {
  // Seed the built-in factory presets once on mount.
  useEffect(() => {
    seedFactoryPresets();
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Presets &amp; Profiles
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Apply factory and saved tunings, and manage per-device profiles.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PresetList />
        </div>
        <div>
          <ProfileSelector />
        </div>
      </div>
    </div>
  );
}
