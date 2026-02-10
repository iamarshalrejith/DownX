import mongoose from "mongoose";

const gestureEventSchema = new mongoose.Schema({
    studentId : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    enrollmentId: {
        type: String,
        required: true,
    },
    gestureType: {
        type: String,
        enum: ["raised_hand","thumbs_up","thumbs_down","peace_sign"],
        required: true,
    },
    confidence:{
        type: Number,
        min: 0,
        max: 1,
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
    },
    context:{
        currentStep: Number,
        timeSpentOnTask: Number,
        studentNote:String,
    },
    teacherNotified:{
        type:Boolean,
        default: false,
    },
    teacherResponse: {
        respondedAt: Date,
        responseNote: String,
    },
    resolved: {
        type: Boolean,
        default: false,
    }
},{
    timestamps: true
});

gestureEventSchema.index({studentId:1,createdAt:-1});
gestureEventSchema.index({teacherNotified:1,resolved:1});

export default mongoose.model("GestureEvent",gestureEventSchema)