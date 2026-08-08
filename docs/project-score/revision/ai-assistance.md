# AI Assistance Revision

Use honest, specific answers. Do not invent percentages.

## How Much AI Did You Use?

Short answer: I used AI as an assistant for implementation, documentation, review, and preparation, but I am responsible for understanding and verifying the project.

Deeper answer: AI helped accelerate code and docs, but the architecture and product must still be explained through repository evidence. I verify AI output by reading the code, tracing workflows, running or planning tests, checking docs against implementation, and correcting unsupported claims.

Evidence: `docs/ai/AI_CONTEXT.md`, workflow atlas, Project Score evidence pack.

## Did Codex Write This Code?

Short answer: Some work may have been AI-assisted, but the important point is whether I can explain, verify, debug, and maintain it.

Deeper answer: I should distinguish product decisions, schema decisions, workflow design, implementation assistance, review, tests, and documentation. I should never claim manual authorship where AI assistance was used, and I should never present code I cannot explain.

## Which Parts Did You Personally Design?

Answer using real ownership only. Strong areas to discuss if true for the owner:

- product problem and scope
- clinic workflow boundaries
- appointment/queue/risk priorities
- review of generated code
- decisions to keep risk assistance deterministic and human-controlled
- validation of docs against source

Do not invent personal contribution percentages.

## Can You Explain AI-Generated Code?

Short answer: Yes, and if I cannot explain a section, I should not claim it as assessment-ready.

Procedure:

1. Open the route/component/service.
2. Explain the input.
3. Explain the validation/auth checks.
4. Explain the business rule.
5. Explain the database write/read.
6. Explain error cases and limitations.

## How Do You Prevent Hallucinated Documentation?

Answer: I check every claim against implementation files, tests, schema, migrations, deployment config, or verified docs. If evidence is missing, I mark it as a gap instead of turning it into a claim.

Do not say:

- "AI did everything."
- "AI did nothing."
- "I wrote 100% myself" unless that is true and intended.
- "The docs prove it works" without code/runtime evidence.
