require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    console.log("Connected. Verifying all existing users...");
    await User.updateMany({}, { $set: { isEmailVerified: true } });
    console.log("Done! All users are now verified.");
    process.exit(0);
});
