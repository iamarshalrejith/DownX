import Task from "../models/Task.js";

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .populate("owner", "name");
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error in getAllTasks controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("owner", "name");
    if (!task) return res.status(404).json({ message: "Task Not Found" });
    res.status(200).json(task);
  } catch (error) {
    console.error("Error in getTaskById controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createTask = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can create tasks" });
    }
    const { title, description, steps } = req.body;

    //validate
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({
      title,
      description,
      steps,
      owner:req.user._id,
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can update tasks" });
    }
    const { title, description, steps } = req.body;
    if (!title && !description && !steps) {
      return res.status(400).json({ message: "At least one field is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if the authenticated user is the owner
    if (!task.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to update this task" });
    }

    // Update only the provided fields
    if(title) task.title = title;
    if(description) task.description = description;
    if(steps) task.steps = steps;

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
      return res.status(403).json({ message: "Only teachers can delete tasks" });
    }
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if the authenticated user is the owner
    if (!task.owner.equals(req.user._id)) {
      return res.status(403).json({ message: "You are not allowed to delete this task" });
    }

    await task.deleteOne();
    res.status(200).json({ message: "Task deleted successfully!" });

  } catch (error) {
    console.error("Error in deleteTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

