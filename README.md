# dsh-facet-cards

English | [简体中文](README.zh.md)

[![DSH](https://img.shields.io/badge/DSH-%3E%3D0.2.0--rc.2-4c6ef5)](#requirements)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Give every conversation its own facet — without touching the system prompt.**

One chat wants a patient teacher. The next wants a blunt code reviewer. Another wants a character to talk to. Facet cards (人设卡) let each DSH session carry its own identity: who the agent is, how it talks, how it writes code, and what it must never do.

Edit cards in Settings, switch them from the dock beside the composer, and change them mid-conversation without losing context.

## Highlights

- **Usage counters with sorting** — see which facets your sessions actually use.
- **Categories** — group and filter the library.
- **Per-card local images** — a face for every facet, in the list and in the dock.
- **Dock-style picker** — a compact composer-side dock for fast switching.

## Why not just use a preset?

An Agent preset is a whole agent: tools, plugins, composition. It is chosen when the session is created and stays fixed.

A facet card is one lightweight layer on top: a small JSON file with a persona and style. It works with any preset, and you can switch it at any time.

| | Agent preset | Facet card |
|---|---|---|
| Scope | Whole agent | Persona and style |
| When it applies | At session creation | Immediately, any time |
| Switch mid-conversation | No | Yes |
| Authoring | YAML / files | Visual editor |
| Share | Install a package | Send one `.dshcd` file |

## Requirements

- DeepSeek Harness `>= 0.2.0-rc.2`
- Node `>= 22`

## Install

From GitHub:

```sh
dsh plugin --profile <profile> add github:13052293681-blip/dsh-facet-cards
```

Desktop client: open Settings -> Plugins, install `dsh-facet-cards` from GitHub, then restart the app.

The install is the only step that needs a restart. Creating, editing, and switching cards take effect immediately.

## Quick start

1. Open Settings -> 人设卡.
2. Click 新建卡片.
3. Write the facet: who they are, how they speak, how they work.
4. Pick it from the dock beside the composer for the current session, or set it as the default for new sessions.

## Switching

The dock beside the composer has three kinds of choice:

- **A specific card** — pin this session to that facet.
- **Follow the default** — use whatever the global default is.
- **No card** — leave this session on the host's normal persona.

Switch as often as you like. The conversation context stays; only the identity changes.

## What you can shape

The editor groups fields the way you would brief a new teammate:

- **Identity** — who they are, what they know, what they care about.
- **Voice** — tone, pacing, pet phrases, words to avoid.
- **Code** — naming, comments, testing habits.
- **Workflow** — when to ask, when to verify, how to plan.
- **Guardrails** — the lines they never cross.

## Saving and applying

Saving writes the card to disk. It does **not** silently change a conversation that is already running.

When a card is in use, its row shows how many sessions are on it. Press 重新应用 to push the saved version into those live sessions.

## Import / export

A card is one `.dshcd` file. Export it, send it to a friend, import it back. Fields this build does not know are preserved. Cards exported from the original character-cards plugin import unchanged.

## Known limitations

- **Roleplay presets already carry a complete persona.** If a preset is already playing a character, use one or the other; stacking a card on top can produce two competing identities.
- **A running session keeps the version it started with** until you press 重新应用.
- **The interface is currently Chinese.** Cards themselves can be written in any language.
- **The desktop profile is app-managed.** Install and update inside the desktop client rather than through the CLI.

## Origin & license

dsh-facet-cards is an independent continuation of [sildo466/dsh-character-cards](https://github.com/sildo466/dsh-character-cards) (v0.1.0, MIT), reworked and rebranded with new features. Released under the [MIT License](LICENSE) — thanks to the original author.

## Changelog

- **1.0.0** — first release under the independent dsh-facet-cards identity: usage counters with sorting, card categories, per-card local images, and a dock-style composer picker.
