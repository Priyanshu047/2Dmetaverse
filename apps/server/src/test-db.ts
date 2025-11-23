import mongoose from 'mongoose';

const uri1 = 'mongodb+srv://priyanshu:priyanshu123@cluster0.bp4tn35.mongodb.net/?appName=Cluster0';
const uri2 = 'mongodb+srv://priyanshu:<priyanshu123>@cluster0.bp4tn35.mongodb.net/?appName=Cluster0';

const testConnection = async (uri: string, label: string) => {
    console.log(`\nTesting connection with ${label}...`);
    console.log(`URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`); // Mask password

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log(`✅ SUCCESS: Connected with ${label}!`);
        await mongoose.connection.close();
        return true;
    } catch (error: any) {
        console.log(`❌ FAILED: Could not connect with ${label}.`);
        console.log('Error Name:', error.name);
        console.log('Error Message:', error.message);
        if (error.reason) console.log('Error Reason:', error.reason);
        if (error.code) console.log('Error Code:', error.code);
        if (error.codeName) console.log('Error CodeName:', error.codeName);
        return false;
    }
};

const runTests = async () => {
    console.log('Starting MongoDB Connection Tests...');

    const success1 = await testConnection(uri1, 'Password WITHOUT brackets');
    if (success1) {
        console.log('\nConclusion: The password WITHOUT brackets is correct.');
        process.exit(0);
    }

    const success2 = await testConnection(uri2, 'Password WITH brackets');
    if (success2) {
        console.log('\nConclusion: The password WITH brackets is correct.');
        process.exit(0);
    }

    console.log('\nConclusion: Both attempts failed. Likely a Network/IP Whitelist issue or invalid cluster address.');
    process.exit(1);
};

runTests();
