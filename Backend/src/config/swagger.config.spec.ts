import * as fs from 'fs';
import * as path from 'path';
import { createSwaggerConfig, exemptPublicOperations, PUBLIC_PATHS } from './swagger.config';
import type { OpenAPIObject } from '@nestjs/swagger';

describe('createSwaggerConfig', () => {
  // Regression test for issue #104: Swagger UI returned "Unauthorized" because the
  // X-API-Key scheme was defined but never applied — no operation declared a security
  // requirement, so Swagger UI never sent the key. The fix applies it globally.
  it('applies the X-API-Key security scheme as a global requirement', () => {
    const config = createSwaggerConfig();

    expect(config.security).toContainEqual({ 'X-API-Key': [] });
  });
});

describe('exemptPublicOperations', () => {
  // Minimal fixture: one listed public path with two operations, one protected path.
  function fixtureDoc(): OpenAPIObject {
    return {
      openapi: '3.0.0',
      info: { title: 't', version: '0' },
      paths: {
        '/api/health': { get: {}, post: {} },
        '/api/sessions': { get: {} },
      },
      components: {},
    } as unknown as OpenAPIObject;
  }

  it('clears security on every operation of a listed public path', () => {
    const doc = exemptPublicOperations(fixtureDoc());

    expect(doc.paths['/api/health'].get?.security).toEqual([]);
    expect(doc.paths['/api/health'].post?.security).toEqual([]);
  });

  it('leaves non-public paths untouched (they inherit the global requirement)', () => {
    const doc = exemptPublicOperations(fixtureDoc());

    expect(doc.paths['/api/sessions'].get?.security).toBeUndefined();
  });

  it('does not throw when a listed path is absent from the document (stale entry is skipped)', () => {
    const doc = fixtureDoc();
    delete doc.paths['/api/health'];

    expect(() => exemptPublicOperations(doc)).not.toThrow();
  });
});

// PUBLIC_PATHS mirrors the @Public() decorator so the published spec does not falsely advertise a
// public route as requiring an API key. Two tripwires catch drift:
//   (1) the set of files with a real @Public() decorator must match EXPECTED_PUBLIC_CONTROLLERS —
//       add a controller here AND its path(s) to PUBLIC_PATHS when you mark a new route @Public();
//   (2) PUBLIC_PATHS must contain the expected entries (catches a typo or accidental removal).
// MetricsController is @Public() but uses @ApiExcludeEndpoint, so it never appears in the spec and
// is intentionally exempt from PUBLIC_PATHS.
describe('PUBLIC_PATHS drift guard', () => {
  const EXPECTED_PUBLIC_CONTROLLERS = [
    'src/modules/admin/controllers/admin.controller.ts',
    'src/modules/broadcast/broadcast.controller.ts',
    'src/modules/crm/controllers/crm-auth.controller.ts',
    'src/modules/crm/controllers/crm-contacts.controller.ts',
    'src/modules/crm/controllers/crm-custom-fields.controller.ts',
    'src/modules/crm/controllers/crm-flows.controller.ts',
    'src/modules/crm/controllers/crm-media.controller.ts',
    'src/modules/crm/controllers/crm-segments.controller.ts',
    'src/modules/crm/controllers/crm-sessions.controller.ts',
    'src/modules/crm/controllers/crm-tags.controller.ts',
    'src/modules/crm/controllers/crm-templates.controller.ts',
    'src/modules/health/health.controller.ts',
    'src/modules/inbox/inbox.controller.ts',
    'src/modules/infra/infra.controller.ts',
    'src/modules/integration/ingress.controller.ts',
    'src/modules/metrics/metrics.controller.ts',
    'src/modules/otp/controllers/otp-analytics.controller.ts',
    'src/modules/otp/controllers/otp-logs.controller.ts',
    'src/modules/otp/controllers/otp-management.controller.ts',
    'src/modules/otp/controllers/otp-openwa.controller.ts',
    'src/modules/otp/controllers/otp-public.controller.ts',
    'src/modules/template/ai.controller.ts',
  ];

  function listTsFiles(dir: string, out: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) listTsFiles(full, out);
      else if (entry.name.endsWith('.ts')) out.push(full);
    }
    return out;
  }

  it('every controller using @Public() is accounted for in EXPECTED_PUBLIC_CONTROLLERS', () => {
    const srcRoot = path.resolve(__dirname, '..').replace(/\\/g, '/');
    // Match only a line that is exactly `@Public()` — ignores the decorator's doc comment
    // (`@example @Public()`) and test/string occurrences.
    const usingPublic = listTsFiles(srcRoot)
      .filter(f => /^\s*@Public\(\)\s*$/m.test(fs.readFileSync(f, 'utf8')))
      .map(f => f.replace(/^.*\/src\//, 'src/'))
      .sort();

    expect(usingPublic).toEqual([...EXPECTED_PUBLIC_CONTROLLERS].sort());
  });

  it('PUBLIC_PATHS contains the expected @Public route paths', () => {
    expect(PUBLIC_PATHS).toEqual(
      expect.arrayContaining([
        '/api/health',
        '/api/health/live',
        '/api/health/ready',
        '/api/infra/health',
        '/api/ingress/{pluginId}/{instanceId}/{path}',
        '/api/admin/users',
        '/api/admin/users/{id}',
        '/api/admin/blogs',
        '/api/admin/blogs/{id}',
        '/api/admin/topics',
        '/api/admin/topics/{id}',
        '/api/admin/media',
        '/api/admin/media/{id}',
        '/api/admin/seo',
        '/api/admin/seo/{id}',
      ]),
    );
  });
});
