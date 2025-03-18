const Mail_temp = {
  from: "",
  to: ["", ""],
  previous: "id_of_mail",
  mail_id: "uniqe 18 len or more",
  date_create: "date create",
  is_draft: true, //false if not, as in send.
  data_send: "undefined untile send",
  content: {
    topic: "Topic of the mail",
    content: "contents of the mail",
    date: "date send, as in became undraft",
  },
};

class Mail {
  constructor(prob) {
    this.data = prob;
  }

  export() {
    return this.data;
  }

  update(id_of_user, data) {
    if (this.data.is_draft && id_of_user === this.data.from) {
      this.data.content = { ...this.data.content, ...data.content };
      if (data.to) {
        console.log(this.data.to);
        this.data.to = data.to;
      }
      return true;
    }
    return false;
  }

  send(id_of_user) {
    if (id_of_user === this.data.from) {
      this.data.is_draft = false; // mark as sent
      this.data.data_send = new Date().toISOString();
    }

    return this.data.to;
  }

  get(id_of_user) {
    if (this.data.from === id_of_user || this.data.to.includes(id_of_user)) {
      console.log("Found");
      return this.data;
    }
    return null;
  }

  get_light(id_of_user) {
    if (this.data.from === id_of_user || this.data.to.includes(id_of_user)) {
      return {
        topic: this.data.content.topic,
        content: this.data.content.content.slice(0, 50), // Return first 50 characters
        from: this.data.from,
        date: this.data.data_send || this.data.date_create || undefined,
        is_draft: this.data.is_draft,
        mail_id: this.data.mail_id,
      };
    }
    return null;
  }

  get_draft() {
    return this.data;
  }
}

module.exports = Mail;
