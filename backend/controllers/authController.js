const bcrypt = require("bcryptjs");
const prisma = require("../config/database");
const generateToken = require("../utils/jwt");

// Register User
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            }
        });

        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: "Registration Successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Login User
exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: "Login Successful",
            token
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};