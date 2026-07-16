# RudraX skills and specialist agents

RudraX ships with a curated library of reusable skills and specialist-agent profiles. The Agency system discovers these files from `tools/agency/skills/` and exposes them through the WebUI and orchestration runtime.

## Inventory

| Collection | Count |
|---|---:|
| Original RudraX specialist agents | 179 |
| Reusable operational skills | 170 |
| Total Agency entries | 349 |

## Use from RudraX

```text
/agency list
/agency categories
/agency search github
/agency activate github-code-review
```

The Chief of Staff can also select skills automatically when decomposing a mission. Each skill remains a plain-text `SKILL.md` file, so teams can inspect, version, edit, or replace it without a proprietary registry.

## Skill layout

```text
tools/agency/skills/<skill-name>/
├── SKILL.md
├── references/   optional reference material
├── templates/    optional reusable templates
├── scripts/      optional helper scripts
└── assets/       optional static assets
```

## Design rules

- Keep each skill narrow and operational.
- Put prerequisites and verification steps near the top.
- Never embed API keys, passwords, or access tokens.
- Prefer deterministic scripts for mechanical work.
- Preserve license notices for third-party components.
- Test commands and paths before publishing changes.

RudraX is developed by Lalit Pandit. Contributions to the skill library are welcome through GitHub pull requests.
