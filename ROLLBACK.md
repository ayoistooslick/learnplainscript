# Rollback: LearnPlainScript digital garden redesign

This redesign was started from the original frontend commit `fe9001b242c3d6bb3acee2e7aaf62c9ab1b96ca2`.

- Backup branch: `backup/learnplainscript-before-garden-redesign-2026-11-24`
- Backup tag: `learnplainscript-pre-garden-redesign`
- Redesign branch: `redesign/learnplainscript-digital-garden`

## Restore the original source

```sh
git fetch origin --prune
git switch backup/learnplainscript-before-garden-redesign-2026-11-24
git reset --hard learnplainscript-pre-garden-redesign
```

The backup branch and tag are immutable snapshots of the application before this redesign. To create a local recovery branch without changing either snapshot:

```sh
git switch -c restore/learnplainscript-original learnplainscript-pre-garden-redesign
```

## Restore the original production deployment

In Vercel, open the existing `learnplainscript` project, select the deployment built from `learnplainscript-pre-garden-redesign` (or the backup branch), and promote that deployment to production. Do not delete the redesign branch or tag while rolling back.

If production is managed from Git, set the production branch back to the backup branch, deploy it, then return the production branch to its normal value after the incident is resolved.
