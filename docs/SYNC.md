# Catalog Sync Runbook

This runbook covers operating [`.github/workflows/sync-catalog.yml`](../.github/workflows/sync-catalog.yml). For an overview, see [README.md → Catalog Sync](../README.md#catalog-sync).

## Common failures

| Symptom                                                       | Likely cause                               | Recovery                                                                                                |
|---------------------------------------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------------------------|
| `gh attestation verify` fails                                 | Attestation index lag or upstream re-sign  | Re-run after 15-30 minutes. If persistent, open an issue on `microsoft/hve-core` and pin to a prior tag |
| `Asset <name> not present on <tag>; skipping`, then job exits | Upstream renamed or dropped a VSIX         | Inspect the release page on `microsoft/hve-core`; update the package allow-list in `sync-catalog.yml`   |
| `gh api repos/microsoft/hve-core/releases` returns 401 or 403 | `GITHUB_TOKEN` scope drift                 | Re-run the workflow; the token is refreshed per run                                                     |
| `vendor/merged layout missing 'extension/' prefix` warning    | Upstream VSIX packaging change             | Inspect the resulting PR diff carefully; consider pinning to the last-known-good tag                    |
| `peter-evans/create-pull-request` push fails                  | Branch protection on `chore/sync-hve-core` | Confirm `contents: write` and `pull-requests: write` are still granted at the workflow and repo level   |

## Manual recovery

Run the workflow on demand:

* Actions tab → `Sync HVE-Core Catalog` → **Run workflow**.
* Or via API: `gh workflow run sync-catalog.yml`.

Local dry-run against a downloaded VSIX:

```bash
mkdir -p vendor && cd vendor
gh release download hve-core-vX.Y.Z -R microsoft/hve-core -p 'hve-core-*.vsix'
mkdir -p merged && for v in *.vsix; do unzip -q -o "$v" -d merged; done
cd ..
HVE_CORE_TAG=hve-core-vX.Y.Z node scripts/generate-catalog.mjs vendor/merged/extension
```

The `HVE_CORE_TAG` env var causes the generator to stamp `sourceTag` onto `src/data/catalog.json`, which the SPA footer surfaces as the upstream version label.

## Firing a release event

The workflow listens for `repository_dispatch` of type `hve-core-release`. Anyone with a PAT scoped to this repo (`contents:write`) can short-circuit the cron:

```bash
gh api repos/AmieDD/HVE-Detective/dispatches \
  -f event_type=hve-core-release \
  -f 'client_payload[tag]=hve-core-vX.Y.Z'
```

When `client_payload.tag` is present, the workflow uses it directly and skips the release scan. Omit it to let the workflow pick the highest-versioned non-draft tag.

## Updating the package allow-list

The workflow merges 12 per-collection VSIXes. To add or remove one, edit the `pkgs=(...)` array in [.github/workflows/sync-catalog.yml](../.github/workflows/sync-catalog.yml) and verify the next run produces the expected catalog item counts.
