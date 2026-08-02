# Project Score Concept Evidence Files

Detailed concept files may be added here later when a concept needs deeper evidence than the tracker can comfortably hold.

Do not create empty proof files. Add a concept file only when there is concrete implementation evidence or a clear missing-evidence record.

## Full Evidence Template

```markdown
# <Official Concept Name>

## Official Information

- ID:
- Bucket:
- Mandatory:
- Score:

## Status

- Implementation status:
- Evidence classification:
- Explanation status:
- Simulation status:
- Confidence:
- Last reviewed:

## Where It Appears

- Feature:
- Workflow:
- Frontend route:
- Backend route:
- Database model:
- Deployment or test area:

## Exact Evidence

- File:
- Function or component:
- Route:
- Service:
- Repository method:
- Schema:
- Test:
- Configuration:
- Related issue or pull request:

## What the Concept Means

## What Problem It Solves in Pravaah

## How the Implementation Works

## Why This Approach Was Chosen

## Failure Cases

## What Happens Without It

## Security Considerations

## Trade-Offs

## Alternative Approaches

## Scaling Considerations

## Current Limitations

## Likely Viva Questions

## Screen-Share Navigation

## Small Change or Debugging Exercise

## Next Preparation Action
```

## Missing-Evidence Template

Use this shorter record when Pravaah does not demonstrate a concept:

```markdown
# <Official Concept Name>

## Official Information

- ID:
- Bucket:
- Mandatory:
- Score:

## Status

- Implementation status:
- Evidence classification:
- Last reviewed:

## Why Pravaah Does Not Demonstrate It

## Correct Preparation Path

## What Not To Claim

## Next Action
```

## Rules

- Keep official concept names unchanged.
- Link to source files, tests, routes, models, or deployment config.
- Do not use documentation alone as proof.
- Do not call deterministic no-show rules LLM evidence.
- Do not create Mongo, LLM, Redis, WebSocket, Docker, payment, or SSR evidence unless real implementation exists.
- Do not mark `Interview ready` without recorded simulation evidence.
