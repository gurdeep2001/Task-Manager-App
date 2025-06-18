const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for sub-tasks
taskSchema.virtual('subTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask'
});

// Virtual for progress percentage
taskSchema.virtual('progressPercentage').get(function() {
  if (this.status === 'Done') return 100;
  if (this.status === 'In Progress') return 50;
  return 0;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Done') return false;
  return new Date() > this.dueDate;
});

// Indexes for better query performance
taskSchema.index({ project: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ 'tags': 1 });

// Prevent circular references in parent-child relationships
taskSchema.pre('save', async function(next) {
  if (this.isModified('parentTask') && this.parentTask) {
    // Check if parent task exists and belongs to the same project
    const parentTask = await this.constructor.findOne({
      _id: this.parentTask,
      project: this.project
    });

    if (!parentTask) {
      throw new Error('Parent task not found or does not belong to this project');
    }

    // Check for circular references
    let currentParent = parentTask;
    while (currentParent) {
      if (currentParent._id.equals(this._id)) {
        throw new Error('Circular reference detected in task hierarchy');
      }
      currentParent = await this.constructor.findById(currentParent.parentTask);
    }
  }
  next();
});

// Cascade delete sub-tasks
taskSchema.pre('remove', async function(next) {
  await this.constructor.deleteMany({ parentTask: this._id });
  next();
});

// Update parent task progress when sub-tasks change
taskSchema.post('save', async function() {
  if (this.parentTask) {
    const parentTask = await this.constructor.findById(this.parentTask);
    if (parentTask) {
      const subTasks = await this.constructor.find({ parentTask: this.parentTask });
      const completedSubTasks = subTasks.filter(task => task.status === 'Done').length;
      const totalSubTasks = subTasks.length;
      
      // Update parent task status based on sub-tasks
      if (totalSubTasks > 0) {
        if (completedSubTasks === totalSubTasks) {
          parentTask.status = 'Done';
        } else if (completedSubTasks > 0) {
          parentTask.status = 'In Progress';
        } else {
          parentTask.status = 'To Do';
        }
        await parentTask.save();
      }
    }
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 