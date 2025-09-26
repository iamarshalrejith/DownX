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
    const { title, description, steps, owner } = req.body;

    //validate
    if (!title || !owner) {
      return res.status(400).json({ message: "Title and Owner are required" });
    }

    const task = new Task({
      title,
      description,
      steps,
      owner,
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
    const { title, description, steps } = req.body;
    if (!title && !description && !steps) {
      return res
        .status(400)
        .json({ message: "At least one field is required" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title: title, description: description, steps: steps },
      {
        new: true,
      }
    );
    if (!updatedTask)
      return res.status(404).json({ message: "Task not Found" });
    res.status(200).json(updatedTask)
  } catch (error) {
    console.error("Error in updateTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if(!deletedTask){
      return res.status(404).json({message:"Task not found"});
    }
    res.status(200).json({message: "Task deleted successfully!"})
  } catch (error) {
    console.error("Error in deleteTask controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
