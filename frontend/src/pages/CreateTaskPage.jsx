import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createSimplifiedTask,
  resetTaskState,
} from "../features/task/taskSlice.js";
import { getStudents } from "../features/student/studentSlice.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";

// Common COCO-SSD detectable objects teachers might use
const SUGGESTED_OBJECTS = [
  "cup",
  "bottle",
  "bowl",
  "book",
  "chair",
  "table",
  "laptop",
  "phone",
  "scissors",
  "pen",
  "pencil",
  "backpack",
  "clock",
];

const CreateTaskPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");
  const [originalInstructions, setOriginalInstructions] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToAll, setAssignedToAll] = useState(false);

  // Object verification state
  const [objectVerifyEnabled, setObjectVerifyEnabled] = useState(false);
  const [requiredObjects, setRequiredObjects] = useState([]);
  const [objectInput, setObjectInput] = useState("");
  const [verificationInstruction, setVerificationInstruction] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { loading, success, error } = useSelector((state) => state.task);
  const { myStudents = [] } = useSelector((state) => state.students || {});

  useEffect(() => {
    if (user?.token && user?.role === "teacher") dispatch(getStudents());
  }, [dispatch, user?.token, user?.role]);

  // Add required object
  const addObject = (label) => {
    const clean = label.trim().toLowerCase();
    if (!clean) return;
    if (requiredObjects.includes(clean)) {
      toast("Already added!", { icon: "ℹ️" });
      return;
    }
    setRequiredObjects((prev) => [...prev, clean]);
    setObjectInput("");
  };

  const removeObject = (label) => {
    setRequiredObjects((prev) => prev.filter((o) => o !== label));
  };

  // Submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!assignedTo && !assignedToAll) {
      toast.error(
        "Please assign the task to a student or select 'All Students'",
      );
      return;
    }
    if (objectVerifyEnabled && requiredObjects.length === 0) {
      toast.error(
        "Add at least one required object, or disable object verification",
      );
      return;
    }

    const taskData = {
      title,
      description,
      steps: steps
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      originalInstructions,
      assignedTo: assignedToAll ? null : assignedTo,
      assignedToAll,
      objectVerification: {
        enabled: objectVerifyEnabled,
        requiredObjects: objectVerifyEnabled ? requiredObjects : [],
        verificationInstruction: objectVerifyEnabled
          ? verificationInstruction
          : "",
      },
    };

    dispatch(createSimplifiedTask({ taskData, token: user?.token }));
  };

  useEffect(() => {
    if (success) {
      toast.success("Task created successfully!");
      dispatch(resetTaskState());
      navigate("/dashboard/tasks");
    }
  }, [success, navigate, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-md relative">
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/tasks")}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex items-center gap-1"
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
            placeholder="Enter full task instructions — AI will simplify these for the student"
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
            placeholder="Short description shown on the task card"
            className="w-full border border-gray-300 rounded-md p-2 h-20 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Steps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Manual Steps (one per line, optional)
          </label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder="Write each step on a new line"
            className="w-full border border-gray-300 rounded-md p-2 h-24 focus:ring focus:ring-blue-300 outline-none"
          />
        </div>

        {/* Assign to */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assign To
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            disabled={assignedToAll}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300 outline-none disabled:bg-gray-100"
          >
            <option value="">-- Select a Student --</option>
            {myStudents.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assign to all */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="assignAll"
            checked={assignedToAll}
            onChange={(e) => setAssignedToAll(e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <label htmlFor="assignAll" className="text-gray-700 text-sm">
            Assign to All Students
          </label>
        </div>

        {/* Object Verification Section */}
        <div className="border border-purple-200 rounded-xl p-4 bg-purple-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-purple-800 text-sm">
                Object Verification
              </h3>
              <p className="text-xs text-purple-600 mt-0.5">
                Student must show required objects to their camera to verify the
                task
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={objectVerifyEnabled}
                onChange={(e) => setObjectVerifyEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>

          {objectVerifyEnabled && (
            <div className="space-y-3 mt-3">
              {/* Verification instruction */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Instruction shown to student
                </label>
                <input
                  type="text"
                  value={verificationInstruction}
                  onChange={(e) => setVerificationInstruction(e.target.value)}
                  placeholder='e.g. "Show the cup on the table to your camera"'
                  className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-purple-300 outline-none"
                />
              </div>

              {/* Add object input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Required objects (what the student must show)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={objectInput}
                    onChange={(e) => setObjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addObject(objectInput);
                      }
                    }}
                    placeholder="Type an object label…"
                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-purple-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => addObject(objectInput)}
                    className="bg-purple-600 text-white px-3 rounded-md hover:bg-purple-700 transition"
                  >
                    <FiPlus size={18} />
                  </button>
                </div>
              </div>

              {/* Suggested objects */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_OBJECTS.filter(
                    (o) => !requiredObjects.includes(o),
                  ).map((obj) => (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => addObject(obj)}
                      className="text-xs bg-white border border-purple-300 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-100 transition"
                    >
                      + {obj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Required objects list */}
              {requiredObjects.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">
                    Required ({requiredObjects.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredObjects.map((obj) => (
                      <span
                        key={obj}
                        className="flex items-center gap-1 bg-purple-600 text-white text-xs px-3 py-1 rounded-full"
                      >
                        {obj}
                        <button
                          type="button"
                          onClick={() => removeObject(obj)}
                          className="hover:text-red-200 transition ml-0.5"
                        >
                          <FiX size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-all font-semibold"
        >
          {loading ? "Creating…" : "Create Task"}
        </button>

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
