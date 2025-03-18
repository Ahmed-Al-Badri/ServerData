const { User } = require("./User");
const fs = require("fs");
const crypto = require("crypto");

class All_Users {
  constructor() {
    this.users = []; // Array of User instances
    this.users_key = {};
    this.mails_key = {};
    this.reference = {};

    this.id_details = {};
    this.mail_details = {};
  }

  imports(file_name = "users.json") {
    try {
      const data = fs.readFileSync(file_name, "utf-8");
      const userDataArray = JSON.parse(data);

      userDataArray.forEach((userData) => {
        const user = new User(userData);
        this.users.push(user);
        this.users_key[user.data.id] = user;
        this.mails_key[user.data.email] = user;
        this.reference[user.data.reference] = user;
        this.id_details[user.data.id] = user.getStyle();
        this.mail_details[user.data.email] = user.getStyle();
      });
    } catch (error) {
      console.error("Error reading or parsing file:", error);
    }
  }

  mails(email_id, mail_id, effect) {
    if (this.mails_key[email_id]) {
      return this.mails_key[email_id].mail(mail_id, effect);
    } else {
      return false;
    }
  }

  get_mails(email_id) {
    if (this.mails_key[email_id]) {
      return this.mails_key[email_id].get_mails();
    }
    return false;
  }

  get_mail(user_id, mail_id) {
    if (this.users_key[user_id]) {
      return this.users_key[user_id].get_mail(mail_id);
    }
    return false;
  }

  export(file_name = "users.json") {
    const usersToExport = this.users.map((user) => user.export());
    fs.writeFileSync(
      file_name,
      JSON.stringify(usersToExport, null, 2),
      "utf-8"
    );
  }

  generateSalt() {
    return crypto.randomBytes(16).toString("hex");
  }

  generateReference() {
    return crypto.randomBytes(24).toString("hex");
  }

  find_user_by_reference(reference_id) {
    const userId = this.reference[reference_id];

    if (userId !== undefined) {
      return userId.data.id;
    } else {
      this.reference[reference_id] = null;
      return undefined;
    }
  }

  find_email_by_reference(reference_id) {
    const data = this.reference[reference_id];
    if (data) {
      return data.data.email;
    } else {
      return undefined;
    }
  }

  new_user(email, id, password, username) {
    const emailTaken = this.users.some((user) => user.data.email === email);
    const idTaken = this.users.some((user) => user.data.id === id);
    //console.log(
    //  "the email " +
    //    email +
    //    " and the id is " +
    //    id +
    //    " and the password is " +
    //    password +
    //    " and the name is " +
    //    username
    //);
    if (emailTaken) {
      return "email already taken";
      //throw new Error("Email is already taken.");
    }

    if (idTaken) {
      return "id already taken";
      throw new Error("ID is already taken.");
    }

    const salt1 = this.generateSalt();
    const salt2 = this.generateSalt();

    const hash = crypto
      .createHash("sha256")
      .update(password + salt1)
      .digest("hex");
    const hash_2 = crypto
      .createHash("sha256")
      .update(password + salt2)
      .digest("hex");

    const newUserDetails = {
      email: email,
      id: id,
      username: username,
      style: { name: username, img: undefined },
      hash: hash,
      hash_2: hash_2,
      salt1: salt1,
      salt2: salt2,
      reference: this.generateReference(),
      chats: { notification: [], chats: [], brodechats: [] },
      mails: [],
    };

    const newUser = new User(newUserDetails);
    this.users.push(newUser);
    this.users_key[id] = newUser;
    this.mails_key[email] = newUser;
    this.id_details[id] = newUser.getStyle();
    this.mail_details[email] = newUser.getStyle();
    this.reference[newUser.data.reference] = newUser;
    let data = {
      reference: newUser.data.reference,
      username: newUser.data.username,
      id: newUser.data.id,
    };

    ////console.log("the created reference is " + newUser.data.reference);
    ////console.log("for " + username);
    return { message: "Created Account", user: data };
  }

  //login
  login(emailOrId, password) {
    const user = this.users.find(
      (user) => user.data.email === emailOrId || user.data.id === emailOrId
    );
    ////console.log(this.users);

    if (!user) {
      ////console.log("not able to log in");
      throw new Error("User not found.");
    }
    //console.log("Logged in");
    const hash = crypto
      .createHash("sha256")
      .update(password + user.data.salt1)
      .digest("hex");
    const hash_2 = crypto
      .createHash("sha256")
      .update(password + user.data.salt2)
      .digest("hex");

    if (hash !== user.data.hash && hash_2 !== user.data.hash_2) {
      throw new Error("Incorrect password.");
    }

    let response = {
      reference: user.data.reference,
      username: user.data.username,
      id: user.data.id,
    };

    //console.log("the wanted or given " + user.data.reference);

    return {
      message: "Login successful",
      user: response,
    };
  }

  updatePassword(emailOrId, newPassword) {
    const user = this.users.find(
      (user) => user.data.email === emailOrId || user.data.id === emailOrId
    );

    if (!user) {
      throw new Error("User not found.");
    }

    const salt1 = this.generateSalt();
    const salt2 = this.generateSalt();

    const hash = crypto
      .createHash("sha256")
      .update(newPassword + salt1)
      .digest("hex");
    const hash_2 = crypto
      .createHash("sha256")
      .update(newPassword + salt2)
      .digest("hex");

    user.data.hash = hash;
    user.data.hash_2 = hash_2;
    user.data.salt1 = salt1;
    user.data.salt2 = salt2;

    return {
      message: "Password updated successfully.",
      user: user.export(),
    };
  }

  leave_chat(user_id, chat_id) {
    let find = this.users_key[user_id];
    if (find) {
      return find.leave_chat(chat_id);
    }
  }

  add_details(user_id, details) {
    const index = this.users.findIndex((user) => user.data.id == user_id);
    //console.log("the key is +" + index);
    if (!index) {
      return false;
    }
    return this.users[index].add_detail(details);
  }

  add_chat(user_id, chat_id) {
    ////console.log("the user id");
    ////console.log(user_id);
    if (this.users_key[user_id]) {
      //console.log("the user is found");
      ////console.log(this.users_key);
      return this.users_key[user_id].addChat(chat_id);
    } else {
      ////console.log(this.users_key);
      return undefined;
    }
  }

  get_chats(user_id) {
    //const index = this.users.findIndex((user) => user.data.id == user_id);
    if (this.users_key[user_id]) {
      return this.users_key[user_id].data.chats;
    } else {
      return undefined;
    }
  }

  get_user(user_id) {
    if (this.users_key[user_id]) {
      let hold = this.users_key[user_id].data;
      return {
        user_id: user_id,
        user_name: hold.username,
      };
    }
    return undefined;
  }

  get_style(user_id) {
    if (this.users_key[user_id]) {
      return this.users_key[user_id].getStyle();
    }
    return undefined;
  }

  update_stlye(user_id, update) {
    if (this.users_key[user_id]) {
      let hold = this.users_key[user_id].updateStyle(update);
      this.id_details[user_id] = this.users_key[user_id].getStyle();
      return hold;
    }
    return undefined;
  }

  get_reference(user_id) {
    if (this.users_key[user_id]) {
      return this.users_key[user_id].data.reference;
    }
    return undefined;
  }

  get_id_by_mail(email_id) {
    return this.mails_key[email_id].data.id;
  }
}

module.exports = All_Users;
