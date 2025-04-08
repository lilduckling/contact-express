const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// For testing, reduce these numbers temporarily
const TOTAL_CONTACTS = 100000;
const TOTAL_MESSAGES = 5000000;
const BATCH_SIZE = 1000;

async function seedContacts() {
    console.log("Seeding contacts...");
    const client = await pool.connect();
    const usedPhones = new Set();
  
    try {
      await client.query('BEGIN');
  
      for (let i = 0; i < TOTAL_CONTACTS; i += BATCH_SIZE) {
        const values = [];
        let count = 0;
  
        while (count < BATCH_SIZE && (i + count) < TOTAL_CONTACTS) {
          const name = faker.person.fullName().replace(/'/g, "''");
          let phone;
  
          // Keep generating until we get a unique phone number
          do {
            phone = faker.phone.number('+65 8### ####').replace(/'/g, "''");
          } while (usedPhones.has(phone));
  
          usedPhones.add(phone);
          values.push(`('${name}', '${phone}')`);
          count++;
        }
  
        const query = `
          INSERT INTO contacts (name, phone_number)
          VALUES ${values.join(',')}
        `;
        await client.query(query);
        console.log(`Inserted ${i + count} contacts`);
      }
  
      await client.query('COMMIT');
      console.log("Contacts seeding complete.");
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error inserting contacts:", err);
      throw err;
    } finally {
      client.release();
    }
}
  

const readline = require('readline');

function loadMessageContent() {
  return new Promise((resolve, reject) => {
    const messages = [];

    const rl = readline.createInterface({
      input: fs.createReadStream(path.join(__dirname, '../data/message_content.csv')),
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const content = line.trim().replace(/'/g, "''");
      if (content) messages.push(content);
    });

    rl.on('close', () => {
      console.log(`Loaded ${messages.length} message templates`);
      resolve(messages);
    });

    rl.on('error', reject);
  });
}

  
async function seedMessages(messageTemplates) {
  console.log("Seeding messages...");
  const client = await pool.connect();

  try {
    const res = await client.query('SELECT id FROM contacts');
    const contactIds = res.rows.map(row => row.id);
    const numTemplates = messageTemplates.length;

    await client.query('BEGIN');

    for (let i = 0; i < TOTAL_MESSAGES; i += BATCH_SIZE) {
      const values = [];

      for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_MESSAGES; j++) {
        const contactId = contactIds[Math.floor(Math.random() * contactIds.length)];
        const content = messageTemplates[Math.floor(Math.random() * numTemplates)];
        const timestamp = faker.date.recent({ days: 30 }).toISOString();

        values.push(`(${contactId}, '${content}', '${timestamp}')`);
      }

      const query = `
        INSERT INTO messages (contact_id, content, timestamp)
        VALUES ${values.join(',')}
      `;
      await client.query(query);
      if ((i + BATCH_SIZE) % 100000 === 0) console.log(`Inserted ${i + BATCH_SIZE} messages`);
    }

    await client.query('COMMIT');
    console.log("Messages seeding complete.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error inserting messages:", err);
    throw err;
  } finally {
    client.release();
  }
}

(async () => {
  try {
    await seedContacts();
    const messages = await loadMessageContent();
    await seedMessages(messages);
    console.log("Database seeding done.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
