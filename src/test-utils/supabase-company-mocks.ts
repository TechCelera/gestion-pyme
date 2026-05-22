import { vi } from 'vitest'

/** Mock `companies` select for operating-currency validation in server action tests. */
export function mockCompaniesTable(country = 'AR') {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { country },
          error: null,
        }),
      }),
    }),
  }
}
