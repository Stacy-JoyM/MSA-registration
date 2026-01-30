const provider = (process.env.DB_PROVIDER || 'postgres').toLowerCase();

let adapter;
if (provider === 'postgres') {
    adapter = require('./postgres_applications');
} else if (provider === 'firestore') {
    adapter = require('./firestore_applications');
} else {
    throw new Error(`Unsupported DB_PROVIDER: ${provider}`);
}

module.exports = adapter;
