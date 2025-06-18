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
  dueDate: {
    type: Date
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
  }
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

// Indexes
taskSchema.index({ project: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ project: 1, order: 1 });

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

const Task = mongoose.model('Task', taskSchema);

module.exports = Task; 