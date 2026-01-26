require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const clerkId = process.argv[2];
const email = process.argv[3];
const firstName = process.argv[4] || 'Admin';

if (!clerkId || !email) {
    console.error('Usage: node create_admin.js <CLERK_USER_ID> <EMAIL> [FIRST_NAME]');
    process.exit(1);
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Upsert the user: Update if exists, Create if not
        const user = await User.findOneAndUpdate(
            { email: email }, // Search by email first to be safe, or clerkId
            {
                $set: {
                    clerkId: clerkId,
                    email: email,
                    firstName: firstName,
                    role: 'admin',
                    isBanned: false
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log('------------------------------------------------');
        console.log('SUCCESS: User created/updated as ADMIN!');
        console.log('ID:', user._id);
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('------------------------------------------------');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

run();
