/**
 * Unit Tests for FormService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormService } from '../../src/modules/medical-forms/form.service'
import { BadRequestError } from '../../src/shared/response.dto'
import { formTemplateFixture, formSubmissionFixture, createTemplateInputFixture } from '../fixtures'

// Mock the repository
vi.mock('../../src/modules/medical-forms/form.repository', () => ({
  formRepository: {
    listTemplates: vi.fn(),
    getTemplateById: vi.fn(),
    getTemplateBySpecialty: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    listSubmissions: vi.fn(),
    getSubmissionById: vi.fn(),
    createSubmission: vi.fn(),
    updateSubmission: vi.fn(),
    deleteSubmission: vi.fn(),
    addHistoryEntry: vi.fn(),
    getSubmissionHistory: vi.fn(),
    countSubmissionsByStatus: vi.fn(),
  },
}))

import { formRepository } from '../../src/modules/medical-forms/form.repository'

const mockFormRepository = vi.mocked(formRepository)

describe('FormService', () => {
  let formService: FormService

  beforeEach(() => {
    formService = new FormService()
    vi.clearAllMocks()
  })

  describe('listTemplates', () => {
    it('should return list of templates', async () => {
      const templates = [formTemplateFixture]
      mockFormRepository.listTemplates.mockResolvedValue(templates)

      const result = await formService.listTemplates()

      expect(result).toEqual(templates)
      expect(mockFormRepository.listTemplates).toHaveBeenCalledWith({})
    })

    it('should pass filters to repository', async () => {
      mockFormRepository.listTemplates.mockResolvedValue([])

      await formService.listTemplates({
        specialty: 'noi-khoa',
        status: 'active',
        limit: 10,
        offset: 5,
      })

      expect(mockFormRepository.listTemplates).toHaveBeenCalledWith({
        specialty: 'noi-khoa',
        status: 'active',
        limit: 10,
        offset: 5,
      })
    })
  })

  describe('getTemplate', () => {
    it('should return template by id', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)

      const result = await formService.getTemplate('noi-khoa-v1')

      expect(result).toEqual(formTemplateFixture)
    })

    it('should throw BadRequestError when template not found', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)

      await expect(formService.getTemplate('non-existent')).rejects.toThrow(BadRequestError)
      await expect(formService.getTemplate('non-existent')).rejects.toMatchObject({
        message: 'Template not found',
      })
    })
  })

  describe('getTemplateBySpecialty', () => {
    it('should return template by specialty', async () => {
      mockFormRepository.getTemplateBySpecialty.mockResolvedValue(formTemplateFixture)

      const result = await formService.getTemplateBySpecialty('noi-khoa')

      expect(result).toEqual(formTemplateFixture)
      expect(mockFormRepository.getTemplateBySpecialty).toHaveBeenCalledWith('noi-khoa')
    })

    it('should throw BadRequestError when no active template found', async () => {
      mockFormRepository.getTemplateBySpecialty.mockResolvedValue(null)

      await expect(formService.getTemplateBySpecialty('khac')).rejects.toThrow(BadRequestError)
      await expect(formService.getTemplateBySpecialty('khac')).rejects.toMatchObject({
        message: 'No active template found for this specialty',
      })
    })
  })

  describe('createTemplate', () => {
    it('should create a new template', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)
      mockFormRepository.createTemplate.mockResolvedValue(formTemplateFixture)

      const result = await formService.createTemplate(createTemplateInputFixture)

      expect(result).toEqual(formTemplateFixture)
    })

    it('should throw BadRequestError when template ID already exists', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)

      await expect(formService.createTemplate(createTemplateInputFixture)).rejects.toThrow(BadRequestError)
      await expect(formService.createTemplate(createTemplateInputFixture)).rejects.toMatchObject({
        message: 'Template ID already exists',
      })
    })

    it('should throw BadRequestError for invalid specialty', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)

      await expect(
        formService.createTemplate({
          ...createTemplateInputFixture,
          specialty: 'invalid-specialty' as any,
        })
      ).rejects.toThrow(BadRequestError)
      await expect(
        formService.createTemplate({
          ...createTemplateInputFixture,
          specialty: 'invalid-specialty' as any,
        })
      ).rejects.toMatchObject({
        message: 'Invalid specialty',
      })
    })

    it('should accept all valid specialties', async () => {
      const validSpecialties = [
        'noi-khoa', 'tien-phau', 'hau-phau', 'san-khoa', 'phu-khoa',
        'nhi-khoa', 'yhct', 'dieu-duong', 'gmhs-sv', 'gmhs-bs', 'khac'
      ]

      mockFormRepository.getTemplateById.mockResolvedValue(null)
      mockFormRepository.createTemplate.mockResolvedValue(formTemplateFixture)

      for (const specialty of validSpecialties) {
        await formService.createTemplate({
          ...createTemplateInputFixture,
          id: `template-${specialty}`,
          specialty: specialty as any,
        })
      }

      expect(mockFormRepository.createTemplate).toHaveBeenCalledTimes(validSpecialties.length)
    })
  })

  describe('updateTemplate', () => {
    it('should update an existing template', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)
      mockFormRepository.updateTemplate.mockResolvedValue({
        ...formTemplateFixture,
        name: 'Updated Name',
      })

      const result = await formService.updateTemplate('noi-khoa-v1', {
        name: 'Updated Name',
        updatedBy: 'admin',
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should throw BadRequestError when template not found', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)

      await expect(
        formService.updateTemplate('non-existent', { updatedBy: 'admin' })
      ).rejects.toThrow(BadRequestError)
    })

    it('should throw BadRequestError when update fails', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)
      mockFormRepository.updateTemplate.mockResolvedValue(null)

      await expect(
        formService.updateTemplate('noi-khoa-v1', { name: 'New', updatedBy: 'admin' })
      ).rejects.toThrow(BadRequestError)
      await expect(
        formService.updateTemplate('noi-khoa-v1', { name: 'New', updatedBy: 'admin' })
      ).rejects.toMatchObject({
        message: 'Failed to update template',
      })
    })
  })

  describe('deleteTemplate', () => {
    it('should delete an existing template', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)
      mockFormRepository.deleteTemplate.mockResolvedValue(true)

      const result = await formService.deleteTemplate('noi-khoa-v1')

      expect(result).toBe(true)
    })

    it('should throw BadRequestError when template not found', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)

      await expect(formService.deleteTemplate('non-existent')).rejects.toThrow(BadRequestError)
    })
  })

  describe('duplicateTemplate', () => {
    it('should duplicate a template with new version', async () => {
      // First call returns existing template (for getTemplate)
      // Second call returns null (checking if new ID exists in createTemplate)
      mockFormRepository.getTemplateById
        .mockResolvedValueOnce(formTemplateFixture)
        .mockResolvedValueOnce(null)
      mockFormRepository.createTemplate.mockResolvedValue({
        ...formTemplateFixture,
        id: 'noi-khoa-v2-0-0',
        version: '2.0.0',
      })

      const result = await formService.duplicateTemplate('noi-khoa-v1', '2.0.0', 'admin')

      expect(result.version).toBe('2.0.0')
    })
  })

  describe('listSubmissions', () => {
    it('should return list of submissions', async () => {
      const submissions = [formSubmissionFixture]
      mockFormRepository.listSubmissions.mockResolvedValue(submissions)

      const result = await formService.listSubmissions()

      expect(result).toEqual(submissions)
    })

    it('should pass filters to repository', async () => {
      mockFormRepository.listSubmissions.mockResolvedValue([])

      await formService.listSubmissions({
        templateId: 'template-1',
        status: 'submitted',
        limit: 50,
      })

      expect(mockFormRepository.listSubmissions).toHaveBeenCalledWith({
        templateId: 'template-1',
        status: 'submitted',
        limit: 50,
      })
    })
  })

  describe('getSubmission', () => {
    it('should return submission with template info', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue(formSubmissionFixture)
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)

      const result = await formService.getSubmission('sub-2025-001')

      expect(result.id).toBe('sub-2025-001')
      expect(result.template).toEqual(formTemplateFixture)
    })

    it('should throw BadRequestError when submission not found', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue(null)

      await expect(formService.getSubmission('non-existent')).rejects.toThrow(BadRequestError)
    })
  })

  describe('createSubmission', () => {
    it('should create a new submission', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(formTemplateFixture)
      mockFormRepository.createSubmission.mockResolvedValue(formSubmissionFixture)
      mockFormRepository.addHistoryEntry.mockResolvedValue({} as any)

      const result = await formService.createSubmission({
        templateId: 'noi-khoa-v1',
        filledBy: 'doctor-001',
        formData: { fullName: 'Test', age: 30 },
      })

      expect(result).toEqual(formSubmissionFixture)
      expect(mockFormRepository.addHistoryEntry).toHaveBeenCalled()
    })

    it('should throw BadRequestError when template not found', async () => {
      mockFormRepository.getTemplateById.mockResolvedValue(null)

      await expect(
        formService.createSubmission({
          templateId: 'non-existent',
          filledBy: 'doctor-001',
          formData: {},
        })
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('updateSubmission', () => {
    it('should update a draft submission', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue(formSubmissionFixture)
      mockFormRepository.updateSubmission.mockResolvedValue({
        ...formSubmissionFixture,
        formData: { fullName: 'Updated', age: 35 },
      })
      mockFormRepository.addHistoryEntry.mockResolvedValue({} as any)

      const result = await formService.updateSubmission('sub-2025-001', {
        formData: { fullName: 'Updated', age: 35 },
        filledBy: 'doctor-001',
      })

      expect(result.formData).toEqual({ fullName: 'Updated', age: 35 })
    })

    it('should throw BadRequestError when submission not found', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue(null)

      await expect(
        formService.updateSubmission('non-existent', { filledBy: 'doctor-001' })
      ).rejects.toThrow(BadRequestError)
    })

    it('should throw BadRequestError when updating submitted form', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'submitted',
      })

      await expect(
        formService.updateSubmission('sub-2025-001', {
          formData: {},
          filledBy: 'doctor-001',
        })
      ).rejects.toThrow(BadRequestError)
      await expect(
        formService.updateSubmission('sub-2025-001', {
          formData: {},
          filledBy: 'doctor-001',
        })
      ).rejects.toMatchObject({
        message: 'Cannot update a submitted or approved submission',
      })
    })

    it('should throw BadRequestError when updating approved form', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'approved',
      })

      await expect(
        formService.updateSubmission('sub-2025-001', {
          formData: {},
          filledBy: 'doctor-001',
        })
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('reviewSubmission', () => {
    it('should approve a submitted form', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'submitted',
      })
      mockFormRepository.updateSubmission.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'approved',
      })
      mockFormRepository.addHistoryEntry.mockResolvedValue({} as any)

      const result = await formService.reviewSubmission('sub-2025-001', 'approved', 'reviewer-001')

      expect(mockFormRepository.updateSubmission).toHaveBeenCalledWith(
        'sub-2025-001',
        expect.objectContaining({
          status: 'approved',
          reviewedBy: 'reviewer-001',
        })
      )
    })

    it('should reject a submitted form', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'submitted',
      })
      mockFormRepository.updateSubmission.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'rejected',
      })
      mockFormRepository.addHistoryEntry.mockResolvedValue({} as any)

      await formService.reviewSubmission('sub-2025-001', 'rejected', 'reviewer-001', 'Missing signature')

      expect(mockFormRepository.addHistoryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Missing signature',
        })
      )
    })

    it('should throw BadRequestError when submission not found', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue(null)

      await expect(
        formService.reviewSubmission('non-existent', 'approved', 'reviewer-001')
      ).rejects.toThrow(BadRequestError)
    })

    it('should throw BadRequestError when submission not in submitted status', async () => {
      mockFormRepository.getSubmissionById.mockResolvedValue({
        ...formSubmissionFixture,
        status: 'draft',
      })

      await expect(
        formService.reviewSubmission('sub-2025-001', 'approved', 'reviewer-001')
      ).rejects.toThrow(BadRequestError)
      await expect(
        formService.reviewSubmission('sub-2025-001', 'approved', 'reviewer-001')
      ).rejects.toMatchObject({
        message: 'Can only review submitted forms',
      })
    })
  })

  describe('getStats', () => {
    it('should return submission statistics', async () => {
      const stats = {
        draft: 5,
        completed: 10,
        submitted: 3,
        approved: 8,
        rejected: 2,
      }
      mockFormRepository.countSubmissionsByStatus.mockResolvedValue(stats)

      const result = await formService.getStats()

      expect(result).toEqual(stats)
    })

    it('should pass templateId to repository', async () => {
      mockFormRepository.countSubmissionsByStatus.mockResolvedValue({
        draft: 0,
        completed: 0,
        submitted: 0,
        approved: 0,
        rejected: 0,
      })

      await formService.getStats('template-1')

      expect(mockFormRepository.countSubmissionsByStatus).toHaveBeenCalledWith('template-1')
    })
  })
})
