const user_details = {
  email: "string",
  id: "string",
  username: "username",
  style: { name: "Wanted", img: "url" },
  hash: 12,
  hash_2: 5,
  salt1: "string",
  salt2: "string",
  reference: "123123123", //9
  chats: { notification: [], chats: [], brodechats: [] },
};

class User {
  constructor(data = user_details) {
    this.data = data;
  }

  export() {
    //console.log("this is the user data");
    //console.log(this.data);
    return this.data;
  }

  output() {
    return "working";
  }

  remove_notifcation(notification_id) {
    //
  }
  remove_chats(id_of_chat) {
    //
  }
  remove_brodechat(id_of_brodechat) {
    //
  }

  leave_chat(chat_id) {
    let temp = this.data.chats.chats;
    if (temp) {
      let datas = [];
      temp.map((res) => {
        if (res != chat_id) {
          datas.push(res);
        }
      });
      this.data.chats.chats = datas;
      return true;
    } else {
      return false;
    }
  }

  addChat(chatId) {
    let found = false;
    this.data.chats.chats.map((res) => {
      if (found) {
        return;
      }
      if (res == chatId) {
        found = true;
      }
    });
    if (found) {
      return undefined;
    } else {
      console.log(chatId);
      this.data.chats.chats.push(chatId);
      return chatId;
    }
  }

  addBrodeChat(brodeChatId) {
    this.data.chats.brodechats.push(brodeChatId);
  }

  getChatDetails() {
    return this.data.chats;
  }

  getStyle() {
    if (this.data.style) {
      return this.data.style;
    }
    this.data.style = { name: this.data.username, img: undefined };
  }

  updateStyle(update) {
    this.data.style = { ...(this.data.stlye || {}), ...update };
    return this.data.style;
  }
}

module.exports = {
  User,
};
