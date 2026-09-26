---
title: 'Designing a multi-tenant OAuth 2.0 / OIDC authorization server in .NET'
description: 'How to structure tenant isolation, scopes, roles and token validation for an OAuth 2.0 / OpenID Connect authorization server serving several organisations.'
date: 2026-10-01
tags: ['OAuth 2.0', 'OIDC', 'IAM', '.NET', 'Multi-tenant']
draft: true
outline: true
---

> **Outline, not an article.** Every bracketed prompt is something only you know. Replace the prompts with your real experience, keep what's true, delete the rest, then rename the file, set `outline: false` and `draft: false`.

## Search intent this targets
People designing or evaluating an authorization server for **several tenants** (departments, agencies, customers): "multi-tenant OAuth 2.0 architecture", "OIDC tenant isolation", "scopes vs roles". They are technical, mid-project, and looking for a decision framework rather than a tutorial.

## Working title options
- Designing a multi-tenant OAuth 2.0 / OIDC authorization server in .NET
- Tenant isolation, scopes and roles: lessons from a government IAM platform

## Structure

### 1. The problem [2–3 paragraphs]
- [Who the tenants were and why one shared identity platform was needed — keep it non-confidential.]
- [What went wrong or was ambiguous before: integration contracts, duplicated sign-in, inconsistent token rules.]

### 2. Decisions and why
For each decision, use: **options considered → what you chose → what it cost.**
- **One authority or one per tenant?** [Your reasoning.]
- **Which flows, for which client types** — Authorization Code + PKCE, Client Credentials, On-Behalf-Of. [When you used each, and a case where the wrong choice would have hurt.]
- **Token design** — audience validation, lifetimes, what goes in claims and what stays out. [Your rules.]
- **Scopes vs roles vs tenant** — how a request's permission is decided. [A concrete example with names changed.]
- **Federation** — UAE PASS and Azure Entra ID behind the same contract. [What the consuming apps see.]

### 3. What we got wrong or nearly got wrong
[The honest section readers value most: an edge case, a misconfiguration, something a code review caught.]

### 4. Standards and guidance for teams
[The written guidelines you gave the teams building on the platform; a short checklist works well.]

### 5. What I'd do differently
[2–3 bullets.]

## Add before publishing
- A diagram of the flow between client, authorization server and API (redact anything sensitive).
- Links to the specs you rely on (RFC 6749, RFC 7636 for PKCE, OpenID Connect Core).
- A closing pointer to [/services/identity-sso-oauth/](/services/identity-sso-oauth/) and the [OnePortal IAM case study](/projects/oneportal-iam/).

## Check for confidentiality
Anything about a government system needs a "safe to publish" pass: no internal hostnames, tenant names, client IDs or unreleased details.
