# AI Plan Execution Workflow (Authoritative)

Purpose: enforce a repeatable execution flow that prevents common mistakes during plan delivery.

Scope: applies whenever an AI agent is asked to execute a plan in this repository.

If any instruction here conflicts with a default agent habit, this file wins.

## 1. Start Gate (Must Pass Before Coding)

1. Read the plan file fully.
2. Extract explicit phase boundaries from the plan.
3. Identify required modules by ownership:
   - pure logic in state/feature modules
   - orchestration in app.js
   - DOM/rendering in render or component modules
4. Load and enforce all mandatory standards (no optional selection):
   - guard clauses, no else blocks
   - pure/idempotent logic where required
   - top-level functions only
   - immutable updates
   - JSDoc completeness
5. Create a short execution checklist and follow it in order.

Do not start editing until all five items above are complete.

## 2. Versioning Gate (User-Directed)

Versioning is not AI-directed in this project.

Rules:

1. The user decides major and minor.
2. Patch increments are determined by execution phase/stage mechanics (each completed phase increments patch).
3. Do not infer or choose major/minor.
4. This workflow is generic for all plans; do not hardcode plan-specific version numbers or exceptions here.
5. At start of each phase, update both:
   - js/constants.js VERSION
   - changelog.md entry for that exact version

If version direction is missing, stop and ask.

## 3. Implementation Gate (Per Phase)

For each phase, execute in this order:

1. Apply planned code changes only for that phase.
2. Keep separation of concerns strict.
3. Add or update tests for every behavior changed in the phase.
4. Run required Node test command 1:
   node tests/run-node-tests.js --report-only-failures --report-status
5. Run required Node test command 2:
   node tests/check-app-init.js
6. Fix failures before moving forward.

Test output handling rule:

- Run test commands directly with no output-filter pipelines.
- Do not append `| head`, `| tail`, `| grep`, `| wc`, or similar filters to test commands.
- The configured test output is already concise by design unless failures occur.

No phase is complete until both required Node test commands pass.

## 4. Commit Gate (Per Phase)

After tests pass for the phase:

1. Commit logical chunks during work as needed.
2. Ensure working tree matches intended phase scope.
3. Ensure changelog and VERSION are present and correct.
4. Create final phase commit if needed.
5. Confirm both required Node test commands passed in the current phase before declaring "ready to tag".

Do not tag during normal implementation commits.

## 5. Human-in-the-Loop Tag Gate (Hard Stop)

Tag creation requires explicit user approval.

Rules:

1. Never create a tag automatically.
2. Stop at "ready to tag" and present validation status.
3. Wait for explicit user instruction to tag that phase.
4. Only then create the tag for that exact version.

If explicit approval is not present, do not tag.

## 6. Definition of Done (Per Phase)

A phase is done only when all are true:

1. Planned scope for the phase is implemented.
2. Required tests were added/updated and both required Node test commands pass.
3. VERSION and changelog match the user-directed version.
4. Commits are created for the phase.
5. Tag is created only after explicit user approval.

## 7. Anti-Regression Checklist

Before declaring completion, verify:

1. No cross-module concern leakage.
2. No implicit version decisions by AI.
3. No skipped required test commands (both Node test commands were run and passed).
4. No premature tagging.
5. No unresolved plan items for the active phase.
6. No output-filter pipelines were used when running required test commands.

## 8. Required Execution Script for Agents

When asked to execute a plan, follow this script:

1. Identify active phase and user-directed version.
2. Apply scoped changes.
3. Add/update tests.
4. Run both required Node test commands and fix issues.
5. Commit phase work.
6. Stop and request explicit tagging approval.
7. Tag only after approval.
