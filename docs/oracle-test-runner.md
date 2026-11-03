# Independent test runner (Oracle Always Free VM)

A second way to run the repository checks that does not depend on GitHub Actions
billing or availability. It runs on the existing Oracle Always Free VM
(Frankfurt) and adds no server, cost or GitHub credential.

## Trust model

- Input is a `git bundle` of an exact commit, pushed over SSH by the repository
  owner. Pull request code and unreviewed branches are never run there.
- The VM also hosts Weblate, Uptime Kuma and Bitwarden. The runner uses an
  unprivileged `ci` user (no sudo, not in the docker group), home
  `/var/oled/ci` (mode 700), user-space Node 24, Rust 1.99.1 (the version pinned
  in `contracts/crowdfund/rust-toolchain.toml`) and gitleaks 8.30.1.
- `/var/oled` is a separate filesystem from `/`, shared with Oracle's PCP
  monitoring logs under `/var/oled/pcp`. Never touch that directory.
- Each run is wrapped in `systemd-run` with `MemoryMax=3G`, `CPUQuota=100%`,
  `TasksMax=1024`, `Nice=15`, `IOWeight=20`. The script refuses to start with less
  than 4 GB free on `/var/oled`, refuses a second concurrent run (flock), deletes
  the work tree afterwards and keeps only the 5 newest result folders.

## Steps run (same as `.github/workflows/ci.yml`)

`npm ci`, `npm run lint`, `npm run format:check`, `npm test`,
`npm run i18n:check --prefix frontend`, `npm run build`,
`npm audit --audit-level=high`, `gitleaks git --redact .` (full history),
`cargo test --locked` in `contracts/crowdfund`.

Not run on the VM: `stellar contract build` and the pinned Wasm hash check (the
arm64 `stellar` 28.1.0 binary needs a newer libstdc++ than Oracle Linux 9), the
Rust advisory audit, and the Argos/Playwright visual job. Run those from an
x86_64 machine with the pinned binaries from `ci.yml`.

## Invoking a run

1. `git bundle create repo.bundle --all`, copy it to the VM.
2. Install it as `/var/oled/ci/repo.bundle` (owner `ci`).
3. `sudo systemd-run --uid=ci --gid=ci --unit=blockallisto-ci -p MemoryMax=3G
-p CPUQuota=100% -p TasksMax=1024 -p Nice=15 -p IOWeight=20
/bin/bash /var/oled/ci/run-ci.sh /var/oled/ci/repo.bundle <full-sha>`
4. Read `/var/oled/ci/results/<sha>/summary.txt` (`<step> <exit code>` per line)
   and the per-step `.log` files.

## Rollback

`sudo userdel -r ci` removes the runner and everything under `/var/oled/ci`.
`sudo dnf remove git-core` removes the only system package that was added.
