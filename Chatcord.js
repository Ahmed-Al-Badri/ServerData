const All_Users = require("./Users/Users");
const ALL_Chats = require("./Chat/AllChats");
const WebSocket = require("ws");
const CC = new All_Users();
CC.imports("Users_data.json");
const Chats = new ALL_Chats();
CC.new_user("aaa", "aaa", "aaa", "aaa");
async function clean_ups() {
  CC.export("Users_data.json");
  Chats.exportChat();
  wss.close();
  process.exit(0);
}

/* handle errors */

async function cleanUpsAndExit() {
  clean_ups();
  process.exit(0);
}

process.on("SIGINT", () => {
  clean_ups();
  wss.emit("Close");

  Object.entries(userConnections).map(([res, data]) => {
    if (data) {
      data.map((res) => {
        res.close();
      });
    }
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.log(err);
  wss.close((closeErr) => {
    if (closeErr) {
      return;
    }
    cleanUpsAndExit();
  });
});

// Handle process exit
process.on("exit", () => {
  cleanUpsAndExit();
});

const wss = new WebSocket.Server({
  address: "10.200.47.143",
  port: 8081,
});
const userConnections = {};

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const request = JSON.parse(message);

    switch (request.type) {
      case "login":
        handleLogin(request.args, ws);
        break;
      case "create_account":
        handleCreateAccount(request.args, ws);
        break;
      case "get_all":
        handleGetAll(request.args, ws);
        break;
      case "create_chat":
        handleCreateChat(request.args, ws);
        break;
      case "join_chat":
        handleJoinChat(request.args, ws);
        break;
      case "user_info":
        handleUserInfo(request.args, ws);
        break;
      case "get_chat":
        handleGetChatDetails(request.args, ws);
        break;
      case "get_chat_details":
        handleGetChatDetails(request.args, ws);
        break;
      case "fetch_chat":
        handleFetchMessages(request.args, ws);
        break;
      case "send_to_chat":
        handleSendMessage(request.args, ws);
        break;
      case "leave_chat":
        handleLeaveChat(request.args, ws);
        break;
      case "get_style":
        handleGetStyle(request.args, ws);
        break; //// working till this point;
      case "update_style":
        handleUpdateStyle(request.args, ws);
      case "create_brodechat":
        handleCreateBrodeChat(request.args, ws);
        break;
      case "join_brodechat":
        handleJoinBrodeChat(request.args, ws);
        break;
      case "create_brodechat_chat":
        handleCreateBrodeChatChat(request.args, ws);
        break;
      case "send_message_to_brode_chat":
        handleSendMessageToBrodeChat(request.args, ws);
        break;
      case "search_users":
        handleSearchUsers(request.args, ws);
        break;
      default:
        ws.send(
          JSON.stringify({ status: 0, response: "Unknown request type" })
        );
        break;
    }
  });

  ws.on("close", () => {
    for (const userId in userConnections) {
      userConnections[userId] = userConnections[userId].filter(
        (connection) => connection !== ws
      );
      if (userConnections[userId].length === 0) {
        delete userConnections[userId];
      }
    }
  });
});

// WebSocket Handler Functions

function handleLogin(args, ws) {
  try {
    //console.log(args);
    const [username_email, password] = args;
    const loginResponse = CC.login(username_email, password);
    //console.log(
    //  "the email is " + username_email + " and the password " + password
    //);
    if (!userConnections[loginResponse.user.id]) {
      userConnections[loginResponse.user.id] = [];
    }
    userConnections[loginResponse.user.id].push(ws);

    ws.send(
      JSON.stringify({
        type: "login",
        status: 1,
        response: loginResponse,
      })
    );
  } catch (error) {
    ws.send(
      JSON.stringify({
        type: "login",
        status: 0,
        response: error.message,
      })
    );
  }
}

function handleCreateAccount(args, ws) {
  const [email, id, password, username] = args;
  //console.log("create account");
  //console.log(args);
  const newUserResponse = CC.new_user(email, id, password, username);
  //console.log(newUserResponse);
  if (typeof newUserResponse === "string") {
    ws.send(
      JSON.stringify({
        type: "create_account",
        status: 0,
        response: newUserResponse,
      })
    );
  } else {
    const referenceId = newUserResponse.user.reference;
    userConnections[newUserResponse.user.id] =
      userConnections[newUserResponse.user.id] || [];
    userConnections[newUserResponse.user.id].push(ws);

    ws.send(
      JSON.stringify({
        type: "create_account",
        status: 1,
        response: newUserResponse,
        user: newUserResponse,
        reference_id: referenceId,
      })
    );
  }
}

function handleFetchMessages(args, ws) {
  const [reference_id, chatId, date] = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "fetch_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const messages = Chats.getChatMessages(chatId, date);
  ws.send(
    JSON.stringify({
      type: "fetch_chat",
      status: 1,
      response: messages,
    })
  );
}

function handleGetAll(args, ws) {
  try {
    const [reference_id] = args;
    //console.log("the getall " + reference_id);
    let id = CC.find_user_by_reference(reference_id);
    //console.log("the id found was " + id);
    if (id) {
      let b = CC.get_chats(id);
      if (b) {
        let sends = [];
        let bsends = [];
        let temp = undefined;
        let users = {};
        let usr = [];
        b.chats.map((res) => {
          //console.log(res);
          temp = Chats.getChat(id, res);
          if (temp) {
            usr = [...usr, ...Chats.getChatUsers(res)];
            sends.push(temp);
          }
        });
        b.brodechats.map((res) => {
          bsends.push(Chats.getChat(id, res));
        });

        usr.map((res) => {
          if (users[res] == undefined) {
            users[res] = CC.get_style(res);
          }
        });

        ws.send(
          JSON.stringify({
            type: "get_all",
            status: 1,
            response: { chats: sends, brodechats: bsends, users: users },
          })
        );
        return;
      }
    }
    throw Error("error");
  } catch (e) {
    ws.send(
      JSON.stringify({
        type: "get_all",
        status: 0,
        response: e,
      })
    );
  }
}

function handleGetChatDetails(request, ws) {
  try {
    let [ref, chats] = request;
    let id = CC.find_user_by_reference(ref);

    if (id) {
      let chats_given = Chats.getChat(id, chats);
      if (!chats_given) {
        throw new Error("Chat not found");
      }

      ws.send(
        JSON.stringify({
          type: "get_chat",
          chat: chats_given,
          chat_id: chats,
          status: 1,
        })
      );
      let datas = chats_given.users;

      datas.map((res) => {
        if (userConnections[res]) {
          userConnections[res].map((res1) => {
            handleGetAll([CC.users_key[res].data.reference], res1);
          });
        }
      });
      return;
    }
    throw error("An error");
  } catch (e) {
    ws.send(
      JSON.stringify({
        type: "get_chat_details",
        status: 0,
        response: e,
      })
    );
  }
}

function handleJoinChat(args, ws) {
  const [reference_id, chatId] = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "join_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  let result = Chats.join_chat(userId, chatId);
  if (result) {
    result = CC.add_chat(userId, chatId);
    if (result) {
      handleGetAll([reference_id], ws);
      ws.send(
        JSON.stringify({
          type: "join_chat",
          status: 1,
          response: "Joined chat successfully",
          chatId: chatId,
        })
      );
    }
  } else {
    ws.send(
      JSON.stringify({
        type: "join_chat",
        status: 0,
        response: "Failed to join chat.",
      })
    );
  }
}

function handleUserInfo(args, ws) {
  const [id_to_find] = args;
  try {
    let data = CC.get_user(id_to_find);
    if (data) {
      ws.send({ type: "user_info", ...data });
    }
  } catch (error) {}
}

function handleSendMessage(args, ws) {
  const [reference_id, chatId, message] = args;
  const userId = CC.find_user_by_reference(reference_id);
  console.log(userId);
  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "send_message",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  Chats.send_to_chat(userId, message, chatId);
  const chatUsers = Chats.getChatUsers(chatId);
  const chat = Chats.getChat(userId, chatId);
  chatUsers.forEach((user) => {
    if (userConnections[user]) {
      userConnections[user].forEach((userSocket) => {
        if (userSocket.readyState === WebSocket.OPEN) {
          const newMessageData = { userId, message, chatId };
          userSocket.send(
            JSON.stringify({
              type: "get_chat",
              chat_id: chatId,
              chat: chat,
              status: 1,
            })
          );
          handleGetAll([CC.users_key[userId].data.reference], userSocket);
        }
      });
    }
  });

  ws.send(
    JSON.stringify({
      type: "send_message",
      status: 1,
      response: "Message sent successfully",
    })
  );
}

function handleLeaveChat(args, ws) {
  const [reference, leave_chat] = args;
  let id = CC.find_user_by_reference(reference);

  if (id) {
    if (CC.leave_chat(id, leave_chat)) {
      handleGetAll([reference], ws);
    }
  }
}

function handleGetStyle(args, ws, sends) {
  if (sends) {
    ws.send(
      JSON.stringify({
        type: "get_style",
        style: sends,
        status: 1,
      })
    );
  }
  const [reference] = args;
  let id = CC.find_user_by_reference(reference);

  if (id) {
    let data = CC.get_style(id);
    if (data) {
      ws.send(
        JSON.stringify({
          type: "get_style",
          style: data,
          status: 1,
        })
      );
    }
  }
}

function handleUpdateStyle(args, ws) {
  const [reference, update] = args;
  let id = CC.find_user_by_reference(reference);

  if (id) {
    let data = CC.update_stlye(id, update);
    if (data) {
      handleGetStyle([reference], ws, send);
    }
  }
}

function handleCreateChat(args, ws) {
  const [reference_id, chatName] = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "create_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const chatId = Chats.createChat(userId, chatName);
  if (chatId) {
    CC.add_chat(userId, chatId);
    handleGetAll([reference_id], ws);
    ws.send(
      JSON.stringify({
        type: "create_chat",
        status: 1,
        response: "Chat created successfully",
        chatId,
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        type: "create_chat",
        status: 0,
        response: "Failed to create chat.",
      })
    );
  }
}

function handleCreateBrodeChat(args, ws) {
  const { reference_id, brodeChatName } = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "create_brode_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const brodeChatId = Chats.createBrodeChat(userId, brodeChatName);
  if (brodeChatId) {
    ws.send(
      JSON.stringify({
        type: "create_brode_chat",
        status: 1,
        response: "Brode chat created successfully",
        brodeChatId,
      })
    );
  } else {
    ws.send(
      JSON.stringify({
        type: "create_brode_chat",
        status: 0,
        response: "Failed to create brode chat.",
      })
    );
  }
}

function handleJoinBrodeChat(args, ws) {
  const { reference_id, brodeChatId } = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "join_brode_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const user = CC.users_key[userId];
  const brodechat = Chats.brodechats[brodeChatId];

  if (user && brodechat) {
    if (!brodechat.users.includes(userId)) {
      brodechat.users.push(userId);
      user.addBrodeChat(brodeChatId);
      ws.send(
        JSON.stringify({
          type: "join_brode_chat",
          status: 1,
          message: "Successfully joined brodechat.",
        })
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "join_brode_chat",
          status: 0,
          message: "You are already part of this brodechat.",
        })
      );
    }
  } else {
    ws.send(
      JSON.stringify({
        type: "join_brode_chat",
        status: 0,
        message: "BrodeChat not found or user does not exist.",
      })
    );
  }
}

function handleCreateBrodeChatChat(args, ws) {
  const { reference_id, brodeChatId, chatName } = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "create_brodechat_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const brodeChatChatId = Chats.addChatToBrodeChat(
    userId,
    brodeChatId,
    chatName
  );
  ws.send(
    JSON.stringify({
      type: "create_brodechat_chat",
      status: 1,
      response: "Brode chat chat created successfully",
      brodeChatChatId,
    })
  );
}

function handleSendMessageToBrodeChat(args, ws) {
  const { reference_id, message, brodeChatId } = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "send_message_to_brode_chat",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  Chats.send_to_brode_chat(userId, message, brodeChatId);
  ws.send(
    JSON.stringify({
      type: "send_message_to_brode_chat",
      status: 1,
      response: "Message sent to brode chat successfully",
    })
  );
}

function handleSearchUsers(args, ws) {
  const { reference_id, searchTerm } = args;
  const userId = CC.find_user_by_reference(reference_id);

  if (!userId) {
    ws.send(
      JSON.stringify({
        type: "search_users",
        status: 0,
        response: "Unknown user.",
      })
    );
    return;
  }

  const matchedUsers = CC.users
    .filter(
      (user) =>
        user.data.email.includes(searchTerm) ||
        user.data.id.includes(searchTerm) ||
        (user.data.username && user.data.username.includes(searchTerm))
    )
    .map((user) => ({
      user_id: user.data.id,
      username: user.data.username,
    }));

  ws.send(
    JSON.stringify({
      type: "search_users",
      status: 1,
      response: matchedUsers,
    })
  );
}
