const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, 'hostel_data.json');

// Complete Database Schema matching all specifications
const initialSchema = {
  users: [],
  outpasses: [],
  complaints: [],
  callRequests: [],
  notifications: [],
  hostels: [],
  wardens: [],
  rooms: []
};

class Database {
  constructor() {
    this.data = { ...initialSchema };
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = { ...initialSchema, ...JSON.parse(fileContent) };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database:', err);
      this.data = { ...initialSchema };
      this.save();
    }
  }

  save() {
    try {
      const tempFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DATA_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  getCollection(table) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    return this.data[table];
  }

  find(table, predicate = () => true) {
    const collection = this.getCollection(table);
    return collection.filter(predicate);
  }

  findById(table, id) {
    const collection = this.getCollection(table);
    return collection.find(item => item.id === id) || null;
  }

  findOne(table, predicate) {
    const collection = this.getCollection(table);
    return collection.find(predicate) || null;
  }

  insert(table, record) {
    const collection = this.getCollection(table);
    const newRecord = {
      id: record.id || uuidv4(),
      createdAt: new Date().toISOString(),
      ...record
    };
    collection.unshift(newRecord);
    this.save();
    return newRecord;
  }

  update(table, id, updates) {
    const collection = this.getCollection(table);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return null;

    collection[index] = {
      ...collection[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return collection[index];
  }

  remove(table, id) {
    const collection = this.getCollection(table);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;

    const removed = collection.splice(index, 1);
    this.save();
    return removed[0];
  }

  resetWith(seedData) {
    this.data = { ...initialSchema, ...seedData };
    this.save();
    return this.data;
  }
}

const db = new Database();
module.exports = db;
