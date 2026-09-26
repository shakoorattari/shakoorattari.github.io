// Full case-study pages: the short card data in projects.ts joined with the detailed
// project bullets already recorded in experience.ts (so nothing is written twice).
import { projects, type CaseStudy } from './projects';
import { jobs } from './experience';

export interface CaseStudyPage extends CaseStudy {
  metaTitle: string;
  metaDescription: string;
  role: string;
  period: string;
  stack: string[];
  /** What I did — bullets from the experience data. */
  highlights: string[];
  /** Service slugs this case study evidences. */
  services: string[];
}

const current = jobs.find((j) => j.isCurrent);
if (!current) throw new Error('caseStudies: no current job found in experience.ts');

const project = (prefix: string) => {
  const found = current.projects.find((p) => p.name.startsWith(prefix));
  if (!found) throw new Error(`caseStudies: no experience project starting with "${prefix}"`);
  return found;
};
const category = (prefix: string) => {
  const found = current.categories.find((c) => c.title.startsWith(prefix));
  if (!found) throw new Error(`caseStudies: no experience category starting with "${prefix}"`);
  return found;
};

const meta: Record<string, Pick<CaseStudyPage, 'metaTitle' | 'metaDescription' | 'services'>> = {
  'oneportal-iam': {
    metaTitle: 'OnePortal IAM: Multi-Tenant OAuth 2.0 / OIDC Case Study',
    metaDescription:
      'How I architected a multi-tenant OAuth 2.0 / OIDC authorization server with UAE PASS and Azure Entra ID federation for Sharjah government platforms.',
    services: ['identity-sso-oauth', 'architecture-technical-leadership'],
  },
  'oneportal-digital-workplace': {
    metaTitle: 'OnePortal Digital Workplace: Architecture Case Study',
    metaDescription:
      'Architecture of a unified government digital workplace: service catalogue, knowledge hub and MS Graph integrations, built on .NET and Angular.',
    services: ['web-application-development', 'api-integration-microservices', 'architecture-technical-leadership'],
  },
  'ai-tooling-suite': {
    metaTitle: 'MCP Servers & AIRIA Agents: AI Tooling Case Study',
    metaDescription:
      'How I built MCP servers for Azure DevOps and Active Directory, and AIRIA agents with RAG and guardrails, to bring internal systems into AI workflows safely.',
    services: ['ai-tooling-mcp', 'devops-ci-cd'],
  },
};

const detail = (slug: string): Pick<CaseStudyPage, 'role' | 'period' | 'stack' | 'highlights'> => {
  switch (slug) {
    case 'oneportal-iam': {
      const p = project('OnePortal IAM');
      return { role: p.role, period: p.period, stack: p.stack, highlights: p.highlights };
    }
    case 'oneportal-digital-workplace': {
      const p = project('OnePortal — Unified Digital Workplace');
      return { role: p.role, period: p.period, stack: p.stack, highlights: p.highlights };
    }
    case 'ai-tooling-suite': {
      const p = project('AI Tooling Suite');
      // The suite's own two bullets, then the detailed per-server bullets recorded for the role.
      return {
        role: p.role,
        period: p.period,
        stack: p.stack,
        highlights: [...p.highlights, ...category('AI Tooling').highlights.slice(1)],
      };
    }
    default:
      throw new Error(`caseStudies: unknown slug "${slug}"`);
  }
};

export const caseStudies: CaseStudyPage[] = projects.map((p) => {
  const m = meta[p.slug];
  if (!m) throw new Error(`caseStudies: no page metadata for "${p.slug}"`);
  return { ...p, ...m, ...detail(p.slug) };
});

export const getCaseStudy = (slug: string) => caseStudies.find((c) => c.slug === slug);
