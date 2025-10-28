const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Local MongoDB connection
const localUri = 'mongodb://localhost:27017/ca-website';

// Atlas MongoDB connection
const atlasUri = process.env.MONGO_URI || 'mongodb+srv://prachig0305_db_user:x2FADtxJtZgpWd2X@cluster0.qnv5gv0.mongodb.net/ca-website';

// Models
const TeamMember = require('./models/TeamMember');
const User = require('./models/User');
const Blog = require('./models/Blog');
const Content = require('./models/Content');
const Query = require('./models/Query');
const Task = require('./models/Task');
const Timesheet = require('./models/Timesheet');
const Application = require('./models/Application');

async function migrateData() {
  try {
    console.log('Connecting to local MongoDB...');
    const localConn = await mongoose.createConnection(localUri);
    console.log('Connected to local MongoDB');

    console.log('Connecting to Atlas MongoDB...');
    const atlasConn = await mongoose.createConnection(atlasUri);
    console.log('Connected to Atlas MongoDB');

    // Get all collections
    const collections = [
      { name: 'TeamMember', localModel: localConn.model('TeamMember', TeamMember.schema), atlasModel: atlasConn.model('TeamMember', TeamMember.schema) },
      { name: 'User', localModel: localConn.model('User', User.schema), atlasModel: atlasConn.model('User', User.schema) },
      { name: 'Blog', localModel: localConn.model('Blog', Blog.schema), atlasModel: atlasConn.model('Blog', Blog.schema) },
      { name: 'Content', localModel: localConn.model('Content', Content.schema), atlasModel: atlasConn.model('Content', Content.schema) },
      { name: 'Query', localModel: localConn.model('Query', Query.schema), atlasModel: atlasConn.model('Query', Query.schema) },
      { name: 'Task', localModel: localConn.model('Task', Task.schema), atlasModel: atlasConn.model('Task', Task.schema) },
      { name: 'Timesheet', localModel: localConn.model('Timesheet', Timesheet.schema), atlasModel: atlasConn.model('Timesheet', Timesheet.schema) },
      { name: 'Application', localModel: localConn.model('Application', Application.schema), atlasModel: atlasConn.model('Application', Application.schema) }
    ];

    for (const collection of collections) {
      console.log(`Migrating ${collection.name}...`);

      // Get all documents from local
      const documents = await collection.localModel.find({});
      console.log(`Found ${documents.length} ${collection.name} documents`);

      if (documents.length > 0) {
        // Clear existing data in Atlas
        await collection.atlasModel.deleteMany({});

        // For Task collection, fix invalid status values
        let processedDocuments = documents;
        if (collection.name === 'Task') {
          processedDocuments = documents.map(doc => {
            const docObj = doc.toObject();
            // Map invalid status values to valid ones
            if (docObj.status === 'pending') {
              docObj.status = 'assigned';
            }
            // Add any other status mappings if needed
            return docObj;
          });
        }

        // Insert documents to Atlas
        await collection.atlasModel.insertMany(processedDocuments);
        console.log(`Migrated ${processedDocuments.length} ${collection.name} documents`);
      }
    }

    console.log('Migration completed successfully!');

    // Close connections
    await localConn.close();
    await atlasConn.close();

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrateData();
