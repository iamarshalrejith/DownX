import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

//Register a new User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user
    const newUser = new User({
      name: name,
      email: email,
      password: hashedPassword,
      role: role,
      studentId: studentId || null,
    });

    // save user to db
    const savedUser = await newUser.save();

    // respond with user data
    const { password: _, ...userdata } = savedUser._doc;
    const token = generateToken(savedUser._id)
    res.status(201).json({...userdata,token});
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// login user
export const loginUser = async (req,res) => {
    try{
        const { email, password } = req.body;

        //find user
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message: "Invalid email or password"});
        }

        // compare password
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const {password: _, ...userdata} = user._doc;
        const token = generateToken(user._id)
        return res.status(200).json({...userdata,token});
    }catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}