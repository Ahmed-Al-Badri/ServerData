const Mail = require("./Mail.js");
const fs = require("fs");
const path = require("path");

const MAIL_FOLDER = path.join(__dirname, "mail");

class All_Mails {
  constructor(prob = MAIL_FOLDER) {
    this.mails = {}; // In-memory representation of emails
    this.data_ay = []; // Array to hold references to mails
    this.storageLocation = prob;

    // Ensure mail directory exists
    if (!fs.existsSync(MAIL_FOLDER)) {
      fs.mkdirSync(MAIL_FOLDER);
    }
  }

  generateUniqueId() {
    let mail_id;
    do {
      mail_id = [...Array(18)]
        .map(() => Math.random().toString(36)[2])
        .join("");
    } while (
      this.mails[mail_id] ||
      fs.existsSync(path.join(MAIL_FOLDER, `${mail_id}.json`))
    );
    return mail_id;
  }

  create_mail(user_mail_id) {
    const mail_id = this.generateUniqueId();
    const new_mail = new Mail({
      from: user_mail_id,
      to: [],
      previous: null,
      mail_id,
      date_create: new Date().toISOString(),
      is_draft: true,
      data_send: undefined,
      content: {
        topic: "",
        content: "",
        date: null,
      },
    });

    // Store in memory and in data_ay
    this.mails[mail_id] = new_mail;
    this.data_ay.push(new_mail);
    return mail_id; // Return the mail ID for reference
  }

  check_mail(mail_id) {
    // Check for mail in the in-memory store
    if (this.mails[mail_id]) {
      return this.mails[mail_id];
    } else {
      const filePath = path.join(MAIL_FOLDER, `${mail_id}.json`);
      if (fs.existsSync(filePath)) {
        const mailData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const mail = new Mail(mailData);
        this.mails[mail_id] = mail; // Cache in memory
        this.data_ay.push(mail); // Also push to data_ay
        return mail;
      }
    }
    return undefined; // Mail not found
  }

  get_mail(user_mail_id, mail_id) {
    const mail = this.check_mail(mail_id);
    if (!mail) {
      return undefined; // Mail not found
    }
    return mail.get(user_mail_id);
  }

  get_draft(email, mail_id) {
    let mail = this.check_mail(mail_id);

    if (mail.data.from == email) {
      return { id: mail_id, data: mail.get_draft(), loaded: 1 };
    }

    return { loaded: true };
  }

  export() {
    // Save all current emails to their respective JSON files
    this.data_ay.forEach((mail) => {
      //console.og("mail id is " + mail.data.mail_id);
      const mailData = mail.export();
      fs.writeFileSync(
        path.join(MAIL_FOLDER, `${mail.data.mail_id}.json`),
        JSON.stringify(mailData)
      );
    });
  }

  import(data) {
    const parsedData = JSON.parse(data);
    for (const mail_id in parsedData) {
      this.mails[mail_id] = new Mail(parsedData[mail_id]);
      this.data_ay.push(this.mails[mail_id]);
      fs.writeFileSync(
        path.join(MAIL_FOLDER, `${mail_id}.json`),
        JSON.stringify(parsedData[mail_id])
      );
    }
  }

  update_mail(user_mail_id, mail_to_update) {
    const mail = this.check_mail(mail_to_update.mail_id);
    if (!mail) {
      //console.og(
      //  `Mail with ID ${mail_to_update.mail_id} not found, cannot update.`
      //);
      return undefined;
    }

    // Update the mail in memory only
    return mail.update(user_mail_id, mail_to_update);
    // Do not immediately save to disk
  }

  send_mail(user_mail_id, mail_id) {
    const mail = this.check_mail(mail_id);
    if (!mail) {
      //console.og(`Mail with ID ${mail_id} not found, cannot send.`);
      return;
    }

    return mail.send(user_mail_id);
    // Optionally you could also avoid saving immediately if you're adopting this approach
  }

  send_soft_mail(user_mail_id, mails = []) {
    let datas = [];
    let temp;
    mails.map((res) => {
      temp = res.mail_id;
      if (temp) {
        temp = this.check_mail(temp);
        if (temp) {
          temp = temp.get_light(user_mail_id);
          if (temp) {
            datas.push({ ...temp, status: res.status });
          }
        }
      }
    });

    return datas;
  }

  search(search_for, mail_ids_to_search) {
    const results = [];
    const orgin = [];
    // Loop through the data_ay for searching
    this.data_ay.forEach((mail) => {
      const similarFields = [
        mail.content.topic,
        mail.from,
        mail.content.content,
      ].some((field) => field && field.includes(search_for));

      // Check if the mail ID is in the list of mail IDs to search
      const isInMailIds =
        mail_ids_to_search.length === 0 ||
        mail_ids_to_search.includes(mail.mail_id);

      if (similarFields && isInMailIds) {
        results.push(mail.get_light()); // Use get_light() to return a summary object of the mail
      }
    });

    return results;
  }
}

module.exports = All_Mails;
