import {registerUser,findUserByEmail} from '../models/users.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const signup = async(req,res) => {
    try{
        const {email,password_hash,full_name,gender,phone,verification_status}=req.body;
        const existingUser = await findUserByEmail(email);
        if(existingUser){
            return res.status(400).json({error:'User already exits'});
        }

        const iiitnEmailRegex = /^[a-zA-Z0-9._%+-]+@iiitn\.ac\.in$/;
        if (!iiitnEmailRegex.test(email)) {
            return res.status(400).json({
                error: "Only IIITN institutional email addresses are allowed"
            });
        }

        const emailPrefix = email.split("@")[0];

        let assignedRole = "student";
        if (emailPrefix.startsWith("bt")) {
            assignedRole = "student";
        }

        const hashedPassword = await bcrypt.hash(password_hash,10);

        const newUser = await registerUser(
            email,
            hashedPassword,
            full_name,
            gender,
            phone,
            verification_status,
            assignedRole);

        res.status(201).json({
            message:'User registered successfully',
            user:newUser,
        });
    }
    catch(err){
        res.status(500).json({err:err.message});
    }
};

const login = async(req,res)=>{
    try{
        const {email,password_hash} = req.body;
        const user = await findUserByEmail(email);
        if(!user){
            return res.status(401).json({message:"already existed"});
        }

        const matched = await bcrypt.compare(password_hash,user.password_hash);

        if(!matched){
            return res.status(401).json({message:"password is not matched"});
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message:"User login successfull",
            token,
            user: {
                id: user.user_id,
                name: user.full_name,
                email: user.email,
                role: user.role,
            },
        })
    }catch(err){
        res.status(500).json({message:err.message});
    }
};

export {signup,login};