const user_details = {
  email: "string",
  id: "string",
  username: "username",
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
    console.log("this is the user data");
    console.log(this.data);
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

  addChat(chatId) {
    this.data.chats.chats.push(chatId);
  }

  addBrodeChat(brodeChatId) {
    this.data.chats.brodechats.push(brodeChatId);
  }

  getChatDetails() {
    return this.data.chats;
  }
}

module.exports = {
  User,
};
