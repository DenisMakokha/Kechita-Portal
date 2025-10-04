import { Router } from 'express';
import { PrismaClient } from '@kechita/db';

const router = Router();
const prisma = new PrismaClient();

// ==================== SCREENING QUESTIONS ====================

// Get screening questions for a job
router.get('/screening-questions/job/:jobId', async (req, res) => {
  try {
    const questions = await prisma.screeningQuestion.findMany({
      where: { jobId: req.params.jobId },
      orderBy: { order: 'asc' }
    });
    res.json(questions);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Create screening question
router.post('/screening-questions', async (req, res) => {
  try {
    const {
      jobId, question, questionType, options, isKnockout,
      knockoutAnswer, required, order, weight
    } = req.body;
    
    const newQuestion = await prisma.screeningQuestion.create({
      data: {
        jobId,
        question,
        questionType,
        options,
        isKnockout: isKnockout || false,
        knockoutAnswer,
        required: required !== false,
        order: order || 0,
        weight: weight || 1
      }
    });
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Failed to create question:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// Update screening question
router.patch('/screening-questions/:id', async (req, res) => {
  try {
    const {
      question, questionType, options, isKnockout,
      knockoutAnswer, required, order, weight
    } = req.body;
    
    const updated = await prisma.screeningQuestion.update({
      where: { id: req.params.id },
      data: { question, questionType, options, isKnockout, knockoutAnswer, required, order, weight }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Failed to update question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// Delete screening question
router.delete('/screening-questions/:id', async (req, res) => {
  try {
    await prisma.screeningQuestion.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Failed to delete question:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// Submit screening answers
router.post('/screening-answers', async (req, res) => {
  try {
    const { applicationId, answers } = req.body; // answers: [{questionId, answer}]
    
    const results = [];
    let failedKnockout = false;
    
    for (const ans of answers) {
      const question = await prisma.screeningQuestion.findUnique({
        where: { id: ans.questionId }
      });
      
      if (!question) continue;
      
      let passedKnockout = true;
      if (question.isKnockout && question.knockoutAnswer) {
        passedKnockout = ans.answer.toLowerCase() === question.knockoutAnswer.toLowerCase();
        if (!passedKnockout) failedKnockout = true;
      }
      
      const answer = await prisma.screeningAnswer.create({
        data: {
          questionId: ans.questionId,
          applicationId,
          answer: ans.answer,
          isKnockout: question.isKnockout,
          passedKnockout
        }
      });
      
      results.push(answer);
    }
    
    // If failed knockout, auto-reject
    if (failedKnockout) {
      await prisma.application.update({
        where: { id: applicationId },
        data: { status: 'REJECTED' }
      });
      
      await prisma.candidateActivity.create({
        data: {
          applicationId,
          activityType: 'auto_rejected',
          userId: 'system',
          title: 'Auto-rejected',
          description: 'Failed knockout screening question',
          metadata: { reason: 'knockout_failed' }
        }
      });
    }
    
    res.status(201).json({ answers: results, failedKnockout });
  } catch (error) {
    console.error('Failed to submit answers:', error);
    res.status(500).json({ error: 'Failed to submit answers' });
  }
});

// Get screening answers for application
router.get('/applications/:id/screening-answers', async (req, res) => {
  try {
    const answers = await prisma.screeningAnswer.findMany({
      where: { applicationId: req.params.id },
      include: { question: true }
    });
    res.json(answers);
  } catch (error) {
    console.error('Failed to fetch answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
});

// ==================== RESUME PARSING ====================

// Parse resume (mock implementation - integrate with actual parser)
router.post('/parse-resume', async (req, res) => {
  try {
    const { applicationId, resumeText } = req.body;
    
    // TODO: Integrate with actual resume parser (e.g., textract, OpenAI, custom NLP)
    // For now, basic keyword extraction
    const skills = extractSkills(resumeText);
    const keywords = extractKeywords(resumeText);
    const experience = estimateExperience(resumeText);
    
    const parsed = await prisma.resumeParser.create({
      data: {
        applicationId,
        rawText: resumeText,
        parsedData: {
          skills,
          experience,
          keywords
        },
        skills,
        experience,
        education: {},
        certifications: [],
        keywords,
        confidence: 75.0,
        parseMethod: 'regex'
      }
    });
    
    // Trigger auto-scoring
    await triggerAutoScoring(applicationId);
    
    res.status(201).json(parsed);
  } catch (error) {
    console.error('Failed to parse resume:', error);
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// Get parsed resume
router.get('/applications/:id/parsed-resume', async (req, res) => {
  try {
    const parsed = await prisma.resumeParser.findUnique({
      where: { applicationId: req.params.id }
    });
    res.json(parsed);
  } catch (error) {
    console.error('Failed to fetch parsed resume:', error);
    res.status(500).json({ error: 'Failed to fetch parsed resume' });
  }
});

// ==================== AUTO-SCORING RULES ====================

// Get scoring rules
router.get('/auto-score-rules', async (req, res) => {
  try {
    const { jobId, ruleType } = req.query;
    
    const where: any = { isActive: true };
    if (jobId) where.jobId = jobId;
    if (ruleType) where.ruleType = ruleType;
    
    const rules = await prisma.autoScoreRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });
    
    res.json(rules);
  } catch (error) {
    console.error('Failed to fetch rules:', error);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// Create scoring rule
router.post('/auto-score-rules', async (req, res) => {
  try {
    const {
      jobId, name, description, ruleType, criteria, points, priority, createdBy
    } = req.body;
    
    const rule = await prisma.autoScoreRule.create({
      data: {
        jobId,
        name,
        description,
        ruleType,
        criteria,
        points,
        isActive: true,
        priority: priority || 0,
        createdBy
      }
    });
    
    res.status(201).json(rule);
  } catch (error) {
    console.error('Failed to create rule:', error);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// Update scoring rule
router.patch('/auto-score-rules/:id', async (req, res) => {
  try {
    const { name, description, criteria, points, priority, isActive } = req.body;
    
    const rule = await prisma.autoScoreRule.update({
      where: { id: req.params.id },
      data: { name, description, criteria, points, priority, isActive }
    });
    
    res.json(rule);
  } catch (error) {
    console.error('Failed to update rule:', error);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// Delete scoring rule
router.delete('/auto-score-rules/:id', async (req, res) => {
  try {
    await prisma.autoScoreRule.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete rule:', error);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// Run auto-scoring on application
router.post('/applications/:id/auto-score', async (req, res) => {
  try {
    const score = await calculateAutoScore(req.params.id);
    res.json({ score });
  } catch (error) {
    console.error('Failed to calculate score:', error);
    res.status(500).json({ error: 'Failed to calculate score' });
  }
});

// ==================== DUPLICATE DETECTION ====================

// Check for duplicates
router.post('/check-duplicates', async (req, res) => {
  try {
    const { email, phone, firstName, lastName } = req.body;
    
    const duplicates = [];
    
    // Check email duplicates
    if (email) {
      const emailMatches = await prisma.application.findMany({
        where: { email },
        include: { job: true }
      });
      
      for (const match of emailMatches) {
        duplicates.push({
          applicationId: match.id,
          matchType: 'email',
          confidence: 100,
          candidate: match
        });
      }
    }
    
    // Check phone duplicates
    if (phone) {
      const phoneMatches = await prisma.application.findMany({
        where: { phone },
        include: { job: true }
      });
      
      for (const match of phoneMatches) {
        if (!duplicates.find(d => d.applicationId === match.id)) {
          duplicates.push({
            applicationId: match.id,
            matchType: 'phone',
            confidence: 95,
            candidate: match
          });
        }
      }
    }
    
    // Check name similarity (basic implementation)
    if (firstName && lastName) {
      const nameMatches = await prisma.application.findMany({
        where: {
          AND: [
            { firstName: { contains: firstName, mode: 'insensitive' } },
            { lastName: { contains: lastName, mode: 'insensitive' } }
          ]
        },
        include: { job: true }
      });
      
      for (const match of nameMatches) {
        if (!duplicates.find(d => d.applicationId === match.id)) {
          duplicates.push({
            applicationId: match.id,
            matchType: 'name',
            confidence: 70,
            candidate: match
          });
        }
      }
    }
    
    res.json({ duplicates, count: duplicates.length });
  } catch (error) {
    console.error('Failed to check duplicates:', error);
    res.status(500).json({ error: 'Failed to check duplicates' });
  }
});

// Get duplicate candidates
router.get('/duplicate-candidates', async (req, res) => {
  try {
    const { status } = req.query;
    
    const where: any = {};
    if (status) where.status = status;
    
    const duplicates = await prisma.duplicateCandidate.findMany({
      where,
      orderBy: { confidence: 'desc' }
    });
    
    res.json(duplicates);
  } catch (error) {
    console.error('Failed to fetch duplicates:', error);
    res.status(500).json({ error: 'Failed to fetch duplicates' });
  }
});

// Resolve duplicate
router.post('/duplicate-candidates/:id/resolve', async (req, res) => {
  try {
    const { action, mergedInto, resolvedBy } = req.body; // action: "merge" or "ignore"
    
    const duplicate = await prisma.duplicateCandidate.update({
      where: { id: req.params.id },
      data: {
        status: action === 'merge' ? 'MERGED' : 'IGNORED',
        mergedInto,
        resolvedBy,
        resolvedAt: new Date()
      }
    });
    
    res.json(duplicate);
  } catch (error) {
    console.error('Failed to resolve duplicate:', error);
    res.status(500).json({ error: 'Failed to resolve duplicate' });
  }
});

// ==================== SMART TRIAGE ====================

// Get triage rules
router.get('/smart-triage-rules', async (req, res) => {
  try {
    const { jobId } = req.query;
    
    const where: any = { isActive: true };
    if (jobId) where.jobId = jobId;
    
    const rules = await prisma.smartTriageRule.findMany({
      where,
      orderBy: { priority: 'desc' }
    });
    
    res.json(rules);
  } catch (error) {
    console.error('Failed to fetch triage rules:', error);
    res.status(500).json({ error: 'Failed to fetch triage rules' });
  }
});

// Create triage rule
router.post('/smart-triage-rules', async (req, res) => {
  try {
    const {
      jobId, name, description, conditions, action, actionParams, priority, createdBy
    } = req.body;
    
    const rule = await prisma.smartTriageRule.create({
      data: {
        jobId,
        name,
        description,
        conditions,
        action,
        actionParams,
        isActive: true,
        priority: priority || 0,
        executionCount: 0,
        createdBy
      }
    });
    
    res.status(201).json(rule);
  } catch (error) {
    console.error('Failed to create triage rule:', error);
    res.status(500).json({ error: 'Failed to create triage rule' });
  }
});

// Update triage rule
router.patch('/smart-triage-rules/:id', async (req, res) => {
  try {
    const { name, description, conditions, action, actionParams, priority, isActive } = req.body;
    
    const rule = await prisma.smartTriageRule.update({
      where: { id: req.params.id },
      data: { name, description, conditions, action, actionParams, priority, isActive }
    });
    
    res.json(rule);
  } catch (error) {
    console.error('Failed to update triage rule:', error);
    res.status(500).json({ error: 'Failed to update triage rule' });
  }
});

// Delete triage rule
router.delete('/smart-triage-rules/:id', async (req, res) => {
  try {
    await prisma.smartTriageRule.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Triage rule deleted successfully' });
  } catch (error) {
    console.error('Failed to delete triage rule:', error);
    res.status(500).json({ error: 'Failed to delete triage rule' });
  }
});

// Run triage rules on application
router.post('/applications/:id/run-triage', async (req, res) => {
  try {
    const result = await runTriageRules(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Failed to run triage:', error);
    res.status(500).json({ error: 'Failed to run triage' });
  }
});

// ==================== HELPER FUNCTIONS ====================

function extractSkills(text: string): string[] {
  const skillKeywords = [
    'javascript', 'typescript', 'python', 'java', 'react', 'node',
    'sql', 'mongodb', 'aws', 'docker', 'kubernetes', 'git',
    'leadership', 'management', 'communication', 'teamwork'
  ];
  
  const skills: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const skill of skillKeywords) {
    if (lowerText.includes(skill)) {
      skills.push(skill);
    }
  }
  
  return [...new Set(skills)];
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - can be enhanced with NLP
  const words = text.toLowerCase().split(/\W+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  
  const keywords = words.filter(w => w.length > 3 && !commonWords.has(w));
  const frequency = new Map<string, number>();
  
  keywords.forEach(w => {
    frequency.set(w, (frequency.get(w) || 0) + 1);
  });
  
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

function estimateExperience(text: string): any {
  // Basic experience estimation from resume text
  const yearsPattern = /(\d+)\+?\s*(years?|yrs?)/gi;
  const matches = Array.from(text.matchAll(yearsPattern));
  
  if (matches.length > 0) {
    const years = matches.map(m => parseInt(m[1]));
    const maxYears = Math.max(...years);
    return { total: maxYears, category: 'general' };
  }
  
  return { total: 0, category: 'entry-level' };
}

async function calculateAutoScore(applicationId: string): Promise<number> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true }
  });
  
  if (!application) return 0;
  
  const rules = await prisma.autoScoreRule.findMany({
    where: {
      OR: [
        { jobId: application.jobId },
        { jobId: null }
      ],
      isActive: true
    },
    orderBy: { priority: 'desc' }
  });
  
  const parsed = await prisma.resumeParser.findUnique({
    where: { applicationId }
  });
  
  let totalScore = 0;
  
  for (const rule of rules) {
    let points = 0;
    
    if (rule.ruleType === 'skill_match' && parsed) {
      const requiredSkills = rule.criteria.skills || [];
      const matchedSkills = parsed.skills.filter((s: string) =>
        requiredSkills.some((rs: string) => s.toLowerCase().includes(rs.toLowerCase()))
      );
      
      if (matchedSkills.length > 0) {
        points = Math.min(rule.points, (matchedSkills.length / requiredSkills.length) * rule.points);
      }
    }
    
    totalScore += points;
  }
  
  // Update application score
  await prisma.application.update({
    where: { id: applicationId },
    data: { score: Math.round(totalScore) }
  });
  
  return Math.round(totalScore);
}

async function triggerAutoScoring(applicationId: string): Promise<void> {
  await calculateAutoScore(applicationId);
}

async function runTriageRules(applicationId: string): Promise<any> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { job: true }
  });
  
  if (!application) return { applied: false, message: 'Application not found' };
  
  const rules = await prisma.smartTriageRule.findMany({
    where: {
      OR: [
        { jobId: application.jobId },
        { jobId: null }
      ],
      isActive: true
    },
    orderBy: { priority: 'desc' }
  });
  
  for (const rule of rules) {
    const conditionsMet = evaluateConditions(rule.conditions, application);
    
    if (conditionsMet) {
      // Execute action
      if (rule.action === 'auto_reject') {
        await prisma.application.update({
          where: { id: applicationId },
          data: { status: 'REJECTED' }
        });
      } else if (rule.action === 'fast_track') {
        await prisma.candidateTag.create({
          data: {
            applicationId,
            name: 'fast-track',
            color: '#10B981',
            category: 'status',
            addedById: 'system'
          }
        });
      }
      
      // Update execution count
      await prisma.smartTriageRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          lastExecuted: new Date()
        }
      });
      
      return { applied: true, rule: rule.name, action: rule.action };
    }
  }
  
  return { applied: false, message: 'No rules matched' };
}

function evaluateConditions(conditions: any, application: any): boolean {
  // Simple condition evaluation - can be enhanced
  if (!Array.isArray(conditions)) return false;
  
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const fieldValue = application[field];
    
    if (operator === 'equals' && fieldValue !== value) return false;
    if (operator === 'greater_than' && fieldValue <= value) return false;
    if (operator === 'less_than' && fieldValue >= value) return false;
    if (operator === 'contains' && !String(fieldValue).includes(value)) return false;
  }
  
  return true;
}

export default router;
