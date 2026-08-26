# Calculation rules

All monetary values in the core are non-negative integer cents. Floating-point arithmetic is not used for receipt totals or shares.

## Equal Split

The grand total is subtotal plus tax plus tip. The grand total is divided by the number of people using integer division. Any remainder cents go to the earliest people in display order, one cent at a time.

Percentage tips are calculated from the subtotal and rounded to the nearest cent. Custom tips use the exact entered cent amount.

## Itemized Split

Each item is assigned to one or more people. A shared item is divided evenly among its assignees using the same deterministic remainder rule. The item shares become each person’s pretax weight.

Tax and tip are then allocated proportionally to those weights. If every weight is zero, the amount is allocated evenly so that the result remains conserved and deterministic.

## Invariants

- Every returned amount is a safe integer number of cents.
- Per-person shares always sum to the grand total.
- Duplicate people or item identifiers are rejected.
- Itemized items must have at least one valid participant before calculation.
- Unsafe or malformed persisted drafts are discarded with a user-facing restore error.
