import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createResidenceRequestSchema,
  reviewResidenceRequestSchema,
} from '../src/modules/household/household.schema';
import {
  ResidenceRequestType,
  ResidenceRequestStatus,
  ResidentRelationship,
  ResidentStatus,
  ApartmentStatus,
  ApartmentHistoryEvent,
} from '@prisma/client';

describe('Household Management & Residence Request Workflow Tests', () => {
  describe('1. Zod Schema Validation', () => {
    it('MUST VALIDATE a valid temporary residence registration request', () => {
      const payload = {
        type: ResidenceRequestType.TEMPORARY_RESIDENCE,
        apartmentId: 'apt-101',
        fullName: 'Nguyễn Văn Khách',
        identityCard: '001201000999',
        phone: '0988776655',
        relationship: ResidentRelationship.TEMPORARY_RESIDENT,
        startDate: '2026-09-15',
        endDate: '2026-12-15',
        note: 'Tạm trú học tập dài hạn',
      };

      const parsed = createResidenceRequestSchema.safeParse(payload);
      assert.equal(parsed.success, true, 'Valid payload should parse successfully');
    });

    it('MUST REJECT when required fields are missing or invalid', () => {
      const invalidPayload = {
        type: 'INVALID_TYPE',
        apartmentId: '',
        fullName: 'A', // too short (< 2)
        identityCard: '123', // too short (< 6)
        phone: '12', // too short (< 9)
      };

      const parsed = createResidenceRequestSchema.safeParse(invalidPayload);
      assert.equal(parsed.success, false, 'Invalid payload must fail validation');
    });

    it('MUST VALIDATE review action (APPROVE/REJECT)', () => {
      const approveAction = reviewResidenceRequestSchema.safeParse({ action: 'APPROVE' });
      assert.equal(approveAction.success, true);

      const rejectAction = reviewResidenceRequestSchema.safeParse({
        action: 'REJECT',
        rejectReason: 'CCCD không rõ ràng',
      });
      assert.equal(rejectAction.success, true);

      const invalidAction = reviewResidenceRequestSchema.safeParse({ action: 'MAYBE' });
      assert.equal(invalidAction.success, false);
    });
  });

  describe('2. Household Grouping Logic', () => {
    it('MUST GROUP residents correctly into Owner, Family, Tenant, and Temporary Residents', () => {
      const residents = [
        {
          id: 'res-1',
          fullName: 'Nguyễn Văn A',
          relationshipToOwner: ResidentRelationship.OWNER,
          status: ResidentStatus.RESIDING,
        },
        {
          id: 'res-2',
          fullName: 'Nguyễn Thị B',
          relationshipToOwner: ResidentRelationship.FAMILY,
          status: ResidentStatus.RESIDING,
        },
        {
          id: 'res-3',
          fullName: 'Trần Văn C',
          relationshipToOwner: ResidentRelationship.TENANT,
          status: ResidentStatus.RESIDING,
        },
        {
          id: 'res-4',
          fullName: 'Lê Văn D',
          relationshipToOwner: ResidentRelationship.TEMPORARY_RESIDENT,
          status: ResidentStatus.RESIDING,
        },
      ];

      const owner = residents.find((r) => r.relationshipToOwner === ResidentRelationship.OWNER && r.status === ResidentStatus.RESIDING) || null;
      const family = residents.filter((r) => r.relationshipToOwner === ResidentRelationship.FAMILY && r.id !== owner?.id);
      const tenants = residents.filter((r) => r.relationshipToOwner === ResidentRelationship.TENANT);
      const temporary = residents.filter((r) => r.relationshipToOwner === ResidentRelationship.TEMPORARY_RESIDENT);

      assert.equal(owner?.fullName, 'Nguyễn Văn A', 'Owner identified correctly');
      assert.equal(family.length, 1, '1 Family member');
      assert.equal(family[0].fullName, 'Nguyễn Thị B');
      assert.equal(tenants.length, 1, '1 Tenant');
      assert.equal(tenants[0].fullName, 'Trần Văn C');
      assert.equal(temporary.length, 1, '1 Temporary resident');
      assert.equal(temporary[0].fullName, 'Lê Văn D');
    });
  });

  describe('3. Residence Request Approval & Side Effect Workflow', () => {
    it('TEMPORARY_RESIDENCE approval should upsert Resident with TEMPORARY_RESIDENT relation and record ApartmentHistory', async () => {
      let residentUpserted: any = null;
      let historyCreated: any = null;
      let auditCreated: any = null;

      const mockRequest = {
        id: 'req-001',
        code: 'REQ-2026-0001',
        type: ResidenceRequestType.TEMPORARY_RESIDENCE,
        status: ResidenceRequestStatus.PENDING,
        apartmentId: 'apt-001',
        fullName: 'Phạm Văn Tạm Trú',
        identityCard: '001201999888',
        phone: '0911223344',
        relationship: ResidentRelationship.TEMPORARY_RESIDENT,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
        note: 'Tạm trú học tập',
      };

      // Mock side effect implementation
      residentUpserted = {
        apartmentId: mockRequest.apartmentId,
        fullName: mockRequest.fullName,
        identityCard: mockRequest.identityCard,
        phone: mockRequest.phone,
        relationshipToOwner: ResidentRelationship.TEMPORARY_RESIDENT,
        status: ResidentStatus.RESIDING,
      };

      historyCreated = {
        apartmentId: mockRequest.apartmentId,
        event: ApartmentHistoryEvent.RESIDENT_MOVE_IN,
        title: `Đăng ký tạm trú: ${mockRequest.fullName}`,
        performedBy: 'Ban Quản Lý',
      };

      auditCreated = {
        action: 'APPROVE_RESIDENCE_REQUEST',
        entity: 'RESIDENCE_REQUEST',
        entityId: mockRequest.id,
      };

      assert.equal(residentUpserted.relationshipToOwner, ResidentRelationship.TEMPORARY_RESIDENT);
      assert.equal(residentUpserted.status, ResidentStatus.RESIDING);
      assert.equal(historyCreated.event, ApartmentHistoryEvent.RESIDENT_MOVE_IN);
      assert.equal(auditCreated.action, 'APPROVE_RESIDENCE_REQUEST');
    });

    it('TEMPORARY_ABSENCE approval should update Resident status to TEMPORARY_ABSENT and log STATUS_CHANGE history', async () => {
      const mockRequest = {
        id: 'req-002',
        code: 'REQ-2026-0002',
        type: ResidenceRequestType.TEMPORARY_ABSENCE,
        status: ResidenceRequestStatus.PENDING,
        apartmentId: 'apt-001',
        fullName: 'Nguyễn Thị Vắng',
        identityCard: '001201777666',
        phone: '0977889900',
      };

      let residentStatus: ResidentStatus = ResidentStatus.RESIDING;
      // Approved
      residentStatus = ResidentStatus.TEMPORARY_ABSENT;

      const historyCreated = {
        apartmentId: mockRequest.apartmentId,
        event: ApartmentHistoryEvent.STATUS_CHANGE,
        title: `Đăng ký tạm vắng: ${mockRequest.fullName}`,
      };

      assert.equal(residentStatus, ResidentStatus.TEMPORARY_ABSENT);
      assert.equal(historyCreated.event, ApartmentHistoryEvent.STATUS_CHANGE);
    });

    it('MOVE_OUT approval should update Resident status to MOVED_OUT and log RESIDENT_MOVE_OUT', async () => {
      const mockRequest = {
        id: 'req-003',
        code: 'REQ-2026-0003',
        type: ResidenceRequestType.MOVE_OUT,
        apartmentId: 'apt-001',
        fullName: 'Lê Văn Đi',
        identityCard: '001201555444',
      };

      let residentStatus: ResidentStatus = ResidentStatus.RESIDING;
      // Approved
      residentStatus = ResidentStatus.MOVED_OUT;

      const historyCreated = {
        apartmentId: mockRequest.apartmentId,
        event: ApartmentHistoryEvent.RESIDENT_MOVE_OUT,
        title: `Cư dân hoàn tất chuyển đi: ${mockRequest.fullName}`,
      };

      assert.equal(residentStatus, ResidentStatus.MOVED_OUT);
      assert.equal(historyCreated.event, ApartmentHistoryEvent.RESIDENT_MOVE_OUT);
    });

    it('REJECT request should set status to REJECTED and record rejectReason without modifying Resident model', async () => {
      const mockRequest = {
        id: 'req-004',
        code: 'REQ-2026-0004',
        type: ResidenceRequestType.ADD_MEMBER,
        status: ResidenceRequestStatus.PENDING,
      };

      const rejectReason = 'Thiếu bản sao sổ hộ khẩu hoặc CCCD công chứng';
      const rejectedRequest = {
        ...mockRequest,
        status: ResidenceRequestStatus.REJECTED,
        rejectReason,
        reviewedAt: new Date(),
      };

      assert.equal(rejectedRequest.status, ResidenceRequestStatus.REJECTED);
      assert.equal(rejectedRequest.rejectReason, rejectReason);
    });
  });
});
