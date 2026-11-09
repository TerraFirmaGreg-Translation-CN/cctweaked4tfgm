#!/usr/bin/env bash
# cctweaked4tfgm CI — resolve a TFGM release, regenerate data, build the site.
# Usage: bash ci/run.sh <command>
set -euo pipefail

CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$CI_DIR/.." && pwd)"

# shellcheck disable=SC1091
source "$CI_DIR/build.env"

gh_out() {
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "$1=$2" >> "$GITHUB_OUTPUT"
  else
    echo "$1=$2"
  fi
}

# --- release resolution ----------------------------------------------------

latest_modpack_tag() {
  git ls-remote --tags "${MODPACK_REPO}" \
    | awk -F/ '{print $NF}' \
    | sed 's/\^{}//' \
    | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' \
    | sort -V \
    | tail -1
}

resolve_tag() {
  local tag="${MODPACK_TAG:-}"
  if [[ -z "$tag" ]]; then
    tag="$(latest_modpack_tag)"
  fi
  if [[ -z "$tag" ]]; then
    echo "::error::could not resolve a Modpack-Modern release tag" >&2
    exit 1
  fi
  echo "$tag"
}

# CC:T version pinned by the checkout of that tag (never guessed).
cc_version_for() {
  local tag="${1:?tag required}"
  git -C "$ROOT/.cache/modpack-$tag" show "HEAD:pakku-lock.json" 2>/dev/null \
    | node -e '
      let raw = "";
      process.stdin.on("data", (c) => (raw += c));
      process.stdin.on("end", () => {
        const lock = JSON.parse(raw);
        for (const project of lock.projects || []) {
          if (Object.values(project.slug || {}).includes("cc-tweaked")) {
            const file = (project.files || [])[0]?.file_name || "";
            const m = /-(\d+\.\d+\.\d+)\.jar$/.exec(file);
            if (m) {
              process.stdout.write(m[1]);
              return;
            }
          }
        }
        process.exit(1);
      });
    '
}

resolve_cmd() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  echo "Resolved Modpack-Modern ${tag}"
  gh_out tag "$tag"
}

fetch_inputs() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  echo "::group::Fetching upstream inputs for ${tag}"

  if [[ ! -d "$ROOT/.cache/modpack-$tag" ]]; then
    git clone --depth 1 --branch "$tag" "${MODPACK_REPO}" "$ROOT/.cache/modpack-$tag"
  fi

  local cc
  cc="${CC_VERSION:-$(cc_version_for "$tag")}"
  echo "CC:Tweaked ${cc}"

  node "$ROOT/scripts/fetch-item-index.mjs" --modpack-tag "$tag" --cc-version "$cc"
  echo "::endgroup::"
}

extract() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  node "$ROOT/scripts/extract-tfgm.mjs" --modpack "$ROOT/.cache/modpack-$tag"
}

api_index() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  local cc
  cc="${CC_VERSION:-$(cc_version_for "$tag")}"
  node "$ROOT/scripts/build-cc-index.mjs" --cc-version "$cc"
}

emi_bundle() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  node "$ROOT/scripts/fetch-emi-bundle.mjs" --tag "$tag"
}

cc_docs() {
  local tag="${MODPACK_TAG:-$(latest_modpack_tag)}"
  local cc
  cc="${CC_VERSION:-$(cc_version_for "$tag")}"
  node "$ROOT/scripts/fetch-cc-docs.mjs" --version "$cc"
}

verify() {
  node "$ROOT/scripts/verify-data.mjs"
}

diff() {
  local changed=false
  if [[ -n "$(git -C "$ROOT" status --porcelain -- docs/data docs/public/images)" ]]; then
    changed=true
    git -C "$ROOT" --no-pager diff --stat -- docs/data docs/public/images | sed 's/^/  /'
  else
    echo "Generated data matches the committed copy"
  fi
  gh_out changed "$changed"
}

# --- site ------------------------------------------------------------------

install() {
  cd "$ROOT"
  npm ci --no-audit --no-fund
}

build() {
  cd "$ROOT"
  npm run build
}

commit_data() {
  local tag="${TAG:?TAG required}"
  cd "$ROOT"
  if [[ -z "$(git status --porcelain -- docs/data docs/public/images)" ]]; then
    echo "Nothing to commit"
    return 0
  fi
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add docs/data docs/public/images
  git commit -m "data: regenerate for TFGM ${tag}"
  git push
}

usage() {
  cat <<'EOF'
Usage: bash ci/run.sh <command>

  resolve        print/emit the Modpack-Modern tag to target
  fetch-inputs   clone the modpack and cache upstream inputs (items index, lang)
  extract        regenerate data/ from the checkout
  api-index      rebuild data/cc-index.json for the pinned CC:T
  emi            extract the CC/AP EMI recipe subset into data/emi
  cc-docs        mirror the CC:T documentation for the pinned version
  verify         run the data gate
  diff           report whether data/ changed
  install        npm ci
  build          npm run build
  commit-data    commit regenerated data (TAG required)
EOF
}

case "${1:-}" in
  resolve) resolve_cmd ;;
  fetch-inputs) fetch_inputs ;;
  extract) extract ;;
  api-index) api_index ;;
  emi) emi_bundle ;;
  cc-docs) cc_docs ;;
  verify) verify ;;
  diff) diff ;;
  install) install ;;
  build) build ;;
  commit-data) commit_data ;;
  -h|--help|help|"") usage ;;
  *)
    echo "::error::unknown command: $1" >&2
    usage >&2
    exit 1
    ;;
esac
