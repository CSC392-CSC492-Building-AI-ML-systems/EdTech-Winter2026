import { eq, and, ilike } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  templates,
  templateSections,
  templateTranslations,
  type NewTemplate,
  type NewTemplateSection,
} from "../db/schema.js";
import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type {
  GenerateTemplateRequest,
  TemplateResponse,
  TemplateSections,
  ListTemplatesQuery,
  UpdateTemplateRequest,
  ValidationResult,
} from "../types/templates.js";

const MATH_EXAMPLE = `Script for self-assessment
I want to teach you how to assess your own knowledge that you have about a subject area.
Let's do this by taking an example that you already know. Suppose you wanted to assess your own knowledge about solving 2-step equations of the form ax + b = c. An example of this type of problem is 2x + 3 = 15. If I want to be able to solve problems like these, I need four types of knowledge. These are facts, strategies, procedures and rationales. Fact are concepts you have that describe objects or elements. For example, for two step equations, I need to know what variables, constants, coefficients, equations, and expressions are. Strategies are general processes I would use to solve a problem. For two step equations, this would be reverse order of operations. Procedures are the specific steps that I would use in a strategy. So if I am using reverse order of operations, I need to know additive and multiplicative inverses. Finally, I need to know rationales which are the reasons why the strategies or the procedures work the way they do. For example, this could include things like the subtraction or the division property of equality that says that when you do the same operation to both sides of an equation, you preserve the value of the equation. You can think of facts as telling you "what", strategies and procedures as telling you "how" and rationales as telling you "why".`;

const MATH_ASSESSMENT = `With this in mind, this is how I might assess my own knowledge of solving two step equations.
For facts, I need to know what variables, constants, coefficients, equations and expressions are. A variable is an unknown quantity, usually represented by a letter. A constant is a specific number. A coefficient is a number that you multiply a variable by like 2x. An equation is an expression that is equally to another expression and the two expressions are joined by an equal sign. An expression is one or more terms that are combined by mathematical operations like addition, subtraction, multiplication and division.
For strategies, I need to know reverse order of operations which is SADMEP. This stands for subtraction, addition, division, multiplication, exponents and parentheses. I know that I'm supposed to do these in order but I don't remember whether I'm supposed to do subtraction always before addition or just which one goes first. The same is true for division and multiplication.
For procedures, I need to know additive inverse and multiplicative inverse. The additive inverse is taking the number with the opposite sign as the constant and adding it to both sides of the equation. The multiplicative inverse is taking the inverse of the coefficient of the variable and multiplying both sides of the equation by it. However, if the coefficient is negative, I'm not sure if the multiplicative inverse is supposed to be negative as well.
For rationales, I believe the two rationales I need are the subtraction property of equality and the division property of equality. The subtraction property of equality says that if I subtract the same number from both sides, which is what I'm doing with the additive inverse, I preserve the equality. Similarly, the division property of equality says that if I divide both sides of the equation by the same number, which is what I'm doing with the multiplicative inverse, I preserve the equality.`;

const MATH_REVIEW = `When I look over what I wrote, I see that I am good with my facts. On my strategy, I'm not sure about the order of steps in reverse order of operations when it comes to subtraction and addition or multiplication and division, so I need to learn those. On procedures, I'm not sure what to do with multiplicative inverses when the coefficient is negative, so I need to learn that as well. For rationales, I think I'm OK. I don't think I have any missing facts/concepts that I left out that I should know or I didn't list any facts/concepts where I didn't know what they were. For the strategy, I believe I listed the correct strategy and parts of the strategy, but I wasn't sure about some of the ordering of steps in the strategy. For procedures, I was good on the additive inverse but had a question on carrying out the multiplicative inverse when the coeffcient was negative. For rationales, I think I had all the rationales that were important and that I understood them as well. I don't think I left anything out.`;

const READING_EXAMPLE = `Script for self-assessment
I want to teach you how to assess your own knowledge that you have about a subject area. Let's do this by taking an example that you already know. Suppose you wanted to assess your own knowledge about the story Little Red Riding Hood. If I want to be able to understand stories, I need four types of knowledge. These are facts, strategies, procedures and rationales. Fact are concepts you have that describe objects or elements. For example, in reading, facts can be characters or elements of the setting such as location or time period. Strategies are the general plot sequences of events that authors use to make the points or express the themes or conflicts they write about. Procedures are the specific events in the story that are part of the overall strategy or plot. Finally, I need to know rationales which are the reasons behind the plot elements or events. Rationales could include things like author's purpose, the character's goals (why the characters act the way they do) and how elements of the story reinforce the points the author is trying to make. You can think of facts as telling you "what", strategies and procedures as telling you "how" and rationales as telling you "why".`;

const HISTORY_EXAMPLE = `Script for self-assessment for history
I want to teach you how to assess your own knowledge that you have about a subject area. Let's do this by taking an example that you already know. Suppose you wanted to assess your own knowledge about the Declaration of Independence. If I want to check my knowledge of this, I need to assess four types of knowledge. These are facts, strategies, procedures and rationales. Fact are concepts you have that describe objects or elements. For example, for historical knowledge, I need to know the relevant people, dates, locations, the context of the event, etc. Since historical events are typically described in a problem-solution text structure, the strategy knowledge is the problem being faced and the strategy or solution to that problem. Procedures are specific events that occurred in the strategy, Finally, I need to know rationales which are the reasons why the events happened or any outcomes they produced. Since historical events often describe problems and solutions, I need to know what the problems and solutions were and why those particular solutions were chosen. A rationale could also be how the historical event affects the present or other time periods or how it impacted other parts of the world. You can think of facts as telling you "what", strategies and procedures as telling you "how" and rationales as telling you "why".`;

function buildExamplesBlock() {
  return `EXAMPLE 1 (Mathematics — Two-Step Equations, 8th Grade):
INTRODUCTION:
${MATH_EXAMPLE}

MODEL SELF-ASSESSMENT:
${MATH_ASSESSMENT}

SELF-REVIEW:
${MATH_REVIEW}

EXAMPLE 2 (Reading Comprehension — Little Red Riding Hood):
INTRODUCTION (excerpt):
${READING_EXAMPLE}

EXAMPLE 3 (History — Declaration of Independence):
INTRODUCTION (excerpt):
${HISTORY_EXAMPLE}`;
}

function baseContext(subject: string, topic: string, gradeLevel: string) {
  return `Subject: ${subject}\nTopic: ${topic}\nGrade Level: ${gradeLevel}`;
}

const templateSchema = z.object({
  introduction: z
    .string()
    .describe(
      'The introduction section. Teaches students how to self-assess by explaining facts, strategies, procedures, and rationales in the context of this specific subject/topic. Written as flowing narrative prose in first person as a teacher speaking to a student. Must open with "Script for self-assessment" and end with: You can think of facts as telling you "what", strategies and procedures as telling you "how" and rationales as telling you "why".',
    ),
  model_assessment: z
    .string()
    .describe(
      'The model self-assessment section. Demonstrates how a student would self-assess their knowledge by walking through facts, strategies, procedures, and rationales as narrative prose. Must open with "With this in mind, this is how I might assess my own knowledge of [topic]." Must include realistic knowledge gaps and uncertainties — NOT perfect textbook answers. Written as a student thinking aloud with phrases like "I know that...", "I don\'t remember whether...", "I\'m not sure if...".',
    ),
  self_review: z
    .string()
    .describe(
      'The self-review section. The student looks back over their self-assessment and identifies strengths and gaps. Must open with "When I look over what I wrote, I see that..." Reviews each knowledge type, notes specific gaps ("I need to learn...") and strengths ("I am good with my facts"). Written as flowing narrative prose.',
    ),
});

const validationSchema = z.object({
  valid: z.boolean().describe("Whether the template passes all quality checks"),
  issues: z
    .array(z.string())
    .describe("List of specific issues found, empty if valid"),
});

const GENERATION_SYSTEM = `You are a CSA (Cognitive Structure Analysis) script writer. You generate complete self-assessment scripts for students.

A CSA self-assessment script has three sections:

1. INTRODUCTION — Teaches students how to self-assess by explaining the four knowledge types (facts, strategies, procedures, rationales) in subject-specific terms. Adapts each knowledge type to the given subject. Written as a teacher speaking to a student.

2. MODEL SELF-ASSESSMENT — Demonstrates a student actually self-assessing, walking through each knowledge type. Must include realistic gaps and uncertainties, NOT perfect answers.

3. SELF-REVIEW — Student reflects on their self-assessment, identifying strengths and weaknesses.

CRITICAL RULES:
- All sections must be flowing narrative prose, NEVER bullet points or numbered lists.
- The four knowledge types must be adapted to the specific subject (e.g., for reading: facts = characters/setting, strategies = general plot, procedures = specific events, rationales = author's purpose).
- The model assessment must include genuine knowledge gaps — things the student is unsure about or can't remember.
- Write in first person throughout.
- Use language appropriate for the grade level.

${buildExamplesBlock()}`;

const VALIDATION_SYSTEM = `You are a CSA (Cognitive Structure Analysis) Review Agent. Validate a generated self-assessment script for quality and methodology compliance.

Check for:
1. The introduction explains all four knowledge types (facts, strategies, procedures, rationales) in subject-specific terms.
2. The model assessment covers all four types as narrative prose, not bullet points.
3. The model assessment includes realistic knowledge gaps and uncertainties, not perfect textbook answers.
4. The self-review references specific strengths and weaknesses from the model assessment.
5. Language is appropriate for the stated grade level.
6. The script reads as natural first-person narrative throughout.
7. No bullet points or numbered lists appear in any section.
8. The four knowledge types are adapted to the specific subject, not used generically.`;

async function orchestrateGeneration(
  subject: string,
  topic: string,
  gradeLevel: string,
  modelId: string = "gpt-5-nano",
): Promise<TemplateSections> {
  const { output } = await generateText({
    model: openai(modelId),
    output: Output.object({
      schema: templateSchema,
    }),
    system: GENERATION_SYSTEM,
    prompt: `${baseContext(subject, topic, gradeLevel)}\n\nGenerate the complete self-assessment script now.`,
    providerOptions: {
      openai: { reasoningEffort: 'low' },
    },
  });

  if (!output) throw new Error("Failed to generate template");

  const sections: TemplateSections = {
    introduction: output.introduction,
    model_assessment: output.model_assessment,
    self_review: output.self_review,
  };

  // Fire-and-forget background validation
  validateInBackground(subject, topic, gradeLevel, sections, modelId);

  return sections;
}

function validateInBackground(
  subject: string,
  topic: string,
  gradeLevel: string,
  sections: TemplateSections,
  modelId: string,
) {
  generateText({
    model: openai(modelId),
    output: Output.object({
      schema: validationSchema,
    }),
    system: VALIDATION_SYSTEM,
    prompt: `Subject: ${subject}\nTopic: ${topic}\nGrade Level: ${gradeLevel}\n\nINTRODUCTION:\n${sections.introduction}\n\nMODEL SELF-ASSESSMENT:\n${sections.model_assessment}\n\nSELF-REVIEW:\n${sections.self_review}`,
  }).then(({ output: validation }) => {
    if (validation && !validation.valid) {
      console.warn(`Template validation issues [${subject}/${topic}]:`, validation.issues);
    }
  }).catch((err) => {
    console.error('Background validation failed:', err);
  });
}

const SECTION_ORDER: Array<keyof TemplateSections> = [
  "introduction",
  "model_assessment",
  "self_review",
];

function buildResponse(
  template: typeof templates.$inferSelect,
  sections: (typeof templateSections.$inferSelect)[],
): TemplateResponse {
  const sectionMap: TemplateSections = {
    introduction: "",
    model_assessment: "",
    self_review: "",
  };
  for (const s of sections) {
    sectionMap[s.sectionType as keyof TemplateSections] = s.content;
  }

  return {
    id: template.id,
    subject: template.subject,
    topic: template.topic,
    gradeLevel: template.gradeLevel,
    version: template.version,
    isActive: template.isActive,
    sections: sectionMap,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export async function generateTemplate(
  params: GenerateTemplateRequest,
): Promise<TemplateResponse> {
  const { subject, topic, gradeLevel } = params;

  const sections = await orchestrateGeneration(subject, topic, gradeLevel);

  const existing = await db
    .select({ version: templates.version })
    .from(templates)
    .where(
      and(
        ilike(templates.subject, subject),
        ilike(templates.topic, topic),
        ilike(templates.gradeLevel, gradeLevel),
      ),
    )
    .orderBy(templates.version)
    .limit(1);

  const nextVersion = existing.length > 0 ? existing[0]!.version + 1 : 1;

  const newTemplate: NewTemplate = {
    subject,
    topic,
    gradeLevel,
    version: nextVersion,
  };

  const [inserted] = await db.insert(templates).values(newTemplate).returning();
  if (!inserted) throw new Error("Failed to insert template");

  const sectionRows: NewTemplateSection[] = SECTION_ORDER.map((type, idx) => ({
    templateId: inserted.id,
    sectionType: type,
    content: sections[type],
    orderIndex: idx,
  }));

  const insertedSections = await db
    .insert(templateSections)
    .values(sectionRows)
    .returning();

  return buildResponse(inserted, insertedSections);
}

export async function getTemplateById(
  id: number,
): Promise<TemplateResponse | null> {
  const [template] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);

  if (!template) return null;

  const sections = await db
    .select()
    .from(templateSections)
    .where(eq(templateSections.templateId, id));

  return buildResponse(template, sections);
}

export async function listTemplates(
  filters: ListTemplatesQuery,
): Promise<TemplateResponse[]> {
  const conditions = [];

  if (filters.subject) {
    conditions.push(ilike(templates.subject, `%${filters.subject}%`));
  }
  if (filters.gradeLevel) {
    conditions.push(ilike(templates.gradeLevel, `%${filters.gradeLevel}%`));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(templates.isActive, filters.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allTemplates = await db
    .select()
    .from(templates)
    .where(whereClause)
    .orderBy(templates.createdAt);

  const results: TemplateResponse[] = [];
  for (const t of allTemplates) {
    const sections = await db
      .select()
      .from(templateSections)
      .where(eq(templateSections.templateId, t.id));
    results.push(buildResponse(t, sections));
  }

  return results;
}

export async function updateTemplate(
  id: number,
  updates: UpdateTemplateRequest,
): Promise<TemplateResponse | null> {
  const [existing] = await db
    .select()
    .from(templates)
    .where(eq(templates.id, id))
    .limit(1);

  if (!existing) return null;

  const metaUpdates: Partial<NewTemplate> = {};
  if (updates.subject) metaUpdates.subject = updates.subject;
  if (updates.topic) metaUpdates.topic = updates.topic;
  if (updates.gradeLevel) metaUpdates.gradeLevel = updates.gradeLevel;

  if (Object.keys(metaUpdates).length > 0) {
    await db
      .update(templates)
      .set({ ...metaUpdates, updatedAt: new Date() })
      .where(eq(templates.id, id));
  }

  if (updates.sections) {
    for (const [type, content] of Object.entries(updates.sections)) {
      if (content !== undefined) {
        await db
          .update(templateSections)
          .set({ content })
          .where(
            and(
              eq(templateSections.templateId, id),
              eq(
                templateSections.sectionType,
                type as "introduction" | "model_assessment" | "self_review",
              ),
            ),
          );
      }
    }
  }

  return getTemplateById(id);
}

export async function deactivateTemplate(id: number): Promise<boolean> {
  const result = await db
    .update(templates)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(templates.id, id))
    .returning({ id: templates.id });

  return result.length > 0;
}
