/**
 * API helper for test setup and teardown.
 * Uses direct backend API calls to seed/verify data deterministically,
 * avoiding brittle UI-only setup.
 */

import { APIRequestContext, expect } from '@playwright/test';
import { USERS, RoleName } from '../data/test-data';

export interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
    role?: string;
    groups?: string[];
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

/**
 * Perform API login and return tokens + user.
 * Throws if login fails.
 */
export async function apiLogin(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<LoginResponse> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const response = await request.post(`${apiBase}/api/auth/login/`, {
    data: { identifier: username, password },
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(
      `API login failed for '${username}': ${response.status()} ${body}`,
    );
  }

  const data = await response.json();
  return data as LoginResponse;
}

/**
 * Get API access token for a given role.
 */
export async function getAccessToken(
  request: APIRequestContext,
  role: RoleName,
): Promise<string> {
  const user = USERS[role];
  const { tokens } = await apiLogin(request, user.username, user.password);
  return tokens.access;
}

/**
 * Build Authorization header for a given role.
 */
export async function authHeader(
  request: APIRequestContext,
  role: RoleName,
): Promise<{ Authorization: string }> {
  const token = await getAccessToken(request, role);
  return { Authorization: `Bearer ${token}` };
}

/**
 * Ensure the ExamCell user exists (not created by seed_demo by default).
 * Idempotent - safe to call multiple times.
 */
export async function ensureExamCellUser(
  request: APIRequestContext,
): Promise<void> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const adminHeaders = await authHeader(request, 'admin');

  // Check if examcell user already exists
  const checkResp = await request.get(`${apiBase}/api/admin/users/?q=examcell`, {
    headers: adminHeaders,
  });

  if (checkResp.ok()) {
    const data = await checkResp.json();
    const results = data.results ?? data;
    if (Array.isArray(results) && results.some((u: { username: string }) => u.username === 'examcell')) {
      return; // Already exists
    }
  }

  // Create the user via admin API
  const createResp = await request.post(`${apiBase}/api/admin/users/`, {
    headers: { ...adminHeaders, 'Content-Type': 'application/json' },
    data: {
      username: USERS.examcell.username,
      email: USERS.examcell.email,
      first_name: 'Exam',
      last_name: 'Cell',
      password: USERS.examcell.password,
      is_active: true,
      role: 'ExamCell',
    },
  });

  if (!createResp.ok() && createResp.status() !== 400) {
    // 400 might mean user already exists with different structure
    console.warn(
      `Warning: Could not create ExamCell user via API (${createResp.status()}). ` +
        'The user may need to be created manually via: ' +
        'python manage.py shell -c "from django.contrib.auth import get_user_model; ...',
    );
  }
}

/**
 * Fetch a student record by reg_no pattern for use in tests.
 * Returns the first matching student or null.
 */
export async function findStudent(
  request: APIRequestContext,
  token: string,
  searchTerm: string,
): Promise<Record<string, unknown> | null> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const resp = await request.get(
    `${apiBase}/api/students/?search=${encodeURIComponent(searchTerm)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!resp.ok()) return null;
  const data = await resp.json();
  const results = data.results ?? data;
  return Array.isArray(results) && results.length > 0 ? results[0] : null;
}

/**
 * Fetch sections accessible to the current user.
 */
export async function fetchSections(
  request: APIRequestContext,
  token: string,
): Promise<Record<string, unknown>[]> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const resp = await request.get(`${apiBase}/api/sections/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok()) return [];
  const data = await resp.json();
  return data.results ?? data ?? [];
}

/**
 * Fetch exams/result headers to find draft/published results for workflow tests.
 */
export async function fetchResults(
  request: APIRequestContext,
  token: string,
  status?: string,
): Promise<Record<string, unknown>[]> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const url = status
    ? `${apiBase}/api/results/?status=${status}`
    : `${apiBase}/api/results/`;
  const resp = await request.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok()) return [];
  const data = await resp.json();
  return data.results ?? data ?? [];
}

/**
 * Check health endpoint returns 200.
 */
export async function checkHealth(request: APIRequestContext): Promise<boolean> {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8010';
  const resp = await request.get(`${apiBase}/api/health/`);
  return resp.ok();
}
