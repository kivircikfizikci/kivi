# Contributing to KIVI

## User-facing documentation is part of the feature

Any change that adds or removes a user-facing tool or command, changes a workflow or navigation, or fixes visible behavior must also:

1. update the English Help content;
2. update the Turkish Help content;
3. update Release Notes;
4. update command and shortcut documentation when relevant; and
5. keep Help routes and English/Turkish parity tests passing.

A user-facing feature is not complete until Help describes the shipped behavior in both languages. Command names and aliases must continue to come from `src/commands/commandRegistry.ts`; do not create a separate manual command list.
