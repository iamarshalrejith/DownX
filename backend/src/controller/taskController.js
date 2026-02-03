import Task from "../models/Task.js";

export const getAllTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "teacher") {
      // Teachers see tasks they created
      tasks = await Task.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .populate("owner", "name")
        .populate("assignedTo", "name")
        .populate("completedBy.studentId", "name");
    } else if (req.user.role === "student") {
      // Students see tasks assigned to them or all students
      tasks = await Task.find({
        $or: [{ assignedTo: req.user._id }, { assignedToAll: true }],
      })
        .sort({ createdAt: -1 })
        .populate("owner", "name")
        .populate("assignedTo", "name")
        .populate("completedBy.studentId", "name");

      // Add isCompletedByMe flag for frontend
      tasks = tasks.map((task) => {
        const taskObj = task.toObject();
        taskObj.isCompletedByMe = task.completedBy.some(
          (c) => c.studentId._id.toString() === req.user._id.toString()
        );
        return taskObj;
      });
    } else if (req.user.role === "parent") {
      // Parents see tasks assigned to their children
      const User = (await import("../models/User.js")).default;
      const parent = await User.findById(req.user._id).select("studentIds");

      if (!parent || !parent.studentIds || parent.studentIds.length === 0) {
        return res.status(200).json([]); // Return empty array if no children linked
      }

      tasks = await Task.find({
        $or: [
          { assignedTo: { $in: parent.studentIds } }, // Tasks assigned to any of their children
          { assignedToAll: true }, // Tasks assigned to all students
        ],
      })
        .sort({ createdAt: -1 })
        .populate("owner", "name")
        .populate("assignedTo", "name")
        .populate("completedBy.studentId", "name");
    } else {
      return res.status(403).json({ message: "Invalid user role" });
    }

    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error in getAllTasks controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("owner", "name")
      .populate("assignedTo", "name")
      .populate("completedBy.studentId", "name");

    if (!task) return res.status(404).json({ message: "Task Not Found" });

    // Authorization check
    const isOwner = task.owner._id.equals(req.user._id);
    const isAssignedStudent =
      req.user.role === "student" &&
      (task.assignedTo?._id.equals(req.user._id) || task.assignedToAll);

    // Check if parent has access (if task is assigned to their child)
    let isParentOfAssignedStudent = false;
    if (req.user.role === "parent") {
      const User = (await import("../models/User.js")).default;
      const parent = await User.findById(req.user._id).select("studentIds");

      if (parent && parent.studentIds) {
        isParentOfAssignedStudent =
          task.assignedToAll ||
          (task.assignedTo &&
            parent.studentIds.some((id) => id.equals(task.assignedTo._id)));
      }
    }

    if (!isOwner && !isAssignedStudent && !isParentOfAssignedStudent) {
      return res
        .status(403)
        .json({ message: "You don't have access to this task" });
    }

    // Add isCompletedByMe flag for students
    const taskObj = task.toObject();
    if (req.user.role === "student") {
      taskObj.isCompletedByMe = task.completedBy.some(
        (c) => c.studentId._id.toString() === req.user._id.toString()
      );
    }

    return res.status(200).json(taskObj);
  } catch (error) {
    console.error("Error in getTaskById controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTask = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can create tasks" });
    }

    const {
      title,
      description,
      steps,
      simplifiedSteps,
      originalInstructions,
      assignedTo,
      assignedToAll,
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!assignedTo && !assignedToAll) {
      return res.status(400).json({
        message: "You must assign the task to a student or to all students",
      });
    }

    if (assignedTo && assignedToAll) {
      return res.status(400).json({
        message: "You cannot assign to both a student and all students",
      });
    }

    const task = new Task({
      title,
      description,
      steps,
      simplifiedSteps,
      originalInstructions,
      owner: req.user._id,
      assignedTo: assignedToAll ? null : assignedTo,
      assignedToAll,
      completedBy: [], // Initialize empty
    });

    const savedTask = await task.save();
    return res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTask controller:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can update tasks" });
    }

    const { title, description, steps } = req.body;
    if (!title && !description && !steps) {
      return res
        .status(400)
        .json({ message: "At least one field is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this task" });
    }

    if (title) task.title = title;
    if (description) task.description = description;
    if (steps) task.steps = steps;

    const updatedTask = await task.save();
    return res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error in updateTask controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Only teachers can delete tasks" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!task.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this task" });
    }

    await task.deleteOne();
    return res.status(200).json({ message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteTask controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can mark tasks as completed" });
    }

    // Check if task is assigned to this student
    const isAssigned =
      task.assignedToAll ||
      (task.assignedTo && task.assignedTo.equals(req.user._id));

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "You are not allowed to complete this task" });
    }

    // Check if already completed by this student
    const alreadyCompleted = task.completedBy.some(
      (c) => c.studentId.toString() === req.user._id.toString()
    );

    if (alreadyCompleted) {
      return res
        .status(400)
        .json({ message: "You have already completed this task" });
    }

    // Add student to completedBy array
    task.completedBy.push({
      studentId: req.user._id,
      completedAt: new Date(),
    });

    // For backward compatibility: if assignedTo specific student, set isCompleted
    if (task.assignedTo && !task.assignedToAll) {
      task.isCompleted = true;
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      message: "Task marked as completed",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error in completeTask controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const uncompleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can undo completion" });
    }

    const isAssigned =
      task.assignedToAll ||
      (task.assignedTo && task.assignedTo.equals(req.user._id));

    if (!isAssigned) {
      return res.status(403).json({ message: "You cannot undo this task" });
    }

    // Remove student from completedBy array
    task.completedBy = task.completedBy.filter(
      (c) => c.studentId.toString() !== req.user._id.toString()
    );

    // For backward compatibility
    if (task.assignedTo && !task.assignedToAll) {
      task.isCompleted = false;
    }

    const updatedTask = await task.save();

    return res.status(200).json({
      message: "Task reverted to active",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Error in uncompleteTask controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
