const Chat_data = {
  chat_id: "...12", //20 len key
  users: [], // ids of user
  data: [
    {
      message: "this is the first message",
      timestamp: "new Date()",
      userId: "id of user",
    },
  ],
  Chat_name: "Name of chat",
};

class Chat {
  constructor(data) {
    this.chat_name = data.chat_name || "Default Chat";
    this.chat_id = data.chat_id || this.generateChatId();
    this.messages = data.messages || [];
    this.users = data.users || [];
  }

  add_data(userId, message) {
    this.messages.push({
      userId: userId,
      message: message,
      timestamp: new Date(),
    });
  }

  generateChatId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  export() {
    return {
      chat_name: this.chat_name,
      chat_id: this.chat_id,
      messages: this.messages,
      users: this.users,
    };
  }
}

module.exports = {
  Chat,
};
