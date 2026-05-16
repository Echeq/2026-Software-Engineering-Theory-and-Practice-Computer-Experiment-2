import fs from "fs";
import path from "path";

interface ManifestEntry {
  file: string;
  css?: string[];
  imports?: string[];
}

type ViteManifest = Record<string, ManifestEntry>;

export interface EntryAssets {
  scripts: string[];
  styles: string[];
}

const frontendDistPath = path.join(__dirname, "../../../frontend/dist");
const manifestPath = path.join(frontendDistPath, "manifest.json");

export function resolveEntryAssets(entryName: string): EntryAssets {
  const manifest = readManifest();
  const entry = manifest[entryName];

  if (!entry) {
    return { scripts: [], styles: [] };
  }

  const styles = new Set<string>();
  collectStyles(manifest, entry, styles);

  return {
    scripts: [`/${entry.file}`],
    styles: Array.from(styles)
  };
}

function readManifest(): ViteManifest {
  if (!fs.existsSync(manifestPath)) {
    return {};
  }

  return JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as ViteManifest;
}

function collectStyles(manifest: ViteManifest, entry: ManifestEntry, styles: Set<string>): void {
  entry.css?.forEach((file) => {
    styles.add(`/${file}`);
  });

  entry.imports?.forEach((importName) => {
    const importedEntry = manifest[importName];
    if (importedEntry) {
      collectStyles(manifest, importedEntry, styles);
    }
  });
}
