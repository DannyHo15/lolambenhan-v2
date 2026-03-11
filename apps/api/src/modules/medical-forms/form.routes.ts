/**
 * Form Routes - API endpoints for medical forms
 */
import { Elysia, t } from "elysia"
import { formService } from "./form.service"
import { exportService } from "./export.service"
import { ResponseDto, BadRequestError, UnauthorizedError } from "../../shared/response.dto"
import { verifyToken } from "../../shared/auth.util"

export const formRoutes = new Elysia({ prefix: "/forms" })
  // ============================================
  // TEMPLATE ROUTES
  // ============================================

  /**
   * List all form templates
   * GET /apis/v1/forms/templates
   */
  .get("/templates", async ({ query }) => {
    const { specialty, status, limit, offset } = query as {
      specialty?: string
      status?: string
      limit?: string
      offset?: string
    }

    const templates = await formService.listTemplates({
      specialty: specialty as any,
      status: status as any,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    })

    return ResponseDto.success({
      templates,
      count: templates.length,
    })
  })

  /**
   * Get a specific template
   * GET /apis/v1/forms/templates/:id
   */
  .get("/templates/:id", async ({ params }) => {
    const template = await formService.getTemplate(params.id)
    return ResponseDto.success({ template })
  })

  /**
   * Get template by specialty
   * GET /apis/v1/forms/template/:specialty
   */
  .get("/template/:specialty", async ({ params }) => {
    const template = await formService.getTemplateBySpecialty(params.specialty as any)
    return ResponseDto.success({ template })
  })

  /**
   * Create a new template (admin only)
   * POST /apis/v1/forms/templates
   */
  .post(
    "/templates",
    async ({ body, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError()
      }

      const data = body as {
        id: string
        name: string
        specialty: string
        version: string
        description?: string
        templateSchema: any
        settings?: any
        exportConfig?: any
        tags?: string[]
        createdBy: string
      }

      const template = await formService.createTemplate({
        id: data.id,
        name: data.name,
        specialty: data.specialty as any,
        version: data.version,
        description: data.description,
        templateSchema: data.templateSchema,
        settings: data.settings,
        exportConfig: data.exportConfig,
        tags: data.tags,
        createdBy: data.createdBy || "admin",
      })

      return ResponseDto.success({ template }, "Template created successfully")
    },
    {
      body: t.Object({
        id: t.String(),
        name: t.String(),
        specialty: t.String(),
        version: t.String(),
        description: t.Optional(t.String()),
        templateSchema: t.Any(),
        settings: t.Optional(t.Any()),
        exportConfig: t.Optional(t.Any()),
        tags: t.Optional(t.Array(t.String())),
        createdBy: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Update a template (admin only)
   * PATCH /apis/v1/forms/templates/:id
   */
  .patch(
    "/templates/:id",
    async ({ params, body, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError()
      }

      const data = body as {
        name?: string
        description?: string
        status?: string
        templateSchema?: any
        settings?: any
        exportConfig?: any
        tags?: string[]
        updatedBy: string
      }

      const template = await formService.updateTemplate(params.id, {
        name: data.name,
        description: data.description,
        status: data.status as any,
        templateSchema: data.templateSchema,
        settings: data.settings,
        exportConfig: data.exportConfig,
        tags: data.tags,
        updatedBy: data.updatedBy || "admin",
      })

      return ResponseDto.success({ template }, "Template updated successfully")
    }
  )

  /**
   * Delete a template (admin only)
   * DELETE /apis/v1/forms/templates/:id
   */
  .delete("/templates/:id", async ({ params, bearer }) => {
    if (!bearer || !verifyToken(bearer)) {
      throw new UnauthorizedError()
    }

    const deleted = await formService.deleteTemplate(params.id)
    return ResponseDto.success({ deleted, id: params.id }, "Template deleted successfully")
  })

  /**
   * Duplicate a template (admin only)
   * POST /apis/v1/forms/templates/:id/duplicate
   */
  .post(
    "/templates/:id/duplicate",
    async ({ params, body, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError()
      }

      const { newVersion, createdBy } = body as {
        newVersion: string
        createdBy: string
      }

      const template = await formService.duplicateTemplate(
        params.id,
        newVersion,
        createdBy || "admin"
      )

      return ResponseDto.success({ template }, "Template duplicated successfully")
    },
    {
      body: t.Object({
        newVersion: t.String(),
        createdBy: t.Optional(t.String()),
      }),
    }
  )

  // ============================================
  // SUBMISSION ROUTES
  // ============================================

  /**
   * List form submissions
   * GET /apis/v1/forms/submissions
   */
  .get("/submissions", async ({ query }) => {
    const { templateId, patientId, filledBy, status, limit, offset } = query as {
      templateId?: string
      patientId?: string
      filledBy?: string
      status?: string
      limit?: string
      offset?: string
    }

    const submissions = await formService.listSubmissions({
      templateId,
      patientId,
      filledBy,
      status: status as any,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    })

    return ResponseDto.success({
      submissions,
      count: submissions.length,
    })
  })

  /**
   * Get a specific submission
   * GET /apis/v1/forms/submissions/:id
   */
  .get("/submissions/:id", async ({ params }) => {
    const submission = await formService.getSubmission(params.id)
    return ResponseDto.success({ submission })
  })

  /**
   * Get submission history
   * GET /apis/v1/forms/submissions/:id/history
   */
  .get("/submissions/:id/history", async ({ params }) => {
    const history = await formService.getSubmissionHistory(params.id)
    return ResponseDto.success({ history })
  })

  /**
   * Create a new submission
   * POST /apis/v1/forms/submissions
   */
  .post(
    "/submissions",
    async ({ body }) => {
      const data = body as {
        templateId: string
        patientId?: string
        filledBy: string
        formData: Record<string, unknown>
        sections?: Record<string, unknown[]>
        attachments?: Array<{
          id: string
          fieldId: string
          fileName: string
          fileUrl: string
          fileSize: number
          mimeType: string
          uploadedAt: string
        }>
        signature?: {
          imageUrl: string
          signedBy: string
          signedAt: string
          ipAddress?: string
        }
        metadata?: {
          device?: string
          browser?: string
          ipAddress?: string
          location?: string
        }
      }

      const submission = await formService.createSubmission({
        templateId: data.templateId,
        patientId: data.patientId,
        filledBy: data.filledBy,
        formData: data.formData,
        sections: data.sections,
        attachments: data.attachments,
        signature: data.signature,
        metadata: data.metadata,
      })

      return ResponseDto.success({ submission }, "Submission created successfully")
    },
    {
      body: t.Object({
        templateId: t.String(),
        patientId: t.Optional(t.String()),
        filledBy: t.String(),
        formData: t.Any(),
        sections: t.Optional(t.Any()),
        attachments: t.Optional(t.Any()),
        signature: t.Optional(t.Any()),
        metadata: t.Optional(t.Any()),
      }),
    }
  )

  /**
   * Update a submission
   * PATCH /apis/v1/forms/submissions/:id
   */
  .patch(
    "/submissions/:id",
    async ({ params, body }) => {
      const data = body as {
        formData?: Record<string, unknown>
        sections?: Record<string, unknown[]>
        attachments?: Array<{
          id: string
          fieldId: string
          fileName: string
          fileUrl: string
          fileSize: number
          mimeType: string
          uploadedAt: string
        }>
        status?: string
        signature?: {
          imageUrl: string
          signedBy: string
          signedAt: string
          ipAddress?: string
        }
        filledBy: string
      }

      const submission = await formService.updateSubmission(params.id, {
        formData: data.formData,
        sections: data.sections,
        attachments: data.attachments,
        status: data.status as any,
        signature: data.signature,
        filledBy: data.filledBy,
      })

      return ResponseDto.success({ submission }, "Submission updated successfully")
    }
  )

  /**
   * Submit a submission for approval
   * POST /apis/v1/forms/submissions/:id/submit
   */
  .post("/submissions/:id/submit", async ({ params, body }) => {
    const { filledBy } = body as { filledBy: string }
    const submission = await formService.submitSubmission(params.id, filledBy)
    return ResponseDto.success({ submission }, "Submission submitted successfully")
  })

  /**
   * Approve/reject a submission (admin only)
   * POST /apis/v1/forms/submissions/:id/review
   */
  .post(
    "/submissions/:id/review",
    async ({ params, body, bearer }) => {
      if (!bearer || !verifyToken(bearer)) {
        throw new UnauthorizedError()
      }

      const { status, reviewedBy, reviewNotes } = body as {
        status: 'approved' | 'rejected'
        reviewedBy: string
        reviewNotes?: string
      }

      const submission = await formService.reviewSubmission(
        params.id,
        status,
        reviewedBy,
        reviewNotes
      )

      return ResponseDto.success({ submission }, `Submission ${status} successfully`)
    },
    {
      body: t.Object({
        status: t.Union([t.Literal('approved'), t.Literal('rejected')]),
        reviewedBy: t.String(),
        reviewNotes: t.Optional(t.String()),
      }),
    }
  )

  /**
   * Delete a submission
   * DELETE /apis/v1/forms/submissions/:id
   */
  .delete("/submissions/:id", async ({ params, bearer }) => {
    if (!bearer || !verifyToken(bearer)) {
      throw new UnauthorizedError()
    }

    const deleted = await formService.deleteSubmission(params.id)
    return ResponseDto.success({ deleted, id: params.id }, "Submission deleted successfully")
  })

  /**
   * Export submission to DOCX/PDF/HTML/JSON
   * GET /apis/v1/forms/submissions/:id/export
   */
  .get("/submissions/:id/export", async ({ params, query }) => {
    const { format, includeSignature, includeTimestamp } = query as {
      format?: string
      includeSignature?: string
      includeTimestamp?: string
    }

    const result = await exportService.exportSubmission(params.id, {
      format: (format as any) || 'docx',
      includeSignature: includeSignature === 'true',
      includeTimestamp: includeTimestamp !== 'false',
    })

    // Return the content as base64 for easier handling
    const base64Content = Buffer.from(result.content).toString('base64')

    return ResponseDto.success({
      format: result.format,
      filename: result.filename,
      mimeType: result.mimeType,
      content: base64Content,
    })
  })

  // ============================================
  // STATS ROUTE
  // ============================================

  /**
   * Get form statistics
   * GET /apis/v1/forms/stats
   */
  .get("/stats", async ({ query }) => {
    const { templateId } = query as { templateId?: string }
    const stats = await formService.getStats(templateId)
    return ResponseDto.success({ stats })
  })
