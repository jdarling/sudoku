# Commit Changes with Versioning

Automates committing changes by:

1. Determining change type (bug fix, feature, breaking change)
2. Bumping version in `js/constants.js` according to semver
3. Updating `changelog.md` with new version and summary
4. Staging and committing all changes
5. Preparing for git push

## Workflow

### Input

Collect from user:

- **Change type**: "bug fix" | "feature" | "breaking change"
- **Summary**: One-line description of changes (e.g., "Added hint button", "Fixed solve button marking solved cells as given")

### Version Bump Rules

Use semantic versioning (MAJOR.MINOR.PATCH):

- **Bug fix** → Increment patch only
  - Example: 1.8.0 → 1.8.1
- **New feature** → Increment minor, reset patch to 0
  - Example: 1.8.1 → 1.9.0
- **Breaking change** → Increment major, reset minor and patch to 0
  - Example: 1.8.1 → 2.0.0

### Execution Steps

1. **Ask user for change details**
   - Change type (radio: bug fix, feature, breaking change)
   - Summary (text)

2. **Calculate new version**
   - Read current VERSION from `js/constants.js`
   - Parse semver: `major.minor.patch`
   - Apply bump rule based on change type
   - Generate new version string

3. **Update `js/constants.js`**
   - Replace `VERSION = "old.version"` with `VERSION = "new.version"`
   - Keep comment and other constants intact

4. **Update `changelog.md`**
   - Read current file
   - Insert new section at top (under divider line):

     ```markdown
     ## [new.version]

     - Summary text here
     ```

   - Preserve all existing changelog entries

5. **Git operations**
   - Stage both files: `git add js/constants.js changelog.md`
   - Create commit: `git commit -m "Version new.version: summary"`
   - Create version tag: `git tag -a vnew.version -m "Version new.version: summary"`
   - Output: "Ready to push with: git push && git push --tags"

### Error Handling

- If `js/constants.js` has unexpected VERSION format → Ask user to verify file
- If `changelog.md` is missing → Create with minimal structure
- If git operations fail → Show error and suggest manual steps

### Example

**Input:**

- Change type: feature
- Summary: Added hint button that highlights incorrect cells

**Process:**

- Current version: 1.8.0
- New version: 1.9.0 (minor bump)
- Update VERSION constant
- Add to changelog:

  ```markdown
  ## [1.9.0]

  - Added hint button that highlights incorrect cells
  ```

- Git commit: `Version 1.9.0: Added hint button that highlights incorrect cells`

**Output:**

- Version updated ✓
- Changelog updated ✓
- Changes committed ✓
- Ready for: `git push`

## Related Skills

- **agent-customization** — For creating VS Code agent skills
- **git workflows** — For more complex git operations
