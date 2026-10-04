---
name: document-concepts
description: Documents programming concepts as they appear, from any language or technology. Use whenever a new concept comes up (tag, property, function, command, technical term…) while working.
---
Maintains a glossary in `docs/programming-concepts.md` that grows as the project progresses. If the `docs/` file or folder does not exist, create it.

When a new concept from **any language or technology** appears in the code or conversation (HTML, CSS, JavaScript, SQL, Node, Express, terminal commands, Git, general programming concepts…), add it to the file if it is not already there.

Format for each entry:

```
## <concept name>
**Definition:** a short, clear phrase.
**Explanation:** what it is for and when to use it, in 1–3 sentences.
**Example:**
````
<!-- minimal code, in the appropriate language -->
````
```

Rules:
- In English, clear and understandable tone (beginner level).
- No duplicates: if the concept already exists, do not add it again.
- Group by technology with a section heading (`# HTML`, `# CSS`, `# JavaScript`, `# SQL`, `# Express`…) and sort entries within each group.
- The example should be minimal and real, related to the project when possible.