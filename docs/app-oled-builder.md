# App-only OLED builder

The VM has a separate, root-operated `app-oled` Buildx builder. It connects to
`unix:///run/buildkit-app/buildkitd.sock`. BuildKit's OCI worker stores its working
snapshots and cache in `/var/oled/buildkit-app/state`. It does not use the system
containerd worker. The socket directory is mode 0700 and the socket is mode 0600.
There is no TCP listener.

The installed upstream release is BuildKit v0.35.0 for linux-arm64. Its release
archive SHA256 is
`e33872fbc13d7858f2fd4e434697e9a1aa03347a6fe13f86a58c9c3b0e711286`.
The binaries are isolated under `/var/oled/buildkit-app/v0.35.0/bin`. The service
is `buildkit-app.service`, configured by `/etc/buildkit-app.toml`. Docker and
containerd are not restarted or reconfigured. The existing `default` builder is
not replaced or changed.

## Build, then deploy separately

After this change is reviewed and merged, an operator can build an app image:

```sh
sudo ./infra/build-app-image.sh --tag blockallisto-app:reviewed-release
```

The tag must be explicit. The script builds for linux-arm64 and loads the result
into Docker. It does not activate an app, alter Compose runtime settings, select
a global default builder, or silently retry through another builder. Existing
release approval, runtime checks and rollback requirements still apply. A
release helper must use this build command explicitly and activate with
`--no-build`; running an old `docker compose build` path is not migrated by the
presence of this script.

Both filesystems are checked before, during and after the build. A one-second
watch cancels at 3 GiB + 128 MiB free to leave cancellation time before the hard
3 GiB floor. This is a sampled guard, not a disk quota: unrelated fast writes can
still outrun it. A failed or canceled build must not be activated. Check whether
BuildKit has finished cancellation before retrying.

Only the intermediate build state and cache move to OLED. The final image loaded
into Docker still consumes root/containerd storage. OLED also holds selected
image archives and must retain its own 3 GiB free-space floor. Garbage collection
targets are not a hard limit on active-build disk usage.

## Explicit fallback and rollback

If the dedicated service cannot build, stop and inspect its failure. Do not
switch builders automatically. An operator who has checked root capacity can
choose the unchanged embedded builder explicitly:

```sh
sudo ./infra/build-app-image.sh --builder default --tag blockallisto-app:reviewed-fallback
```

To undo the dedicated installation, stop and disable only `buildkit-app.service`,
remove the `app-oled` Buildx registration, then remove only the dedicated service,
config and versioned install/state directories after checking no build is active.
Remove its scoped SELinux file-context rule for
`/var/oled/buildkit-app/v0\.35\.0/bin(/.*)?` as part of that rollback. Do not disable
SELinux, prune unrelated caches, remove images or restart Docker/containerd.
Reverting this PR restores the old documented command path; it does not itself
remove a VM service. Existing app containers continue running throughout.

## Verification

Run the script tests without Docker or root access:

```sh
python3 -m unittest discover -s infra/tests -p 'test_*.py'
```

The install's cold-build comparison uses the same Git source and exact base
image digest for both builders, with OCI test exports on OLED and one-second
free-space samples on both disks. Those test builds are not deployments. Record
start/minimum/end free bytes and duration rather than comparing rounded `du`
values or claiming that cache size is the entire build peak.

Sources:

- <https://docs.docker.com/build/builders/drivers/remote/>
- <https://github.com/moby/buildkit/blob/v0.35.0/docs/buildkitd.toml.md>
- <https://github.com/moby/buildkit/releases/tag/v0.35.0>
- <https://docs.docker.com/engine/daemon/>

Measured on 2026-11-13, source `36d45a65`, same pinned Node base digest:

| Cold OCI-export build | Root peak additional bytes | OLED peak additional bytes | Duration |
| --------------------- | -------------------------: | -------------------------: | -------: |
| Embedded default      |              1,576,091,648 |                107,839,488 | 55.058 s |
| Dedicated app-oled    |                    409,600 |              1,580,810,240 | 59.070 s |

The lowest sampled free space was 3,979,956,224 bytes on root during the default
build and 4,334,985,216 bytes on OLED during the dedicated build. Both passed the
3 GiB floor. These are one-second samples from one comparison, not hard peak
bounds. They exclude final image loading into Docker. The two builders use
different BuildKit versions; byte-identical output was not established. Test
cache and generated OCI outputs were cleared after measurement.

## Release image retention

Apply independently to staging and demo, only after the newly activated release
has passed verification:

- Root keeps that environment's current release image.
- OLED keeps verified archives of its immediately preceding release and the
  rollback before that.
- Other app release images can be removed only after those archives are checked
  and free space on both filesystems is confirmed. Never remove the rollback
  while the new release is still unverified.
- The three explicitly protected, unknown-origin images are exceptions. Do not
  remove them without separate owner approval.

Do not interpret this policy as permission to prune Docker globally, remove
non-app images, remove volumes, alter services or touch unrelated files.
