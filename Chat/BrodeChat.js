const crypto = require("crypto");
const { Chat } = require("./Chat");

class BrodeChat {
  constructor(data) {
    this.data = {
      users: data.users || [],
      main_user: data.main_user || [],
      group_chat: data.group_chat || "key",
      group_name: data.group_name || "Name of the group",
      all_chats: data.all_chats || [], // List of Chats within the BrodeChat
    };
  }

  allow_access(userId, groupChat) {
    const user = this.data.users.find((u) => u.user === userId);
    if (user && user.non_access.includes(groupChat)) {
      user.non_access = user.non_access.filter((chat) => chat !== groupChat);
    }
  }

  non_access_to(userId, groupChat) {
    const user = this.data.users.find((u) => u.user === userId);
    if (user && !user.non_access.includes(groupChat)) {
      user.non_access.push(groupChat);
    }
  }

  is_main(userId) {
    return this.data.main_user.includes(userId);
  }

  new_chatroom(chatName) {
    const newChat = new Chat({
      chat_name: chatName,
      chat_id: this.generateChatId(),
    });
    this.data.all_chats.push(newChat);
    return newChat;
  }

  send_message_to_chat(chatId, userId, message) {
    const chat = this.data.all_chats.find((c) => c.chat_id === chatId);
    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (
      this.data.users.some(
        (u) => u.user === userId && u.non_access.includes(chatId)
      )
    ) {
      throw new Error("User does not have access to this chat.");
    }

    chat.add_data(userId, message);
  }

  generateChatId() {
    return crypto.randomBytes(20).toString("hex");
  }

  export() {
    return this.data;
  }
}

module.exports = { BrodeChat };
