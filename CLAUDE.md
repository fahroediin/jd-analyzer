Default to using Bun instead of Node.js.

- Use bun <file> instead of node <file> or ts-node <file>
- Use bun test instead of jest or vitest
- Use bun build <file.html|file.ts|file.css> instead of webpack or esbuild
- Use bun install instead of npm install or yarn install or pnpm install
- Use bun run <script> instead of npm run <script> or yarn run <script> or pnpm run <script>
- Bun automatically loads .env, so don't use dotenv.

## APIs

- Bun.serve() supports WebSockets, HTTPS, and routes. Don't use express.
- bun:sqlite for SQLite. Don't use better-sqlite3.
- Bun.redis for Redis. Don't use ioredis.
- Bun.sql for Postgres. Don't use pg or postgres.js.
- WebSocket is built-in. Don't use ws.
- Prefer Bun.file over node:fs's readFile/writeFile
- Bun.$ls instead of execa.

## Testing

Use bun test to run tests.

ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});


## Tone and Behavior

- Criticism is welcome.
  - Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
  - Please tell me if there is a better approach than the one I am taking.
  - Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be concise.
  - Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
  - Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
  - Occasional pleasantries are fine.
- Point out potential issues with error handling, edge cases, and performance
- Identify conflicts with existing patterns in the codebase
- Flag any security concerns or data validation gaps

## Before Writing Code

- Examine 3-5 similar files in the codebase first
- Identify the testing pattern used
- Note the error handling approach already in use
- Check for existing utility functions before creating new ones

## After Writing Code

- Run the type check with "bun run type-check"
- Fix the type error, it must be type-safe
- Commit if it necessary

## Code Style

1. Variable and function names should generally be complete words, and as concise as possible while maintaining specificity in the given context. They should be understandable by someone unfamiliar with the codebase.

Good: calculateTotalPrice, userAuthToken, isEmailValid (depends on your var style)
Bad: calc, tok, flag1

2. Only add code comments in the following scenarios:

- The purpose of a block of code is not obvious (possibly because it is long or the logic is convoluted).
- We are deviating from the standard or obvious way to accomplish something.
- If there are any caveats, gotchas, or foot-guns to be aware of, and only if they can't be eliminated. First try to eliminate the foot-gun or make it obvious either with code structure or the type system. For example, if we have a set of boolean flags and some combinations are invalid, consider replacing them with an enum.

3. Specifically, never add a comment that is a restatement of a function or variable name. ‘’’
4. The code should follow the principle: "Tell a story with your code"
5. Each function is a chapter, and the main function tells the complete story in just a few lines!
6. Sacrifice grammar for the sake of concision

## Language Standards

- *All English*: Code, comments, documentation, commits, configs, errors, tests

## Git Commit Convention

- *Format*: <type>(<scope>): <subject>
- *Types*: feat, fix, docs, style, refactor, test, chore, perf
- *Subject Rules*:
  - Max 50 characters
  - Imperative mood ("add" not "added")
  - No period at the end
- *Commit Structure*:
  - Simple changes: One-line commit only
  - Complex changes: Add body (72-char lines) explaining what/why
  - Reference issues in footer
- *Best Practices*:
  - Keep commits atomic (one logical change)
  - Make them self-explanatory
  - Split different concerns into separate commits

# ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION : no "//This is simplified shit for now, complete implementation would blablabla", nor "Let's rewrite simplier code" (when codebase is already there to be used).
- NO CODE DUPLICATION : check headers to reuse functions and constants !! No function then function_improved then function_improved_improved shit. = Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE : either use or delete from codebase completely
- NO CHEATER TESTS : test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO MAGIC NUMBERS/STRINGS - Use named constants. Do not hardcode "200", "404", "/api/users" instead of STATUS_OK, NOT_FOUND, ENDPOINTS.USERS
- NO GENERIC ERROR HANDLING - Dont write lazy catch(err) { console.log(err) } instead of specific error types and proper error propagation
- NO INCONSISTENT NAMING - read your existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO INCONSISTENT APIS - Don't create functions with different parameter orders (getUser(id, options) vs updateUser(options, id)) or return different data structures for similar operations
- NO CALLBACK HELL - Dont't nest promises/async operations instead of using proper async/await patterns or breaking them into smaller functions
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles
- READ THE DAMN CODEBASE FIRST - actually examine existing patterns, utilities, and architecture before writing new code