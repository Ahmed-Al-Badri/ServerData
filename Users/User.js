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
  mails: [], //mail id, status: (0 draft, 1 unread, 2 read, 3 inbox, 4 sent, 5 spam, 6 deleted)
};

class User {
  constructor(data = user_details) {
    this.data = data;
  }

  mail(mail_id, effect) {
    let found = false;
    if (this.data.mails == undefined) {
      this.data.mails = [];
    }
    let size = this.data.mails.length;
    for (let b = 0; b < size && found == false; b++) {
      if (this.data.mails[b].mail_id == mail_id) {
        found = true;
        if (this.data.mails[b].status == 7) {
          return 0;
        }
        if (this.data.mails[b].status == 0 && effect != 6) {
          this.data.mails[b].status = 4;
          return 4;
        }
        if (this.data.mails[b].status == 6 && effect == 6) {
          this.data.mails[b].status = 7;
        } else {
          this.data.mails[b].status = effect;
        }
      }
    }
    if (found == false) {
      this.data.mails.push({ mail_id: mail_id, status: effect });
    }

    return true;
  }

  get_mails() {
    return this.data.mails;
  }

  get_mail(find_chat) {
    let size = this.data.mails.length;
    for (let b = 0; b < size; b++) {
      if (this.data.mails[b].mail_id == find_chat) {
        return this.data.mails[b];
      }
    }
  }

  export() {
    ////console.log("this is the user data");
    ////console.log(this.data);
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
      //console.log(chatId);
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
      return { ...this.data.style, email: this.data.email, id: this.data.id };
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
