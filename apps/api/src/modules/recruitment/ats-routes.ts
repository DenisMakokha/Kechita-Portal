import { Router } from 'express';
import { PrismaClient } from '@kechita/db';

const router = Router();
const prisma = new PrismaClient();

// ==================== PIPELINE MANAGEMENT ====================

// Get all pipelines
router.get('/pipelines', async (req, res) => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { jobs: true }
        }
      },
      orderBy: { isDefault: 'desc' }
    });
    res.json(pipelines);
  } catch (error) {
    console.error('Failed to fetch pipelines:', error);
    res.status(500).json({ error: 'Failed to fetch pipelines' });
  }
});

// Get single pipeline with stages
router.get('/pipelines/:id', async (req, res) => {
  try {
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: req.params.id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { applications: true }
            }
          }
        }
      }
    });
    
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    res.json(pipeline);
  } catch (error) {
    console.error('Failed to fetch pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch pipeline' });
  }
});

// Create pipeline
router.post('/pipelines', async (req, res) => {
  try {
    const { name, description, isDefault, stages } = req.body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }
    
    const pipeline = await prisma.pipeline.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
        isTemplate: false,
        stages: {
          create: stages?.map((stage: any, index: number) => ({
            name: stage.name,
            description: stage.description,
            order: index,
            color: stage.color || '#3B82F6',
            type: stage.type || 'CUSTOM'
          })) || []
        }
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    res.status(201).json(pipeline);
  } catch (error) {
    console.error('Failed to create pipeline:', error);
    res.status(500).json({ error: 'Failed to create pipeline' });
  }
});

// Update pipeline
router.patch('/pipelines/:id', async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;
    
    if (isDefault) {
      await prisma.pipeline.updateMany({
        where: { isDefault: true, NOT: { id: req.params.id } },
        data: { isDefault: false }
      });
    }
    
    const pipeline = await prisma.pipeline.update({
      where: { id: req.params.id },
      data: { name, description, isDefault },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    res.json(pipeline);
  } catch (error) {
    console.error('Failed to update pipeline:', error);
    res.status(500).json({ error: 'Failed to update pipeline' });
  }
});

// Delete pipeline
router.delete('/pipelines/:id', async (req, res) => {
  try {
    // Check if pipeline is in use
    const jobsCount = await prisma.jobPosting.count({
      where: { pipelineId: req.params.id }
    });
    
    if (jobsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete pipeline that is in use by jobs' 
      });
    }
    
    await prisma.pipeline.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Pipeline deleted successfully' });
  } catch (error) {
    console.error('Failed to delete pipeline:', error);
    res.status(500).json({ error: 'Failed to delete pipeline' });
  }
});

// ==================== STAGE MANAGEMENT ====================

// Create stage
router.post('/stages', async (req, res) => {
  try {
    const { pipelineId, name, description, color, type, order } = req.body;
    
    // Get max order if not provided
    let stageOrder = order;
    if (stageOrder === undefined) {
      const maxStage = await prisma.stage.findFirst({
        where: { pipelineId },
        orderBy: { order: 'desc' }
      });
      stageOrder = (maxStage?.order ?? -1) + 1;
    }
    
    const stage = await prisma.stage.create({
      data: {
        pipelineId,
        name,
        description,
        order: stageOrder,
        color: color || '#3B82F6',
        type: type || 'CUSTOM'
      }
    });
    
    res.status(201).json(stage);
  } catch (error) {
    console.error('Failed to create stage:', error);
    res.status(500).json({ error: 'Failed to create stage' });
  }
});

// Update stage
router.patch('/stages/:id', async (req, res) => {
  try {
    const { name, description, color, order } = req.body;
    
    const stage = await prisma.stage.update({
      where: { id: req.params.id },
      data: { name, description, color, order }
    });
    
    res.json(stage);
  } catch (error) {
    console.error('Failed to update stage:', error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
});

// Reorder stages
router.post('/stages/reorder', async (req, res) => {
  try {
    const { stages } = req.body; // Array of {id, order}
    
    await Promise.all(
      stages.map((stage: any) =>
        prisma.stage.update({
          where: { id: stage.id },
          data: { order: stage.order }
        })
      )
    );
    
    res.json({ message: 'Stages reordered successfully' });
  } catch (error) {
    console.error('Failed to reorder stages:', error);
    res.status(500).json({ error: 'Failed to reorder stages' });
  }
});

// Delete stage
router.delete('/stages/:id', async (req, res) => {
  try {
    // Check if stage has applications
    const appsCount = await prisma.application.count({
      where: { stageId: req.params.id }
    });
    
    if (appsCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete stage with ${appsCount} active applications` 
      });
    }
    
    await prisma.stage.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    console.error('Failed to delete stage:', error);
    res.status(500).json({ error: 'Failed to delete stage' });
  }
});

// ==================== CANDIDATE STAGE MOVEMENT ====================

// Move candidate to stage
router.post('/applications/:id/move-stage', async (req, res) => {
  try {
    const { stageId, userId } = req.body;
    
    // Get current application
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: { stage: true }
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Get new stage
    const newStage = await prisma.stage.findUnique({
      where: { id: stageId }
    });
    
    if (!newStage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    // Update application stage
    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { 
        stageId,
        lastActivityAt: new Date()
      },
      include: {
        stage: true,
        job: true
      }
    });
    
    // Create activity record
    await prisma.candidateActivity.create({
      data: {
        applicationId: req.params.id,
        activityType: 'stage_change',
        userId,
        title: `Moved to ${newStage.name}`,
        description: application.stage 
          ? `Moved from ${application.stage.name} to ${newStage.name}`
          : `Moved to ${newStage.name}`,
        stageId: newStage.id,
        metadata: {
          oldStageId: application.stageId,
          oldStageName: application.stage?.name,
          newStageId: newStage.id,
          newStageName: newStage.name
        }
      }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Failed to move candidate:', error);
    res.status(500).json({ error: 'Failed to move candidate' });
  }
});

// ==================== CANDIDATE NOTES ====================

// Get notes for application
router.get('/applications/:id/notes', async (req, res) => {
  try {
    const notes = await prisma.candidateNote.findMany({
      where: { applicationId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notes);
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create note
router.post('/applications/:id/notes', async (req, res) => {
  try {
    const { content, authorId, mentions, isInternal, attachments } = req.body;
    
    const note = await prisma.candidateNote.create({
      data: {
        applicationId: req.params.id,
        authorId,
        content,
        mentions: mentions || [],
        isInternal: isInternal !== false,
        attachments: attachments || null
      }
    });
    
    // Update last activity
    await prisma.application.update({
      where: { id: req.params.id },
      data: { lastActivityAt: new Date() }
    });
    
    // Create activity
    await prisma.candidateActivity.create({
      data: {
        applicationId: req.params.id,
        activityType: 'note_added',
        userId: authorId,
        title: 'Note added',
        description: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    });
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Failed to create note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.patch('/notes/:id', async (req, res) => {
  try {
    const { content } = req.body;
    
    const note = await prisma.candidateNote.update({
      where: { id: req.params.id },
      data: { content }
    });
    
    res.json(note);
  } catch (error) {
    console.error('Failed to update note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/notes/:id', async (req, res) => {
  try {
    await prisma.candidateNote.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Failed to delete note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ==================== CANDIDATE TAGS ====================

// Get tags for application
router.get('/applications/:id/tags', async (req, res) => {
  try {
    const tags = await prisma.candidateTag.findMany({
      where: { applicationId: req.params.id },
      orderBy: { addedAt: 'desc' }
    });
    res.json(tags);
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Add tag
router.post('/applications/:id/tags', async (req, res) => {
  try {
    const { name, color, category, addedById } = req.body;
    
    const tag = await prisma.candidateTag.create({
      data: {
        applicationId: req.params.id,
        name,
        color: color || '#10B981',
        category: category || 'custom',
        addedById
      }
    });
    
    // Update quick tags array
    await prisma.application.update({
      where: { id: req.params.id },
      data: {
        tags: { push: name },
        lastActivityAt: new Date()
      }
    });
    
    res.status(201).json(tag);
  } catch (error) {
    console.error('Failed to add tag:', error);
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// Remove tag
router.delete('/tags/:id', async (req, res) => {
  try {
    const tag = await prisma.candidateTag.findUnique({
      where: { id: req.params.id }
    });
    
    if (tag) {
      // Remove from quick tags array
      const application = await prisma.application.findUnique({
        where: { id: tag.applicationId },
        select: { tags: true }
      });
      
      if (application) {
        await prisma.application.update({
          where: { id: tag.applicationId },
          data: {
            tags: application.tags.filter(t => t !== tag.name)
          }
        });
      }
      
      await prisma.candidateTag.delete({
        where: { id: req.params.id }
      });
    }
    
    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Failed to remove tag:', error);
    res.status(500).json({ error: 'Failed to remove tag' });
  }
});

// ==================== ACTIVITY TIMELINE ====================

// Get activity timeline for application
router.get('/applications/:id/activity', async (req, res) => {
  try {
    const activities = await prisma.candidateActivity.findMany({
      where: { applicationId: req.params.id },
      include: { stage: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(activities);
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// ==================== TALENT POOL ====================

// Add to talent pool
router.post('/applications/:id/talent-pool', async (req, res) => {
  try {
    const { poolName, tags, notes, rating, availableFrom, addedById } = req.body;
    
    const entry = await prisma.talentPoolEntry.create({
      data: {
        applicationId: req.params.id,
        poolName: poolName || 'general',
        tags: tags || [],
        notes,
        rating,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        addedById
      }
    });
    
    // Create activity
    await prisma.candidateActivity.create({
      data: {
        applicationId: req.params.id,
        activityType: 'talent_pool_added',
        userId: addedById,
        title: 'Added to talent pool',
        description: `Added to ${poolName || 'general'} talent pool`
      }
    });
    
    res.status(201).json(entry);
  } catch (error) {
    console.error('Failed to add to talent pool:', error);
    res.status(500).json({ error: 'Failed to add to talent pool' });
  }
});

// Get talent pool entries
router.get('/talent-pool', async (req, res) => {
  try {
    const { poolName, rating, search } = req.query;
    
    const where: any = {};
    if (poolName) where.poolName = poolName;
    if (rating) where.rating = { gte: parseInt(rating as string) };
    
    const entries = await prisma.talentPoolEntry.findMany({
      where,
      include: {
        application: {
          include: {
            job: true
          }
        }
      },
      orderBy: { addedAt: 'desc' }
    });
    
    res.json(entries);
  } catch (error) {
    console.error('Failed to fetch talent pool:', error);
    res.status(500).json({ error: 'Failed to fetch talent pool' });
  }
});

// ==================== KANBAN VIEW DATA ====================

// Get pipeline board data (for Kanban view)
router.get('/board/:pipelineId', async (req, res) => {
  try {
    const { jobId } = req.query;
    
    const pipeline = await prisma.pipeline.findUnique({
      where: { id: req.params.pipelineId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            applications: {
              where: jobId ? { jobId: jobId as string } : {},
              include: {
                job: true
              },
              orderBy: { lastActivityAt: 'desc' }
            }
          }
        }
      }
    });
    
    if (!pipeline) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }
    
    res.json(pipeline);
  } catch (error) {
    console.error('Failed to fetch board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

export default router;
