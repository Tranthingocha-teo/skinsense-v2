/**
 * Test-only: what PostgREST answers for `from("app_json_stores")` before migration 0007 is applied.
 * A fake Supabase client returns it so storage-json.ts runs its legacy Storage path.
 */
export function noJsonStoreTable(): unknown {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "eq", "maybeSingle", "upsert", "update"]) builder[method] = () => builder;
  builder.then = (resolve: (value: unknown) => unknown) =>
    resolve({ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.app_json_stores' in the schema cache" } });
  return builder;
}
