const fs = require("fs");
const { Chat } = require("./Chat");
const { BrodeChat } = require("./BrodeChat");
const { error } = require("console");

class All_Chats {
  constructor() {
    this.chats = {};
  }
  importChat(chatKey) {
    if (!this.chats[chatKey]) {
      try {
        const data = fs.readFileSync(`./chats/${chatKey}.json`, "utf-8");
        const chatData = JSON.parse(data);
        if (chatData.group_chat) {
          this.chats[chatKey] = new BrodeChat(chatData);
        } else {
          this.chats[chatKey] = new Chat(chatData);
        }
      } catch (error) {
        console.error("Error reading or parsing chat file:", error);
      }
    }
  }

  exportChat(chatKey = null) {
    if (chatKey) {
      const chat = this.chats[chatKey];
      if (chat) {
        fs.writeFileSync(
          `./chats/${chatKey}.json`,
          JSON.stringify(chat.export(), null, 2),
          "utf-8"
        );
      }
    } else {
      for (const key in this.chats) {
        this.exportChat(key);
      }
    }
  }

  chat_exists(chat_id) {
    if (this.chats[chat_id]) {
      return true;
    }
    try {
      this.importChat(chat_id);
      return !!this.chats[chat_id];
    } catch (error) {}
  }

  send_to_chat(user_id, message, chat_id, brode_id = undefined) {
    this.chat_exists(brode_id || chat_id);

    if (brode_id) {
      const brodeChat = this.chats[brode_id];

      if (!brodeChat) {
        throw new Error("BrodeChat not found.");
      }

      let chatExists = brodeChat.data.all_chats.some(
        (chat) => chat.chat_id === chat_id
      );

      if (!chatExists) {
        try {
          this.importChat(chat_id);
          chatExists = brodeChat.data.all_chats.some(
            (chat) => chat.chat_id === chat_id
          );
        } catch (error) {
          throw new Error(
            "Chat authentication failed to fetch chat from the server."
          );
        }
      }

      if (!chatExists) {
        throw new Error(
          "Chat ID not found in the specified BrodeChat after import attempt."
        );
      }

      brodeChat.send_message_to_chat(chat_id, user_id, message);
    } else {
      const normalChat = this.chats[chat_id];

      if (!normalChat) {
        throw new Error("Chat ID not found.");
      }

      normalChat.add_data(user_id, message);
    }
  }

  createBrodeChat(user_id, name) {
    const newBrodeChatKey = `brodechat_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const newBrodeChat = new BrodeChat({
      users: [{ user: user_id, non_access: [] }],
      main_user: [user_id],
      group_chat: newBrodeChatKey,
      group_name: name,
    });

    if (this.chats[newBrodeChatKey]) {
      return newBrodeChatKey;
    }

    this.chats[newBrodeChatKey] = newBrodeChat;
    this.exportChat(newBrodeChatKey);

    return newBrodeChatKey;
  }

  createChat(user_id, name, otherUsers = []) {
    const newChat = new Chat({
      chat_name: name,
      users: [user_id, ...otherUsers],
    });
    const chatKey = newChat.chat_id;
    while (this.chats[chatKey] != undefined) {
      newChat.chat_id = newChat.generateChatId();
      chatKey = newChat.chat_id;
    }

    this.chats[chatKey] = newChat;

    this.exportChat(chatKey);

    return chatKey;
  }

  addChatToBrodeChat(user_id, brodeChatId, chatName) {
    this.chat_exists(brodeChatId);
    const brodeChat = this.chats[brodeChatId];

    if (!brodeChat) {
      throw new Error("BrodeChat not found.");
    }

    const chatKey = `chat_${chatName.replace(/\s+/g, "_").toLowerCase()}`;

    if (this.chats[chatKey]) {
      throw new Error("Chat with this name already exists.");
    }

    const newChat = new Chat({ chat_name: chatName, users: [user_id] });
    this.chats[chatKey] = newChat;

    brodeChat.data.all_chats.push({
      chat_id: newChat.chat_id,
      chat_name: chatName,
      messages: newChat.messages,
    });
    this.exportChat(brodeChatId);

    return chatKey;
  }

  getChat(user_id, id_of_chat) {
    this.chat_exists(id_of_chat);

    const chat = this.chats[id_of_chat];

    if (!chat) {
      throw new Error("Chat not found.");
    }

    if (!chat.users.includes(user_id)) {
      throw new Error("User not authorized to access this chat.");
    }

    return chat;
  }

  getBrodechat() {
    const brodeChats = {};

    for (const chatKey in this.chats) {
      if (this.chats[chatKey] instanceof BrodeChat) {
        brodeChats[chatKey] = this.chats[chatKey];
      }
    }

    return brodeChats;
  }

  join_chat(user_id, chat_id) {
    this.chat_exists(chat_id);
    const chat = this.chats[chat_id];

    if (!chat) {
      return undefined;
      throw new Error("Chat not found.");
    }

    if (!chat.users.includes(user_id)) {
      chat.users.push(user_id);
      this.exportChat(chat_id);
      return chat_id;
    } else {
      return undefined;
      return chat_id;
    }
  }

  join_brodechat(user_id, brode_chat_id) {
    this.chat_exists(brode_chat_id);
    const brodeChat = this.chats[brode_chat_id];

    if (!brodeChat) {
      throw new Error("BrodeChat not found.");
    }

    if (!brodeChat.data.users.some((u) => u.user === user_id)) {
      brodeChat.data.users.push({ user: user_id, non_access: [] });
      this.exportChat(brode_chat_id);
      return brode_chat_id;
    } else {
      return brode_chat_id;
    }
  }

  give_access_to_brodechat_chat(
    main_user_id,
    brode_chat_id,
    chat_id,
    user_id_to_give_access_to
  ) {
    this.chat_exists(brode_chat_id);
    const brodeChat = this.chats[brode_chat_id];

    if (!brodeChat) {
      throw new Error("BrodeChat not found.");
    }

    if (!brodeChat.is_main(main_user_id)) {
      throw new Error("Only main users can give access to chats.");
    }

    const chat = brodeChat.data.all_chats.find((c) => c.chat_id === chat_id);
    if (!chat) {
      throw new Error("Chat not found in this BrodeChat.");
    }

    const user = brodeChat.data.users.find(
      (u) => u.user === user_id_to_give_access_to
    );
    if (!user) {
      throw new Error("User to be given access not found in BrodeChat.");
    }

    brodeChat.allow_access(user_id_to_give_access_to, chat_id);
    this.exportChat(brode_chat_id);
  }

  getChatUsers(chatId) {
    if (this.chats[chatId]) {
      return this.chats[chatId].users;
    }
    return [];
  }

  join_chat(userId, chatId) {
    if (this.chats[chatId]) {
      this.chats[chatId].users.push(userId);
      return chatId;
    }
    return undefined;
  }

  getChatMessages(chatId, date) {
    if (this.chats[chatId]) {
      let messages = this.chats[chatId].messages;

      if (date) {
        const cutoffDate = new Date(date);
        messages = messages.filter(
          (msg) => new Date(msg.timestamp) < cutoffDate
        );
      }

      return messages.slice(-50).reverse();
    }
    return [];
  }

  brodeChatExists(brodeChatId) {
    return this.chats[brodeChatId] instanceof BrodeChat;
  }

  join_brodechat(user_id, brode_chat_id) {
    this.chat_exists(brode_chat_id);
    const brodeChat = this.chats[brode_chat_id];

    if (!brodeChat) {
      throw new Error("BrodeChat not found.");
    }

    if (!brodeChat.data.users.some((u) => u.user === user_id)) {
      brodeChat.data.users.push({ user: user_id, non_access: [] });
      this.exportChat(brode_chat_id);
    } else {
    }

    for (const chat of brodeChat.data.all_chats) {
      if (!chat.users.includes(user_id)) {
        chat.users.push(user_id);
      }
    }
  }
}

module.exports = All_Chats;
