---
name: changelog
description: Creates or updates docs/changelog.md with a chronological record of all code implementations, modifications, and deletions in the project. Use whenever a code change is made.
---

# Changelog

Every time code is added, modified, or deleted in the project, update the file `docs/changelog.md` by adding an entry at the end with the following format:

```markdown
[YYYY-MM-DD] Type | Affected file(s)
- Description of the change
```

| Type | Meaning |
|------|---------|
| `+` | New implementation / file created |
| `~` | Modification of existing code |
| `-` | Deletion of files or code |

The file has already been created. Always add at the end, without removing previous entries.