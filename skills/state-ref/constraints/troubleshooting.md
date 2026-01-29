# Troubleshooting (Fast Checks)

- Is the value accessed via `.value`? (Not `.value` = proxy, not actual data)
- Are dependencies tracked inside the callback's ref parameter?
- Are you using an external ref that's not bound to the subscription?
- Did you return `AbortController.signal` for cleanup?
- In manual-sync mode, are you modifying via `updateRef` and calling `sync()`?
- For primitives, are you accessing `ref.value` directly (not `ref.someProperty.value`)?
- Are you using `as const` with `combineWatch` array for proper type inference?
- Did framework connector return the right type? (React: hook, Vue: reactive, etc.)
- Is the store properly exported and imported across modules?
- Check `node_modules/state-ref/dist/index.d.ts` for type signatures.

If subscription doesn't trigger:
1. Verify `.value` is read inside the callback
2. Verify the modified property was read (tracked) in the callback
3. Verify you're using the callback's ref, not an external unbound ref
4. Verify the subscription wasn't aborted

If type errors occur:
1. Add explicit generic: `createStore<MyType>(...)`
2. Use `as const` with `combineWatch`
3. Check StateRefStore<T> usage in custom code
