# EdTech Template Generation Implementation Plan

## Overview

This document outlines the implementation plan for building a complete template management system that generates CSA (Cognitive Structure Analysis) self-assessment templates using LLM agents, stores them with proper versioning, and exposes RESTful endpoints for CRUD operations.

## Background

The CSA methodology trains students to assess their own knowledge across four types:

- **Facts**: "What" knowledge - definitions, concepts, vocabulary
- **Strategies**: "How" knowledge - general approaches, frameworks
- **Procedures**: Specific steps and algorithms
- **Rationales**: "Why" knowledge - principles, theories, explanations

Research shows this approach improves student performance by 1.5-2.5 letter grades.

---

## Phase 1: Design & Schema

### Step 1.1: Extend Database Schema

Create a `templates` table and related tables to support CSA template structure with versioning:

**Templates Table:**

- `id` (serial, PK)
- `subject` (varchar) - e.g., "Mathematics"
- `topic` (varchar) - e.g., "Two-Step Equations"
- `grade_level` (varchar) - e.g., "8th Grade"
- `version` (integer) - for template versioning
- `is_active` (boolean) - soft delete support
- `created_by_user_id` (FK to users)
- `created_at`, `updated_at` (timestamps)

**Template Sections Table:**

- `id` (serial, PK)
- `template_id` (FK)
- `section_type` (enum: facts, strategies, procedures, rationales)
- `content` (text) - the actual template content
- `order_index` (integer) - for section ordering

**Template Translations Table:**

- `id` (serial, PK)
- `template_id` (FK)
- `language_code` (varchar)
- `translated_content` (JSONB) - stores all sections

**Rationale**: Separate sections table allows granular updates and better querying. Translations stored as JSONB for flexibility.

---

## Phase 2: AI Agent System for Template Generation

### Step 2.1: Build Multi-Agent Template Generation Service

Instead of a single LLM call, use an agentic approach with specialized agents:

```
┌─────────────────────────────────────────────────────────┐
│              Template Generation Orchestrator            │
└──────────────────────┬──────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│   Facts    │  │ Strategies │  │ Procedures │
│   Agent    │  │   Agent    │  │   Agent    │
└────────────┘  └────────────┘  └────────────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
              ┌────────────┐
              │ Rationales │
              │   Agent    │
              └────────────┘
                       │
                       ▼
              ┌────────────┐
              │  Review    │
              │   Agent    │
              └────────────┘
```

**Agent Responsibilities:**

- **Facts Agent**: Generates "what" knowledge - definitions, concepts, vocabulary
- **Strategies Agent**: Generates "how" knowledge - general approaches, frameworks
- **Procedures Agent**: Generates specific steps and algorithms
- **Rationales Agent**: Generates "why" knowledge - principles, theories, explanations
- **Review Agent**: Validates coherence across all sections and CSA methodology compliance

**Implementation**: Each agent is a specialized Cohere prompt with specific system instructions. The orchestrator coordinates them sequentially, passing context from one to the next.

### Step 2.2: Few-Shot Learning with Example Templates

Seed the agents with example templates from the research papers:

- 2-step equations template (ax + b = c)
- Reading comprehension template (Little Red Riding Hood example)
- Spanish greetings template
- Electrochemical cells template

Store these as "golden examples" that the LLM can reference via RAG (Retrieval-Augmented Generation) to ensure output quality.

---

## Phase 3: API Layer Implementation

### Step 3.1: Template Types

Create `types/templates.ts`:

```typescript
export interface GenerateTemplateRequest {
  subject: string;
  topic: string;
  gradeLevel: string;
  language?: string; // defaults to "en"
}

export interface TemplateResponse {
  id: number;
  subject: string;
  topic: string;
  gradeLevel: string;
  version: number;
  sections: {
    facts: string;
    strategies: string;
    procedures: string;
    rationales: string;
  };
  createdAt: string;
}

export interface ListTemplatesQuery {
  subject?: string;
  gradeLevel?: string;
  isActive?: boolean;
}
```

### Step 3.2: Template Service

Create `services/templates.ts` with functions:

```typescript
export async function generateTemplate(
  params: GenerateTemplateRequest,
): Promise<TemplateResponse>;

export async function getTemplateById(
  id: number,
): Promise<TemplateResponse | null>;

export async function listTemplates(
  filters: ListTemplatesQuery,
): Promise<TemplateResponse[]>;

export async function updateTemplate(
  id: number,
  updates: Partial<TemplateResponse>,
): Promise<TemplateResponse>;

export async function deactivateTemplate(id: number): Promise<void>;
```

### Step 3.3: Template Controller

Create `controllers/templates.ts` following existing patterns with proper error handling and validation.

### Step 3.4: Template Routes

Create `routes/templates.ts` with endpoints:

```
POST   /api/templates/generate    - Generate new template via LLM
GET    /api/templates             - List all templates with filters
GET    /api/templates/:id         - Get specific template
PATCH  /api/templates/:id         - Update template
DELETE /api/templates/:id         - Deactivate template
```

---

## Phase 4: Agentic Quality Assurance

### Step 4.1: Template Validation Agent

Before storing, run generated templates through a validation agent that checks:

1. All four CSA components are present and non-empty
2. Content is grade-appropriate (reading level check)
3. Prompts are clear and actionable
4. No leading or ambiguous questions
5. Consistent tone across sections

### Step 4.2: Self-Improvement Loop

Track template effectiveness metrics:

- Usage count
- Student completion rates
- Teacher ratings
- Knowledge gap detection accuracy

Use this data to fine-tune generation prompts via few-shot example updates.

---

## Phase 5: Integration & Testing

### Step 5.1: Database Migration

Generate Drizzle migration for new tables.

### Step 5.2: Integration Testing

Test the complete flow:

1. Generate template via API
2. Verify all sections created
3. Test retrieval and filtering
4. Test updates and versioning
5. Verify error handling

### Step 5.3: Documentation

Update README with new endpoints and examples.

---

## Implementation Order

1. **Database schema** - Create migration and types
2. **Template service** - Build agent orchestrator and individual agents
3. **Controller & routes** - Wire up API endpoints
4. **Validation layer** - Add quality checks
5. **Testing & docs** - Validate and document

---

## Key Technical Decisions

| Decision               | Rationale                                                         |
| ---------------------- | ----------------------------------------------------------------- |
| Multi-agent system     | Better quality than single LLM call; each agent specializes       |
| Section-based storage  | Allows granular updates and mixed translations                    |
| JSONB for translations | Flexible schema; easy to add/remove languages                     |
| Versioning             | Supports template evolution without breaking existing assignments |
| Review agent           | Ensures CSA methodology compliance automatically                  |

---

## Success Criteria

- [ ] Templates can be generated via API call with subject, topic, grade level
- [ ] Generated templates contain all four CSA components (facts, strategies, procedures, rationales)
- [ ] Templates are validated for quality before storage
- [ ] Templates support versioning and soft deletion
- [ ] RESTful endpoints provide full CRUD operations
- [ ] Integration tests pass for all endpoints
- [ ] Documentation updated with examples

---

_Last Updated: March 2026_
