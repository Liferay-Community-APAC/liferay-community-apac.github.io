---
title: Installing
parent: Guide
nav_order: 1
---

# Installing My App
{: .no_toc }

An example page showing what the docs layout supports.

1. TOC
{:toc}

## Step 1: Download the Release

Download `my-app.zip` from the repository's releases.

{: .note }
A note callout. Also available: `{: .tip }`, `{: .important }` and `{: .warning }` on the line before a paragraph.

## Step 2: Deploy It

1. Copy `my-app.zip` into `<liferay-home>/osgi/client-extensions`.

1. Check that it started:

   ```bash
   curl http://localhost:8080/o/my-app/ready
   ```

{: .warning }
Deploy it into a running Liferay.

## Related Information

- [Guide](./)
- [My App](../)
