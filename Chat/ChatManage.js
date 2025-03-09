const fs = require("fs");
const path = require("path");

class Message {
  constructor(text, sender) {
    this.text = text;
    this.sender = sender;
    this.timestamp = new Date();
  }
}

class Chat {
  constructor(name, users = []) {
    this.name = name;
    this.users = users;
    this.messages = [];
  }

  addMessage(text, sender) {
    const msg = new Message(text, sender);
    this.messages.push(msg);
  }

  toJSON() {
    return {
      type: "Chat",
      name: this.name,
      users: this.users,
      messages: this.messages,
    };
  }
}

class BrodeChat extends Chat {
  constructor(name, users = []) {
    super(name, users);
    this.type = "BrodeChat";
  }

  toJSON() {
    return {
      type: "BrodeChat",
      name: this.name,
      users: this.users,
      messages: this.messages,
    };
  }
}

class ChatManager {
  constructor(directory) {
    this.directory = directory;
    this.chats = {};
    this.loadChats();
  }

  loadChats() {
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory);
    }
    const files = fs.readdirSync(this.directory);
    files.forEach((file) => {
      const chatData = JSON.parse(
        fs.readFileSync(path.join(this.directory, file), "utf-8")
      );
      let chat;
      if (chatData.type === "BrodeChat") {
        chat = new BrodeChat(chatData.name, chatData.users);
      } else {
        chat = new Chat(chatData.name, chatData.users);
      }
      chat.messages = chatData.messages.map(
        (msgData) => new Message(msgData.text, msgData.sender)
      );
      this.chats[file.split(".")[0]] = chat;
    });
  }

  exportChat(chatKey) {
    if (!this.chats[chatKey]) throw new Error("Chat not found.");
    fs.writeFileSync(
      path.join(this.directory, `${chatKey}.json`),
      JSON.stringify(this.chats[chatKey].toJSON(), null, 2)
    );
  }

  createChat(name, users = [], isBrodeChat = false) {
    const chat = isBrodeChat
      ? new BrodeChat(name, users)
      : new Chat(name, users);
    this.chats[name] = chat;
    this.exportChat(name);
  }

  deleteChat(chatKey) {
    if (!this.chats[chatKey]) throw new Error("Chat not found.");
    delete this.chats[chatKey];
    fs.unlinkSync(path.join(this.directory, `${chatKey}.json`));
  }

  searchChats(query) {
    return Object.values(this.chats).filter(
      (chat) => chat.name.includes(query) || chat.users.includes(query)
    );
  }

  updateChatName(chatKey, newName) {
    const chat = this.chats[chatKey];
    if (!chat) throw new Error("Chat not found.");
    chat.name = newName;
    this.exportChat(chatKey);
    this.chats[newName] = chat;
    if (newName !== chatKey) {
      delete this.chats[chatKey];
      fs.renameSync(
        path.join(this.directory, `${chatKey}.json`),
        path.join(this.directory, `${newName}.json`)
      ); // Rename file
    }
  }

  addUserToChat(chatKey, userId) {
    const chat = this.chats[chatKey];
    if (chat && !chat.users.includes(userId)) {
      chat.users.push(userId);
      this.exportChat(chatKey);
    }
  }

  removeUserFromChat(chatKey, userId) {
    const chat = this.chats[chatKey];
    if (chat) {
      chat.users = chat.users.filter((user) => user !== userId);
      this.exportChat(chatKey);
    }
  }

  addMessageToChat(chatKey, text, sender) {
    const chat = this.chats[chatKey];
    if (chat) {
      chat.addMessage(text, sender);
      this.exportChat(chatKey);
    }
  }
}

module.exports = {
  ChatManager,
};
