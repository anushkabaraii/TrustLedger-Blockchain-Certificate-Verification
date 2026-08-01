const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const path = require("path");

const file = path.join(__dirname, "db.json");

const adapter = new JSONFile(file);

const db = new Low(adapter, {
  certificates: [],
});

async function connectDB() {
  await db.read();

  db.data ||= {
    certificates: [],
  };

  await db.write();
}

async function saveDB() {
  await db.write();
}

module.exports = {
  db,
  connectDB,
  saveDB,
};