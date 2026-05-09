# Pet Character State and Effect Scenarios

This document defines how the Pet page combines character state, animation effect, and thought bubble behavior. The Pet Character Lab is the visual playground; the Pet page should use the same names so behavior stays easy to discuss and test.

## State and Effect Names

| Type | Name | Meaning |
| --- | --- | --- |
| State | `Stable` | Normal standing character. Used for healthy/default moments and temporary positive feedback. |
| State | `Needs care` | Soft worried state for warning or danger status levels. |
| State | `Critical` | Strong urgent state for critical status. |
| State | `Excellent` | Happy state for excellent status. |
| State | `Sleeping` | Sleep-only state. No other condition should use this state. |
| Effect | `Idle` | No extra action effect. The character should stay grounded. |
| Effect | `Wobble` | Urgent unstable movement. |
| Effect | `Hop` | Positive bounce feedback. |
| Effect | `Wave` | Gentle attention or greeting motion. |
| Effect | `Squash` | Hungry or meal-time anticipation motion. |

## Priority Rules

Higher rows win over lower rows when multiple conditions are true.

| Priority | Condition | Character state | Effect | Thought bubble |
| --- | --- | --- | --- | --- |
| 1 | `isSleeping === true` | `Sleeping` | `Idle` | Hidden |
| 2 | `isAwakening === true` | `Stable` | `Idle` | Hidden |
| 3 | Just used a food or care item | `Stable` | `Hop` | Current bubble behavior can continue |
| 4 | Any pet stat is critical | `Critical` | `Wobble` | Critical stat message |
| 5 | Bedtime warning | Current stat state | `Wave` | Bedtime message with dynamic current time |
| 6 | Meal-time hunger warning | Current stat state | `Squash` | Meal-time message with dynamic current time |
| 7 | Excellent status | `Excellent` | `Hop` | Excellent stat message |
| 8 | Normal/stable thought bubble is visible | `Stable` | `Wave` | Current stable thought bubble |
| 9 | User just entered the Pet page | `Stable` | `Wave` | Initial/current thought bubble timing |
| 10 | Default | Current stat state | `Idle` | Regular timed message |

## Item Use Timing

Food and care items share the same presentation rule:

- The character immediately switches to `Stable + Hop`.
- The temporary state lasts for the same duration as the item visual effect.
- When the item effect ends, the character returns to the current real state and effect from the priority table.
- This applies to both food and care, including regular care items.
- If a care item starts sleep, `Sleeping + Idle` wins because sleeping has the highest priority.

## Bubble Timing Boundaries

The thought bubble scheduler keeps a minimum wait of `5s`. Maximum wait varies by status level and never exceeds `15s`.

| Level | Wait range |
| --- | --- |
| `critical` | `5s - 7s` |
| `danger` | `5s - 9s` |
| `warning` | `5s - 11s` |
| `normal` | `5s - 13s` |
| `excellent` | `5s - 15s` |

Sleeping and awakening should suppress thought bubbles. All biological clock messages that include time must use the current runtime time, not hard-coded text.
