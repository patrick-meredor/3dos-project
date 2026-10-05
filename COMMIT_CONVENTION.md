# Git & GitHub Commit Guide

This guide defines the commit message conventions for this repository, adhering to the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/) specification.

---

## 1. Commit Message Structure

Every commit message follows this format:

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Example
```text
feat(auth): add google oauth login integration

Implement Google authentication provider using Supabase Auth.
Users can now sign in with one click from the login modal.

Closes #42
```

---

## 2. Commit Types

| Type | Description | Example |
| :--- | :--- | :--- |
| **`feat`** | A new feature for the user | `feat(header): add dark mode theme toggle` |
| **`fix`** | A bug fix for the user | `fix(auth): resolve session expiry redirect loop` |
| **`docs`** | Documentation changes only | `docs(readme): update installation steps` |
| **`style`** | Code formatting, missing semicolons, whitespace (no logic changes) | `style(main): format jsx with prettier` |
| **`refactor`** | Code restructuring without fixing a bug or adding a feature | `refactor(components): extract grid background into reusable component` |
| **`perf`** | Performance improvement | `perf(image): optimize logo loading with priority` |
| **`test`** | Adding missing tests or correcting existing tests | `test(button): add unit tests for click handlers` |
| **`build`** | Changes to build system or external dependencies | `build: update next.js to latest version` |
| **`ci`** | Changes to CI/CD workflows and scripts | `ci(github-actions): add lint and build verification` |
| **`chore`** | Maintenance, package updates, tooling config | `chore: update dependencies in package.json` |
| **`revert`** | Reverting a previous commit | `revert: feat(auth): add guest checkout` |

---

## 3. Scopes (Where the change occurred)

Scopes provide context about the part of the codebase affected by the commit. Put the scope in parentheses after the type:

- `(ui)`: General UI elements or design tokens
- `(auth)`: Authentication and authorization
- `(nav)` or `(header)` / `(footer)`: Navigation components
- `(api)`: API routes or backend calls
- `(deps)`: Dependency upgrades
- `(config)`: Configuration files (`next.config.ts`, `tailwind.config`, etc.)

*Note: Scopes are optional but strongly recommended.*

---

## 4. Subject Line Rules (Grammar & Style)

1. **Use the Imperative Mood**: Write as an instruction or command.
   - ✅ `feat: add dark mode toggle`
   - ❌ `feat: added dark mode toggle`
   - ❌ `feat: adds dark mode toggle`
   > *Tip: Fill in the sentence: "If applied, this commit will **\<your commit message\>**"*
2. **Start with Lowercase**: Do not capitalize the first letter after the colon.
   - ✅ `fix: resolve mobile layout overflow`
   - ❌ `fix: Resolve mobile layout overflow`
3. **No Trailing Period**: Do not end the subject line with a dot (`.`).
   - ✅ `docs: update deployment guidelines`
   - ❌ `docs: update deployment guidelines.`
4. **Length**: Keep the subject line under **50–72 characters**.

---

## 5. Breaking Changes

When introducing changes that break backwards compatibility:

1. **Append an exclamation mark (`!`)** after the type/scope:
   ```text
   feat(api)!: remove deprecated v1 user endpoint
   ```
2. **Or include a `BREAKING CHANGE:` footer**:
   ```text
   refactor(theme): restructure color token variables

   BREAKING CHANGE: `--vignette-start` has been removed and replaced with `--grid-line`.
   ```

---

## 6. GitHub Issue Linking (Footers)

Use official GitHub closing keywords in your commit message footer or PR description to automatically link and close related issues when merged into the default branch:

- `Closes #123`
- `Fixes #123`
- `Resolves #123`

```text
fix(footer): correct alignment on small screens

Closes #15
```

---

## 7. Good vs. Bad Commits

| Bad ❌ | Good ✅ | Why |
| :--- | :--- | :--- |
| `update stuff` | `feat(hero): add call to action buttons` | Clear intent, type, and scope |
| `fixed bug` | `fix(nav): prevent mobile menu from freezing on scroll` | Explains what was actually fixed |
| `WIP` | `feat(auth): scaffold login modal form inputs` | Meaningful milestone description |
| `FEAT: ADDED STUFF.` | `feat(ui): add grid pattern background` | Follows lowercase, imperative, no period |

---

## 8. Git CLI Quick Reference

```bash
# Single line commit
git commit -m "feat(ui): add grid line background"

# Multi-line commit with body and issue reference
git commit -m "feat(ui): add grid line background" -m "Replace vignette background with crisp line grid matching Molecule UI design." -m "Closes #12"
```

---

## 9. Recommended Branch Naming

Pair your commits with standard branch names:

- `feat/<feature-name>` (e.g. `feat/grid-background`)
- `fix/<bug-name>` (e.g. `fix/mobile-nav-overflow`)
- `refactor/<target>` (e.g. `refactor/theme-tokens`)
- `docs/<topic>` (e.g. `docs/commit-guide`)