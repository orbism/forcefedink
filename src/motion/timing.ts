/**
 * Shared choreography timing. Lives in a plain module: constants exported from a
 * 'use client' file reach server components as client references, not values.
 *
 * On navigation the outgoing page's slots leave fast via view transitions; the incoming
 * page holds its entrance this long so the old content is clearly gone first.
 */
export const ENTER_DELAY = 190
