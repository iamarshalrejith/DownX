import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createSimplifiedTask,
  resetTaskState,
} from "../features/task/taskSlice.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

const CreateTaskPage = () => {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [originalInstructions, setOriginalInstructions] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { loading, success, error } = useSelector((state) => state.task);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const taskData = {
      title,
      description,
      steps: steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      originalInstructions,
    };

    dispatch(createSimplifiedTask({ taskData, token: user?.token }));
  };

  // Handle success
  useEffect(() => {
    if (success) {
      toast.success("Task created successfully!");
      dispatch(resetTaskState());
      navigate("/dashboard/tasks");
    }
  }, [success, navigate, dispatch]);

  // Handle error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md relative">
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/tasks")}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex items-center space-x-1"
        type="button"
      >
        <FiArrowLeft size={20} />
        <span>Back</span>
      </button>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Create New Task
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Original Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original Instructions <span className="text-red-500">*</span>
          </label>
          <textarea
            value={originalInstructions}
            onChange={(e) => setOriginalInstructions(e.target.value)}
            placeholder="Enter full task instructions for AI processing"
            className="w-full border border-gray-300 rounded-md p-2 h-32 focus:ring focus:ring-blue-300 outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Steps (one per line)
          </label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Write each step on a new line"
            className="w-full border border-gray-300 rounded-md p-2 h-32 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-all"
        >
          {loading ? "Creating..." : "Create Task"}
        </button>

        {/* Error Message */}
        {error && (
          <p className="text-red-600 text-center text-sm font-medium mt-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default CreateTaskPage;
