const mongoose = require('mongoose');

// Use the same URI as in db.js
const MONGO_URI = 'mongodb://localhost:27017/code-compiler';

const checkConnection = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connection Successful!');
        console.log(`Host: ${mongoose.connection.host}`);
        console.log(`Database Name: ${mongoose.connection.name}`);

        console.log('\nListing Collections:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        if (collections.length === 0) {
            console.log('No collections found (Database might be empty).');
        } else {
            collections.forEach(col => console.log(` - ${col.name}`));
        }

        console.log('\nClosing connection...');
        await mongoose.connection.close();
        console.log('Connection closed.');
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        process.exit(1);
    }
};

checkConnection();
