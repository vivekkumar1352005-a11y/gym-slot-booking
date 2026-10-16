import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters long'],
            maxlength: [20, 'Name cannot exceed 60 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            trim: true,
            unique: [true, 'Email is already used'],
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please enter a valid email address'
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength:[6, 'Password must be at least 6 characters long'],
            select: false,
        },
        role: {
            type: String,
            enum: ['member', 'admin'],
            default: 'member',
        },

},
{
    timestamps: true,
});

//Hashing password before saving
userSchema.pre('save', async function(){
    if(!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (password) {
   return bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);