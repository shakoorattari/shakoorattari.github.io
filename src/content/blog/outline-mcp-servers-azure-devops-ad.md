---
title: 'Building MCP servers for Azure DevOps Server and Active Directory'
description: 'How to expose on-premises engineering systems to AI agents safely with Model Context Protocol servers: design choices, permissions and lessons learned.'
date: 2026-10-15
tags: ['MCP', 'AI agents', '.NET', 'Azure DevOps', 'Active Directory']
draft: true
outline: true
---

> **Outline, not an article.** Bracketed prompts are for your real experience. Replace them, keep only what is true and safe to publish, then set `outline: false` and `draft: false`.

## Search intent this targets
Engineers asking how to connect **on-premises** systems (Azure DevOps Server, Active Directory) to AI assistants: "MCP server for Azure DevOps Server", "Model Context Protocol .NET", "MCP Active Directory". The topic is new, so a clear practical write-up can stand out. (Check current search results first and confirm what already exists before you claim a gap.)

## Working title options
- Building MCP servers for Azure DevOps Server and Active Directory in .NET (longer form for the H1)
- Bringing on-premises engineering systems into AI workflows with MCP

## Structure

### 1. Why an MCP server
[The gap: what agents could not see or do before; why an existing public MCP server did not fit your on-premises Azure DevOps Server 2022.2 — state only what you verified.]

### 2. What each server exposes
- **Azure DevOps Server** — projects, repositories, pipelines, work items, build history. [Which tools you defined, and which you deliberately left out.]
- **Active Directory** — identity lookups, group membership, org context. [How you limit what can be queried.]
- **Localisation (TransLynk)** — extracting UI strings, generating English/Arabic, diffing and upserting only new entries. [How you kept it safe to run repeatedly.]

### 3. Design choices
- **Tool granularity** — many small tools or a few broad ones? [What worked.]
- **Permissions and data boundaries** — read-only defaults, scoping, what never leaves the network. [Your approach.]
- **Auth to the underlying system** — service account vs on-behalf-of. [Your decision and trade-off.]
- **Guardrails** — intent routing and policy checks around the agents (AIRIA). [What you enforce where.]

### 4. What surprised you
[Failure modes: over-eager agents, ambiguous tool descriptions, rate limits, large results.]

### 5. Results
[Only measurable or observable outcomes you are comfortable stating; avoid invented numbers.]

### 6. Starting points for readers
[Links to the MCP SDK and spec; a minimal .NET code sketch if you can share one.]

## Add before publishing
- A short code excerpt (sanitised) showing one tool definition.
- A closing pointer to [/services/ai-tooling-mcp/](/services/ai-tooling-mcp/) and the [AI tooling case study](/projects/ai-tooling-suite/).

## Check for confidentiality
No internal hostnames, project names, org structure or data samples from real systems.
