---
name: code-review
description: Review code changes for correctness, style, security, and maintainability. Use when evaluating pull requests or code submissions.
---

# Code Review

## When to Use
When reviewing pull requests, merge requests, or any code changes before they are merged.

## Review Checklist

### Correctness
- Does the code do what it claims to do?
- Are edge cases handled?
- Are error conditions properly managed?
- Does it break any existing functionality?

### Security
- No hardcoded secrets or credentials
- Input validation present where needed
- No SQL injection, XSS, or other OWASP top 10 vulnerabilities
- Proper authentication and authorization checks

### Style & Readability
- Follows project coding conventions
- Variable and function names are descriptive
- Complex logic has comments explaining "why" (not "what")
- No unnecessary complexity or over-engineering

### Performance
- No N+1 query patterns
- Appropriate use of caching
- No unnecessary memory allocations in hot paths
- Database queries are indexed

### Testing
- Are there tests for the new/changed functionality?
- Do tests cover happy path and error cases?
- Are tests maintainable and readable?

## Review Process
1. Read the PR description and linked issues first
2. Look at the file list to understand scope
3. Review changes file by file, starting with the most critical
4. Leave specific, actionable comments
5. Approve, request changes, or comment with overall assessment

## Comment Guidelines
- Be specific: "This could throw a NullPointerException on line 42" not "This might break"
- Be constructive: Suggest alternatives, don't just point out problems
- Distinguish between blockers and suggestions
- Praise good code too
