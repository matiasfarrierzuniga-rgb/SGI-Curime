import './helpers/configure-auth-env';
// Supertest exposes JSON response bodies as `any` in its published types.
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuditModule } from '../src/audit/audit.module';
import { AuthModule } from '../src/auth';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VolunteeringModule } from '../src/volunteering/volunteering.module';

describe('Volunteering HTTP with isolated PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwt: JwtService;

  beforeAll(async () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toBe(process.env.TEST_DATABASE_URL);
    expect(process.env.DATABASE_URL).toContain('sgi_volunteer_test');
    const module = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, AuditModule, VolunteeringModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('publishes, accepts guest applications, reviews them and enforces capacity and authorization', async () => {
    const marker = `vol-http-${Date.now()}`;
    const actualPermissions = await Promise.all(
      [
        'vol.opportunities.read',
        'vol.opportunities.create',
        'vol.opportunities.update',
      ].map((code) =>
        prisma.permission.upsert({
          where: { code },
          update: {},
          create: { code, name: code },
        }),
      ),
    );
    const role = await prisma.role.upsert({
      where: { name: 'Administrador' },
      update: {},
      create: { name: 'Administrador' },
    });
    await prisma.rolePermission.createMany({
      data: actualPermissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
    const admin = await prisma.user.create({
      data: {
        roleId: role.id,
        fullName: 'Administrador de prueba',
        identification: `${marker}-admin`,
        email: `${marker}@example.test`,
        status: 'ACTIVE',
      },
    });
    const token = `Bearer ${await jwt.signAsync({ sub: admin.id, email: admin.email, role: role.name })}`;
    const erp = (method: 'post' | 'patch' | 'get', path: string) =>
      request(app.getHttpServer())[method](path).set('Authorization', token);

    await request(app.getHttpServer())
      .post('/volunteering/opportunities')
      .send({ title: 'No autorizado' })
      .expect(401);
    const created = await erp('post', '/volunteering/opportunities')
      .send({ title: 'Jornada comunitaria', capacity: 1 })
      .expect(201);
    const id: number = created.body.id;
    expect(created.body.status).toBe('DRAFT');
    await request(app.getHttpServer())
      .get('/public/volunteering/opportunities')
      .expect(200)
      .then((res) => {
        expect(
          res.body.data.some((item: { id: number }) => item.id === id),
        ).toBe(false);
      });
    await request(app.getHttpServer())
      .get(`/public/volunteering/opportunities/${id}`)
      .expect(404);
    await erp('patch', `/volunteering/opportunities/${id}/publish`).expect(400);
    const startAt = new Date(Date.now() + 7 * 86400000);
    const endAt = new Date(startAt.getTime() + 7200000);
    await erp('post', `/volunteering/opportunities/${id}/sessions`)
      .send({ title: 'Primera jornada', startAt, endAt })
      .expect(201);
    await erp('patch', `/volunteering/opportunities/${id}/publish`).expect(200);
    await request(app.getHttpServer())
      .get('/public/volunteering/opportunities?search=Jornada&page=1&limit=1')
      .expect(200)
      .then((res) => {
        expect(res.body.total).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].id).toBe(id);
        expect(res.body.data[0].createdByUserId).toBeUndefined();
      });
    await request(app.getHttpServer())
      .get(`/public/volunteering/opportunities/${id}`)
      .expect(200)
      .then((res) => {
        expect(res.body.acceptingApplications).toBe(true);
      });

    const guest = {
      fullName: 'Persona Voluntaria',
      email: `${marker}-guest@example.test`,
    };
    const personCountBeforeApplication = await prisma.person.count();
    const userCountBeforeApplication = await prisma.user.count();
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${id}/applications`)
      .send({ fullName: 'Persona Voluntaria' })
      .expect(400);
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${id}/applications`)
      .send(guest)
      .expect(201, { received: true });
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${id}/applications`)
      .send(guest)
      .expect(409);
    await request(app.getHttpServer())
      .get(`/volunteering/opportunities/${id}/applications`)
      .expect(401);
    const applications = await erp(
      'get',
      `/volunteering/opportunities/${id}/applications`,
    ).expect(200);
    expect(applications.body).toHaveLength(1);
    expect(applications.body[0].status).toBe('PENDING');
    expect(applications.body[0].personId).toBeNull();
    expect(await prisma.person.count()).toBe(personCountBeforeApplication);
    const approved = await erp(
      'patch',
      `/volunteering/applications/${applications.body[0].id}/approve`,
    )
      .send({ createPerson: true })
      .expect(200);
    expect(approved.body.status).toBe('APPROVED');
    expect(approved.body.personId).toEqual(expect.any(Number));
    expect(await prisma.user.count()).toBe(userCountBeforeApplication);
    expect(
      await prisma.volunteerParticipation.count({
        where: { opportunityId: id, status: 'CONFIRMED' },
      }),
    ).toBe(1);
    await erp(
      'patch',
      `/volunteering/applications/${applications.body[0].id}/approve`,
    )
      .send({ createPerson: true })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${id}/applications`)
      .send({ fullName: 'Otra Persona', email: `${marker}-other@example.test` })
      .expect(409);
    await request(app.getHttpServer())
      .get(`/public/volunteering/opportunities/${id}`)
      .expect(200)
      .then((res) => {
        expect(res.body.acceptingApplications).toBe(false);
      });

    const second = await erp('post', '/volunteering/opportunities')
      .send({ title: 'Otra jornada', capacity: 2 })
      .expect(201);
    await erp('post', `/volunteering/opportunities/${second.body.id}/sessions`)
      .send({ startAt, endAt })
      .expect(201);
    await erp(
      'patch',
      `/volunteering/opportunities/${second.body.id}/publish`,
    ).expect(200);
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${second.body.id}/applications`)
      .send({
        fullName: 'Persona Rechazada',
        phoneCountryCode: '+506',
        phoneNationalNumber: '88887777',
      })
      .expect(201);
    const secondApplications = await erp(
      'get',
      `/volunteering/opportunities/${second.body.id}/applications`,
    ).expect(200);
    await erp(
      'patch',
      `/volunteering/applications/${secondApplications.body[0].id}/reject`,
    )
      .send({ rejectionReason: 'No hay disponibilidad' })
      .expect(200)
      .then((res) => {
        expect(res.body.status).toBe('REJECTED');
      });
    await erp(
      'patch',
      `/volunteering/applications/${secondApplications.body[0].id}/reject`,
    )
      .send({ rejectionReason: 'Duplicada' })
      .expect(409);
    const existingPerson = await prisma.person.create({
      data: { legacyFullName: 'Persona existente de prueba' },
    });
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${second.body.id}/applications`)
      .set('Authorization', token)
      .send({
        fullName: 'Persona con sesión',
        email: `${marker}-signed@example.test`,
      })
      .expect(201, { received: true });
    const pendingForExisting = await erp(
      'get',
      `/volunteering/opportunities/${second.body.id}/applications`,
    ).expect(200);
    await erp(
      'patch',
      `/volunteering/applications/${pendingForExisting.body[0].id}/approve`,
    )
      .send({ personId: existingPerson.id })
      .expect(200)
      .then((res) => {
        expect(res.body.personId).toBe(existingPerson.id);
      });
    await erp(
      'patch',
      `/volunteering/opportunities/${second.body.id}/close`,
    ).expect(200);
    await request(app.getHttpServer())
      .post(`/public/volunteering/opportunities/${second.body.id}/applications`)
      .send({ fullName: 'Persona Nueva', email: `${marker}-new@example.test` })
      .expect(409);

    const concurrent = await erp('post', '/volunteering/opportunities')
      .send({ title: 'Convocatoria concurrente', capacity: 1 })
      .expect(201);
    await erp(
      'post',
      `/volunteering/opportunities/${concurrent.body.id}/sessions`,
    )
      .send({ startAt, endAt })
      .expect(201);
    await erp(
      'patch',
      `/volunteering/opportunities/${concurrent.body.id}/publish`,
    ).expect(200);
    const concurrentPath = `/public/volunteering/opportunities/${concurrent.body.id}/applications`;
    const duplicateResults = await Promise.all([
      request(app.getHttpServer())
        .post(concurrentPath)
        .send({
          fullName: 'Persona Duplicada',
          email: `${marker}-duplicate@example.test`,
        }),
      request(app.getHttpServer())
        .post(concurrentPath)
        .send({
          fullName: 'Persona Duplicada',
          email: `${marker}-duplicate@example.test`,
        }),
    ]);
    expect(duplicateResults.map((result) => result.status).sort()).toEqual([
      201, 409,
    ]);
    await request(app.getHttpServer())
      .post(concurrentPath)
      .send({
        fullName: 'Persona Alterna',
        email: `${marker}-alternate@example.test`,
      })
      .expect(201);
    const pendingConcurrent = await erp(
      'get',
      `/volunteering/opportunities/${concurrent.body.id}/applications`,
    ).expect(200);
    const reviewResults = await Promise.all(
      pendingConcurrent.body.map((application: { id: number }) =>
        erp(
          'patch',
          `/volunteering/applications/${application.id}/approve`,
        ).send({ createPerson: true }),
      ),
    );
    expect(reviewResults.map((result) => result.status).sort()).toEqual([
      200, 409,
    ]);
    expect(
      await prisma.volunteerParticipation.count({
        where: { opportunityId: concurrent.body.id, status: 'CONFIRMED' },
      }),
    ).toBe(1);
  });
});
