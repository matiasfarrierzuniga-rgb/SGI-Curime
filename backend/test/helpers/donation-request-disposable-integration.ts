import { randomUUID } from 'node:crypto';
import { ConflictException } from '@nestjs/common';
import { DonationRequestKind, DonationRequestModality, DonationRequestPaymentPreference } from '../../generated/prisma/client';
import { AuditService } from '../../src/audit/audit.service';
import { DonationRequestsService } from '../../src/donation-requests/donation-requests.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { processEnvironmentForTest } from './disposable-postgres-guard.mjs';

Object.assign(process.env, processEnvironmentForTest(process.env));
const prisma = new PrismaService();
const service = new DonationRequestsService(prisma, new AuditService(prisma));

async function main() {
  await prisma.$connect();
  try {
    const beforeDonations = await prisma.donation.count();
    const beforeMovements = await prisma.financialMovement.count();
    const beforeInventory = await prisma.inventoryMovement.count();
    const key = randomUUID();
    const input = {
      donorName: 'Prueba aislada', email: 'test@example.org',
      kind: DonationRequestKind.MONETARY, modality: DonationRequestModality.DIGITAL,
      paymentPreference: DonationRequestPaymentPreference.SINPE,
      approximateAmount: '1000.00', anonymousPublic: true,
    };
    const created = await service.create(input, key);
    if (created.status !== 'PENDING') throw new Error('request-not-pending');
    const replay = await service.create(input, key);
    if (replay.id !== created.id) throw new Error('idempotent-replay-failed');
    const concurrentKey = randomUUID();
    const concurrent = await Promise.all([service.create(input, concurrentKey), service.create(input, concurrentKey)]);
    if (concurrent[0].id !== concurrent[1].id) throw new Error('concurrent-idempotency-failed');
    const goods = await service.create({
      donorName: 'Prueba bienes', phone: '88888888', kind: DonationRequestKind.IN_KIND,
      modality: DonationRequestModality.COORDINATED, goodsDescription: 'Dos sillas',
      anonymousPublic: false,
    }, randomUUID());
    if (goods.status !== 'PENDING') throw new Error('goods-request-not-pending');
    try {
      await service.create({ ...input, approximateAmount: '2000.00' }, key);
      throw new Error('changed-payload-was-accepted');
    } catch (error) {
      if (!(error instanceof ConflictException)) throw error;
    }
    const request = await prisma.donationRequest.findUniqueOrThrow({ where: { id: created.id } });
    if (!request.anonymousPublic || request.email !== input.email) throw new Error('request-data-mismatch');
    if (await prisma.donation.count() !== beforeDonations) throw new Error('donation-created-from-request');
    if (await prisma.financialMovement.count() !== beforeMovements) throw new Error('movement-created-from-request');
    if (await prisma.inventoryMovement.count() !== beforeInventory) throw new Error('inventory-entry-created-from-request');
    console.log('donation request disposable integration: money and goods pending, replay, concurrency, conflict, no ledger or inventory entry passed');
  } finally { await prisma.$disconnect(); }
}

void main();
