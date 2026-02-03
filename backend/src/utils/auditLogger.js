import AuditLog from "../models/AuditLog.js";

export const logAudit = async ({
  action,
  req,
  studentId,
  meta = {},
}) => {
  try {
    await AuditLog.create({
      action,
      actor: req.user
        ? { userId: req.user._id, role: req.user.role }
        : { role: "system" },
      studentId,
      meta,
    });
  } catch (err) {
    // Never block main flow because of audit failure
    console.error("Audit log failed:", err.message);
  }
};
