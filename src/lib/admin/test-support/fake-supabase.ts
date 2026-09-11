/**
 * In-memory stand-in for the Supabase client, used by the admin test files.
 *
 * Covers only the query shapes src/lib/admin actually uses: select / eq / filter
 * / limit / maybeSingle for reads, insert and update for writes. The builder is
 * thenable so `await` resolves it, same as the real client.
 *
 * Wire it in before importing the module under test:
 *   mock.module('@/lib/bot/db/supabase', {
 *     namedExports: { supabase: createFakeSupabase(() => store) },
 *   });
 */
export type Row = Record<string, unknown>;
export type Store = Record<string, Row[]>;

export function createFakeSupabase(getStore: () => Store) {
  return {
    from(table: string) {
      const predicates: Array<(row: Row) => boolean> = [];
      let limitTo: number | null = null;
      let wantsSingle = false;
      let toInsert: Row | null = null;
      let toUpdate: Row | null = null;

      const rows = (): Row[] => (getStore()[table] ??= []);

      const run = (): { data: unknown; error: null } => {
        const matched = rows().filter((row) => predicates.every((p) => p(row)));

        if (toInsert) {
          const created = { id: `${table}-${rows().length + 1}`, ...toInsert };
          rows().push(created);
          return { data: [created], error: null };
        }

        if (toUpdate) {
          for (const row of matched) Object.assign(row, toUpdate);
          return { data: matched, error: null };
        }

        if (wantsSingle) return { data: matched[0] ?? null, error: null };
        return { data: limitTo === null ? matched : matched.slice(0, limitTo), error: null };
      };

      const builder = {
        select: () => builder,
        eq(column: string, value: unknown) {
          predicates.push((row) => row[column] === value);
          return builder;
        },
        filter(expression: string, operator: string, value: unknown) {
          const jsonPath = /^metadata->>(.+)$/.exec(expression);
          if (!jsonPath || operator !== 'eq') {
            throw new Error(`fake supabase: unsupported filter ${expression} ${operator}`);
          }
          const key = jsonPath[1];
          predicates.push((row) => (row['metadata'] as Row | null)?.[key] === value);
          return builder;
        },
        limit(count: number) {
          limitTo = count;
          return builder;
        },
        maybeSingle() {
          wantsSingle = true;
          return builder;
        },
        insert(row: Row) {
          toInsert = row;
          return builder;
        },
        update(row: Row) {
          toUpdate = row;
          return builder;
        },
        then(resolve: (value: { data: unknown; error: null }) => unknown) {
          return Promise.resolve(run()).then(resolve);
        },
      };

      return builder;
    },
  };
}
