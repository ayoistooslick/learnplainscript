# LearnPlainScript rollback

This repository keeps the complete frontend that existed before the digital-garden redesign.

## Snapshot

- **Original commit:** `7f773d067460c50083209554a0fc58227ab603f6`
- **Backup branch:** `backup/learnplainscript-before-garden-redesign-2026-11-24` (also pushed to `origin`)
- **Annotated tag:** `learnplainscript-pre-garden-redesign-2026-11-24`
- **Redesign branch:** `redesign/learnplainscript-digital-garden-2026-11-24`

The repository already contained a tag named `learnplainscript-pre-garden-redesign` and a remote branch named `redesign/learnplainscript-digital-garden` from earlier work. Neither was overwritten or deleted. The unique `-2026-11-24` names above identify this snapshot and this redesign.

## Remote main before this deployment

While this redesign was in progress, `origin/main` advanced to `e364ee3010f9ca4afd9931dbe7aa1430e876d658` with the earlier garden and dark-theme commits `95b1f12` and `e364ee3`. Those commits were merged into this branch rather than replaced.

- **Remote main tip before merge:** `e364ee3010f9ca4afd9931dbe7aa1430e876d658`
- **Preservation tag:** `learnplainscript-main-before-garden-merge-2026-11-24`

To restore that exact main state locally:

```bash
git fetch origin
git switch --detach learnplainscript-main-before-garden-merge-2026-11-24
```

## Restore the original source

```bash
git fetch origin
git switch --create restore/pre-garden origin/backup/learnplainscript-before-garden-redesign-2026-11-24
npx -y pnpm@10.15.0 install --frozen-lockfile
npm run build
npm run dev
```

Alternatively, use the tag locally:

```bash
git switch --detach learnplainscript-pre-garden-redesign-2026-11-24
npx -y pnpm@10.15.0 install --frozen-lockfile
npm run build
```

The branch and tag point at the same commit. The backup includes the day/night edition that was added immediately before the garden redesign.

## Restore the original production deployment

Preferred: open the Vercel project for `learnplainscript.vercel.app`, go to **Deployments**, find the last deployment made from commit `7f773d0` (or the pre-redesign commit it replaced), and use **Promote to Production**.

If a source redeploy is required:

```bash
git switch backup/learnplainscript-before-garden-redesign-2026-11-24
git push origin HEAD:main
```

That command replaces `main` with the protected snapshot and should only be used to roll production back. Do not force-push unrelated branches, and do not delete the backup branch or tag.

## Restore the redesign branch

```bash
git switch redesign/learnplainscript-digital-garden-2026-11-24
```
