export const simplifyInstruction = async(req,res) => {
    try{
        //dummy response
        res.json({
            success: true,
            message: "Simplification feature coming soon!",
            simplifiedText: "This is a placeholder simplified response."
        })
    }
    catch(error){
        console.error("AI Simplification Error",error);
        res.status(500).json({success: false,error:"Server Error"})
    }
}