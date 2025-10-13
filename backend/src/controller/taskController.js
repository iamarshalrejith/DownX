import Task from "../models/Task.js";

export const getAllTasks = async (req, res) => {
  try {
    let tasks;

    // If user is a teacher, show tasks they created
    if (req.user.role === "teacher") {
      tasks = await Task.find({ owner: req.user._id })
        .sort({ createdAt: -1 })
        .populate("owner", "name")
        .populate("assignedTo", "name");
    }
    // If user is a student, show only tasks assigned to them or all students
    else if (req.user.role === "student") {
      tasks = await Task.find({
        $or: [
          { assignedTo: req.user._id }, // Tasks assigned specifically to this student
          { assignedToAll: true }, // Tasks assigned to all students
        ],
      })
        .sort({ createdAt: -1 })
        .populate("owner", "name")
        .populate("assignedTo", "name");
    } else {
      return res.status(403).json({ message: "Invalid user role" });
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error in getAllTasks controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("owner", "name")
      .populate("assignedTo", "name");

    if (!task) return res.status(404).json({ message: "Task Not Found" });

    // Authorization check
    const isOwner = task.owner._id.equals(req.user._id);
    const isAssignedStudent =
      req.user.role === "student" &&
      (task.assignedTo?._id.equals(req.user._id) || task.assignedToAll);

    if (!isOwner && !isAssignedStudent) {
      return res
        .status(403)
        .json({ message: "You don't have access to this task" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Error in getTaskById controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTask = async (req, res) => {
  try {
    // Only teachers can create tasks
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

    // Basic validation
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!assignedTo && !assignedToAll) {
      return res.status(400).json({
        message: "You must assign the task to a student or to all student",
      });
    }

    if (assignedTo && assignedToAll) {
      return res.status(400).json({
        message: "You cannot assign to both a student and all students",
      });
    }
    // Create the task
    const task = new Task({
      title,
      description,
      steps,
      simplifiedSteps,
      originalInstructions,
      owner: req.user._id,
      assignedTo: assignedToAll ? null : assignedTo,
      assignedToAll,
    });

    const savedTask = await task.save();

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTask controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

    // Check if the authenticated user is the owner
    if (!task.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to update this task" });
    }

    // Update only the provided fields
    if (title) task.title = title;
    if (description) task.description = description;
    if (steps) task.steps = steps;

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error in updateTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
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

    // Check if the authenticated user is the owner
    if (!task.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete this task" });
    }

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check access -> Students can only complete tasks assigned to them or to all students
    // Teachers can't mark completion
    if (req.user.role === "student") {
      const isAssigned =
        task.assignedToAll ||
        (task.assignedTo && task.assignedTo.equals(req.user._id));

      if (!isAssigned) {
        return res
          .status(403)
          .json({ message: "You are not allowed to complete this task" });
      }
    } else {
      return res
        .status(403)
        .json({ message: "Only students can mark tasks as completed" });
    }

    // mark as complete
    task.isCompleted = true;
    const updatedTask = await task.save();

    res
      .status(200)
      .json({ message: "Task marked as completed", task: updatedTask });
  } catch (error) {
    console.error("Error in completeTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const uncompleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can undo completion" });
    }

    // Check ownership
    const isAssigned =
      task.assignedToAll ||
      (task.assignedTo && task.assignedTo.equals(req.user._id));

    if (!isAssigned) {
      return res.status(403).json({ message: "You cannot undo this task" });
    }

    task.isCompleted = false;
    const updatedTask = await task.save();

    res.status(200).json({ message: "Task reverted to active", task: updatedTask });
  } catch (error) {
    console.error("Error in uncompleteTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
