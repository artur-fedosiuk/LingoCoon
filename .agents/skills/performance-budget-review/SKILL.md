---
name: performance-budget-review
description: Review a LingoCoon change or flow against explicit web, server, database, and provider performance budgets; do not use when no performance-sensitive behavior is in scope.
---

# Performance Budget Review

## Procedure

1. Define user journey, device/network assumptions, and measurable budgets before judging performance.
2. Inspect Server/Client Component boundaries, bundle additions, images/fonts, rendering, caching, fetch waterfalls, database queries, provider calls, and timeouts.
3. Run `npm run build` and record available route/build evidence; do not invent bundle or Core Web Vital values.
4. Measure in a local or authorized preview browser when tools are available; separate lab from field data.
5. Check p50/p95 latency, failure fallback, concurrency, memory, query/index behavior, and zero-budget provider constraints as relevant.

Return measurements, static risks, budgets, regressions, recommendation, and retest method. The repository has no automated performance budget today; proposing tooling or CI enforcement requires approval.
