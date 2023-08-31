const Chat = require("../models/Chat");
const ChatRoom = require("../models/ChatRoom");
const User = require("../models/User");

exports.createChat = async (data) => {
  const newChat = new Chat({
    writer: data.writer._id,
    content: data.content,
    isSystem: data.isSystem,
  });

  await newChat.save();

  const chatRoom = await ChatRoom.findById(data.roomId);

  if (!chatRoom) {
    throw new Error("ChatRoom not found");
  }

  chatRoom.chats.push(newChat._id);
  await chatRoom.save();

  return newChat;
};

exports.addChatRoomUser = async (data) => {
  const user = await User.findById(data.writer._id);
  if (!user) throw new Error("User not found");

  const chatRoom = await ChatRoom.findById(data.roomId).populate("users");

  if (!chatRoom) {
    throw new Error("ChatRoom not found");
  }

  if (!chatRoom.users.find((existingUser) => existingUser.nickname === user.nickname)) {
    chatRoom.users.push(user._id);

    await chatRoom.save();
  }
};

exports.removeChatRoomUser = async (data) => {
  const user = await User.findById(data.writer._id);
  if (!user) throw new Error("User not found");

  const chatRoom = await ChatRoom.findById(data.roomId).populate("users");

  if (!chatRoom) {
    throw new Error("ChatRoom not found");
  }

  if (chatRoom.users.find((existingUser) => existingUser.nickname === user.nickname)) {
    chatRoom.users.pull(user._id);

    await chatRoom.save();
  }
};

exports.handleSocketError = (socket, error) => {
  console.error(error);
  socket.emit("error-message", { error: error.message });
};
