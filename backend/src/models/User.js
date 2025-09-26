import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name:{
            type: String,
            required: true,
        },
        email:{
            type: String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        password: {
            type: String,
            required:true,
        },
        role:{
            type: String,
            enum: ["teacher","parent","student"],
            required: true,
        },
        studentId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("User",userSchema);

export default User;