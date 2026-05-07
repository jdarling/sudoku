# Ansible Coding Standards

This document is Ansible-specific and extends `./general.md`.

## Core Standards

- Write declarative desired state, not procedural scripts in YAML.
- Keep playbooks readable enough to document the workflow on their own.
- Use 2 spaces for indentation; never use tabs.
- Use `.yml` for Ansible YAML files.
- Use `.j2` for Jinja templates.
- Prefer simple playbooks first; introduce roles, collections, and inventories when
  they reduce real complexity.
- Run `ansible-lint` and YAML formatting checks for all substantive changes.
- Prefer purpose-built `ansible.builtin` modules first.
- Use `ansible.builtin.command` only when no purpose-built module fits.
- Use `ansible.builtin.shell` only when shell features are required and
  `ansible.builtin.command` is insufficient.
- Avoid arbitrary sleeps. Wait for a specific condition or use module-native wait
  behavior.
- Add smoke tests after starting services or provisioning endpoints.
- Build new tasks and roles with check mode in mind when project budget allows.
- Playbooks intended for automation runners must be non-interactive.
- Accept required runtime inputs through inventory, variable files, or
  `extra_vars`.

## Naming

- Use lowercase names with underscores for files, roles, groups, variables, and
  task files.
- Avoid whitespace and hyphens in Ansible identifiers.
- Use human-meaningful names; terse is good, vague is not.
- Prefer noun-action file names such as `network_create.yml` or
  `instance_provision.yml`.
- Prefix role variables with the role or application name to avoid collisions.
- Use temporary prefixes for registered values and temporary facts:
  `r_` for registered results, `f_` for facts, or `_` for short-lived private
  values.
- Name dictionaries once and do not repeat that prefix in every child key.

```yaml
apache_options:
  port: 80
  path: /opt/apache
  version: 1
```

## Project Structure

- Keep project layout predictable:
  `collections/`, `roles/`, `inventory/`, playbooks, and `site.yml`.
- Separate provisioning, configuration, and deployment playbooks.
- Use `site.yml` to import or orchestrate the major playbooks.
- Prefer dynamic inventory for cloud resources, including OCI.
- Keep inventory as a single source of truth and consider a separate inventory
  repository when inventory has its own lifecycle or access rules.
- Use `group_vars` before `host_vars`; host variables should be exceptions for
  true one-off hosts.
- Store secrets as Vault-encrypted strings, not fully encrypted files, so
  surrounding context remains reviewable.
- Maintained roles should include a `README.md` with purpose, required variables,
  optional variables, dependencies, examples, and supported tags.

## Playbooks

- Playbooks answer `where` and `what`; roles answer `how`.
- Keep plays thin. Prefer a clear ordered list of role inclusions over inline task
  logic.
- Prefer `ansible.builtin.include_role` when role order, tags, variables, or
  conditions need to be explicit.
- Use `module_defaults` when many tasks repeat the same module arguments.
- Keep `hosts`, `gather_facts`, `module_defaults`, `vars`, and `tasks` in a
  consistent top-to-bottom order.
- Put `name` first on every play and every task.
- Keep task names action-oriented and specific.
- Fail with clear errors when required inputs or preconditions are missing.
- Emit concise structured output when downstream systems depend on job results.
- Tag role entry points and operational phases consistently.
- Do not rely on tags to skip required safety checks unless the role explicitly
  supports that mode.

```yaml
- name: Provision OCI compute instance
  hosts: localhost
  gather_facts: false
  collections:
    - oracle.oci
  tasks:
    - name: Create compute instance
      oracle.oci.oci_compute_instance:
        compartment_id: "{{ oci_compartment_id }}"
        availability_domain: "{{ oci_availability_domain }}"
        display_name: "{{ compute_instance_name }}"
        shape: "{{ compute_shape }}"
        source_details:
          source_type: image
          image_id: "{{ compute_image_id }}"
        create_vnic_details:
          subnet_id: "{{ compute_subnet_id }}"
          hostname_label: "{{ compute_hostname_label }}"
        key_by:
          - compartment_id
          - availability_domain
          - display_name
        wait: true
        wait_timeout: 2400
      register: r_compute_instance
```

## Roles

- Keep roles focused, self-contained, and loosely coupled.
- A role should own one service, component, or resource lifecycle, not a whole
  environment.
- Define role inputs in `defaults/main.yml` when callers may override them.
- Use `vars/main.yml` only for values callers should not normally override.
- Avoid role-to-role dependencies unless the dependency is intrinsic.
- Prefer passing variables into `include_role` instead of relying on external
  variables appearing by convention.
- Split task files by operation when a default `tasks/main.yml` behavior would
  be ambiguous.
- Maintained roles should be safe and reliable in check mode unless a documented
  dependency makes that impractical.

```yaml
- name: Configure apache
  ansible.builtin.include_role:
    name: apache
    tasks_from: configure.yml
  vars:
    apache_port: 8080
```

## Variables

- Move repeated strings, paths, IDs, tags, and module arguments into variables.
- Quote Jinja expressions when they are YAML values.
- Use spaces inside Jinja delimiters: `{{ value }}`, not `{{value}}`.
- Define paths without trailing slashes and join path segments explicitly.
- Validate required variables before first use with `ansible.builtin.assert`.
- Keep variable files data-focused; do not hide workflow logic in variables.
- Prefer dictionaries for related settings, but keep their shape shallow and
  readable.

```yaml
app_root: /opt/example
app_config_dir: "{{ app_root }}/config"

apache_options:
  port: 8080
  document_root: "{{ app_root }}/www"
```

## Tasks and Conditionals

- Keep tasks idempotent. Re-running a playbook should normally produce no changes.
- Use `changed_when` and `failed_when` when command-style tasks are unavoidable.
- Avoid `ignore_errors`; handle expected failure states explicitly.
- Put `when` immediately after `name`.
- Prefer positive conditions over negated or compound conditions.
- Ensure variables are defined before referencing them.
- Register command or module results only when a later task uses them.
- Keep handlers for service restarts and notifications; do not duplicate restart
  tasks throughout a role.
- Validate preconditions before destructive, service-impacting, or long-running
  operations.
- Prefer facts, stat checks, service status, API lookups, or provider info
  modules over guessing current state.
- Command and shell tasks must define idempotency with `creates`, `removes`,
  `changed_when`, or a prior state check.
- Do not report changed for read-only checks.
- Use `block`, `rescue`, and `always` for task sequences that need cleanup,
  rollback, or guaranteed final logging.
- Keep rescue paths small and explicit; do not hide normal control flow in rescue
  blocks.

## Check Mode

- Treat check mode as a design target for maintained roles.
- Prefer modules with native check-mode support for state-changing tasks.
- Keep read-only discovery tasks safe to run in check mode.
- For command and shell tasks, explicitly decide how check mode behaves:
  skip the task, run only a read-only command, or report a predicted change.
- Never run a mutating command or shell task in check mode.
- Use `ansible_check_mode` for check-mode branches when module behavior is not
  sufficient.
- Use `check_mode: false` only for safe read-only discovery tasks that must run
  during check mode.
- Document role-level check-mode limitations in the role `README.md`.
- If full check-mode support is out of scope, ensure the role fails safely or
  skips unsafe tasks with a clear message.

```yaml
- name: Preview package update command
  ansible.builtin.debug:
    msg: "Would update package {{ package_name }}"
  when: ansible_check_mode

- name: Update package
  ansible.builtin.command:
    cmd: "pkg update {{ package_name }}"
  when: not ansible_check_mode
  register: r_package_update
  changed_when: r_package_update.rc == 0
```

## Privilege and Multi-Host Safety

- Use `become` only where privilege escalation is required.
- Prefer task- or block-level `become` over play-level escalation unless every
  task needs it.
- Set `become_user` explicitly when automation must run as a service account.
- Write roles so they behave correctly across multiple hosts.
- Use `run_once`, `delegate_to`, `serial`, and `throttle` intentionally when tasks
  coordinate shared resources.
- Avoid shared mutable local files unless access is serialized or delegated
  predictably.

```yaml
- name: Ensure required OCI variables are defined
  ansible.builtin.assert:
    that:
      - oci_compartment_id is defined
      - oci_region is defined
    fail_msg: OCI compartment and region must be provided.
```

## Formatting

- Use native YAML mappings, not one-line module argument strings.
- Keep related module parameters grouped in a readable order:
  required identifiers, desired state, nested detail blocks, tags, wait behavior.
- Use multiline YAML scalars for long strings or commands.
- Keep comments sparse and focused on intent, constraints, or non-obvious
  provider behavior.
- Prefer `true` and `false` for booleans in new code.
- Preserve external examples only when exact spelling is required by the provider
  documentation.
- Be explicit about symlink behavior when managing files and directories.
- Use module options such as `follow` where supported when the target may be a
  symlink.
- Avoid inline scripts in playbooks. If script logic is unavoidable, keep it in a
  reviewed script file, template it deliberately, and call it with explicit
  arguments.

## Logging and Operator Output

- Use `ansible.builtin.debug` sparingly for meaningful progress, summaries, and
  operator-facing context.
- Long-running roles should log clear start, completion, and failure context.
- Do not log secrets, tokens, private keys, or sensitive host data.

## Collections and Fully Qualified Names

- Use fully qualified collection names for modules in shared roles and examples.
- Declare `collections:` only when it materially improves readability in a
  playbook that heavily uses one collection.
- Pin collection versions in `collections/requirements.yml`.
- Keep a collection together only when the roles, modules, and plugins share one
  lifecycle and should be tested and released together.

## OCI and Oracle Collection Preferences

- Prefer the official `oracle.oci` collection for Oracle Cloud Infrastructure
  resources.
- Prefer `oracle.oci.<module>` fully qualified module names in shared content.
- Use module-native idempotency before adding custom lookup or shell logic.
- For OCI create tasks, set `key_by` when the default all-attribute comparison is
  too broad or unstable.
- Use only top-level attributes in `key_by`.
- Do not combine `key_by` with `force_create`.
- Avoid `force_create` unless duplicate resources are explicitly intended.
- Use OCIDs for update and delete operations unless the module documents a safe
  name-based workflow.
- Set `wait: true` and explicit `wait_timeout` values for long-running OCI create,
  update, and delete operations.
- Use `wait: false` only when later tasks do not depend on the resource reaching
  its terminal state.
- Keep OCI auth settings in environment, inventory, or module defaults instead of
  duplicating credentials in tasks.
- Never commit API keys, private keys, security tokens, or tenancy-specific
  secrets.
- Use `freeform_tags` and `defined_tags` consistently for ownership, environment,
  cost, and automation metadata.

```yaml
module_defaults:
  oracle.oci.oci_compute_instance:
    region: "{{ oci_region }}"
    config_profile_name: "{{ oci_config_profile_name | default('DEFAULT') }}"
```

## Testing and Review

- Run `ansible-lint` before review.
- Run syntax checks with the same inventory shape used by automation:
  `ansible-playbook --syntax-check`.
- Use check mode for maintained roles and playbooks:
  `ansible-playbook --check`.
- If check mode is not fully supported, document the limitation and verify unsafe
  tasks skip or fail safely.
- Test idempotency by running the same playbook twice and confirming the second
  run reports no unexpected changes.
- For service automation, verify readiness with `ansible.builtin.uri`,
  `ansible.builtin.wait_for`, or a provider-specific facts module.
- For OCI automation, verify created resources with the matching
  `oracle.oci.*_facts` or info module when downstream tasks depend on returned
  attributes.

## Practical Exceptions

- Generated Ansible content may follow generator output unless it is being
  converted into maintained project code.
- Use short module names only in local, single-purpose playbooks where the
  collection context is obvious and lint rules allow it.
- Custom modules are a last resort. Prefer built-in modules, collection modules,
  `ansible.builtin.uri`, or a focused role first.

See also:

- `./general.md`
- Oracle Cloud Infrastructure Ansible Collection documentation
