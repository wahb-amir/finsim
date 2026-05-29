const express = require("express");
const router = express.Router();
const Setup = require("../Models/setup");
const {authMiddleware} = require("../middleware/authMiddleware");

router.post("/setup", authMiddleware, async(req,res)=>{
    try{
        const {name, confidence, goal} = req.body;
        
        if(!name || !confidence || !goal){
            return res.status(401).json({success: false, message: "please fill all fields"});
        }

        const newSetup = new Setup({
            userId: req.user._id,
            email: req.user.email,
            name,
            confidence,
            goal
        });
        await newSetup.save();
        return res.status(200).json({success: true, message: "Setup Created Successfully"});
    } catch(err){
        return res.status(500).json({success: false, message: err.message});
    }
});

module.exports = router;