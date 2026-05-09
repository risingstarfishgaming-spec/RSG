import { Router, type RequestHandler } from 'express'
import { FAQ } from '../models/FAQ.js'
import { authenticateStaff } from '../middleware/authenticateStaff.js'
import { sanitizeString, sanitizeText } from '../utils/sanitize.js'
import { HttpError } from '../utils/HttpError.js'

export const faqRouter = Router()

faqRouter.get('/', async (_req, res, next) => {
  try {
    const faqs = await FAQ.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('-__v')
      .lean()
    res.json({
      success: true,
      message: 'FAQs retrieved successfully',
      data: faqs,
    })
  } catch (e) {
    next(e)
  }
})

faqRouter.get(
  '/all',
  authenticateStaff as RequestHandler,
  async (_req, res, next) => {
    try {
      const faqs = await FAQ.find()
        .sort({ order: 1, createdAt: -1 })
        .select('-__v')
        .lean()
      res.json({
        success: true,
        message: 'All FAQs retrieved successfully',
        data: faqs,
      })
    } catch (e) {
      next(e)
    }
  },
)

faqRouter.get('/:id', async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id).select('-__v').lean()
    if (!faq) throw new HttpError(404, 'FAQ not found')
    res.json({ success: true, message: 'FAQ retrieved successfully', data: faq })
  } catch (e) {
    next(e)
  }
})

faqRouter.post(
  '/',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const { question, answer, category, order, isActive } = req.body
      if (!question || !answer) {
        throw new HttpError(400, 'Question and answer are required')
      }
      const faq = await FAQ.create({
        question: sanitizeString(question),
        answer: sanitizeText(answer),
        category: sanitizeString(category || 'general'),
        order: order ?? 0,
        isActive: isActive !== undefined ? isActive : true,
      })
      res.status(201).json({
        success: true,
        message: 'FAQ created successfully',
        data: faq,
      })
    } catch (e) {
      next(e)
    }
  },
)

faqRouter.put(
  '/:id',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const { question, answer, category, order, isActive } = req.body
      const faq = await FAQ.findById(req.params.id)
      if (!faq) throw new HttpError(404, 'FAQ not found')
      if (question) faq.question = sanitizeString(question)
      if (answer) faq.answer = sanitizeText(answer)
      if (category) faq.category = sanitizeString(category)
      if (order !== undefined) faq.order = order
      if (isActive !== undefined) faq.isActive = isActive
      await faq.save()
      res.json({
        success: true,
        message: 'FAQ updated successfully',
        data: faq,
      })
    } catch (e) {
      next(e)
    }
  },
)

faqRouter.delete(
  '/:id',
  authenticateStaff as RequestHandler,
  async (req, res, next) => {
    try {
      const faq = await FAQ.findByIdAndDelete(req.params.id)
      if (!faq) throw new HttpError(404, 'FAQ not found')
      res.json({ success: true, message: 'FAQ deleted successfully' })
    } catch (e) {
      next(e)
    }
  },
)
