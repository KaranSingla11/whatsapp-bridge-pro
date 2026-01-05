// Auto-reply rules storage
const fs = require('fs');
const path = require('path');

const AUTO_REPLY_FILE = './auto_replies.json';

function generateId() {
  return 'ar_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
}

class AutoReplyManager {
  constructor() {
    this.rules = [];
    this.load();
  }

  load() {
    if (fs.existsSync(AUTO_REPLY_FILE)) {
      try {
        const data = fs.readFileSync(AUTO_REPLY_FILE, 'utf-8');
        this.rules = JSON.parse(data);
      } catch (err) {
        console.error('Error loading auto-reply rules:', err);
        this.rules = [];
      }
    }
  }

  save() {
    fs.writeFileSync(AUTO_REPLY_FILE, JSON.stringify(this.rules, null, 2));
  }

  addRule(rule) {
    rule.id = generateId();
    this.rules.push(rule);
    this.save();
    return rule;
  }

  updateRule(id, updates) {
    const index = this.rules.findIndex(r => r.id === id);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
      this.save();
      return this.rules[index];
    }
    return null;
  }

  deleteRule(id) {
    this.rules = this.rules.filter(r => r.id !== id);
    this.save();
    return true;
  }

  getByInstance(instanceId) {
    return this.rules.filter(r => r.instanceId === instanceId && r.enabled);
  }

  getAll() {
    return this.rules;
  }

  // Check if incoming message should trigger auto-reply
  checkMatch(rule, message) {
    const triggerMsg = rule.caseSensitive ? rule.triggerMessage : rule.triggerMessage.toLowerCase();
    const incomingMsg = rule.caseSensitive ? message : message.toLowerCase();

    if (rule.matchType === 'exact') {
      return triggerMsg === incomingMsg;
    } else {
      return incomingMsg.includes(triggerMsg);
    }
  }
}

module.exports = new AutoReplyManager();
