# Commit Changes with Versioning Skill

**Status**: Properly configured VS Code Copilot skill in `.instructions.md`

This skill automates the versioning workflow:

1. Collect change type (bug fix, feature, breaking change)
2. Bump VERSION in `js/constants.js` according to semver
3. Update `changelog.md` with new version entry
4. Create git commit with version message
5. Create annotated git tag for release
6. Provide push instructions

## Quick Reference

### Version Bumping Rules

- **Bug fix** → patch bump only (1.2.3 → 1.2.4)
- **New feature** → minor bump, reset patch (1.2.3 → 1.3.0)
- **Breaking change** → major bump, reset minor + patch (1.2.3 → 2.0.0)

### Manual Workflow (if needed)

If the skill isn't available, do this manually:

1. Edit `js/constants.js`:

   ```javascript
   const VERSION = "1.3.0";
   ```

2. Edit `changelog.md`, add at top under `---`:

   ```markdown
   ## [1.3.0]

   - Your change description here
   ```

3. Commit and tag:
   ```bash
   git add js/constants.js changelog.md
   git commit -m "Version 1.3.0: Your change description here"
   git tag -a v1.3.0 -m "Version 1.3.0: Your change description here"
   git push && git push --tags
   ```

## For Skill Developers

The actual skill instructions are in `.instructions.md`. That file contains:

- YAML frontmatter with metadata
- Detailed step-by-step instructions for agents
- Error handling strategy
- File requirements and validation
- Examples

## Usage Examples

```
"Commit the theme picker feature"
→ Prompts for change type, suggests "New feature"
→ Prompts for summary
→ Updates version 1.10.1 → 1.11.0
→ Updates changelog
→ Creates commit and tag
→ Shows: Ready to push with: git push && git push --tags
```

```
"Commit bug fix for related cell highlighting"
→ Prompts for change type, suggests "Bug fix"
→ Prompts for summary
→ Updates version 1.10.0 → 1.10.1
→ Updates changelog
→ Creates commit and tag
```
