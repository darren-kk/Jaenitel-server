const User = require("../models/User");
const Chat = require("../models/Chat");
const ChatRoom = require("../models/ChatRoom");

const CONFIG = require("../configs/index");

exports.getChatRooms = async (req, res, next) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalChatRooms = await ChatRoom.countDocuments();
    const chatRooms = await ChatRoom.find()
      .populate("users")
      .populate({
        path: "chats",
        model: "Chat",
        populate: {
          path: "writer",
          model: "User",
        },
      })
      .sort("-createdDate")
      .skip(skip)
      .limit(parseInt(limit));

    const chatRoomsWithIndex = chatRooms.map((chatRoom, index) => {
      return {
        _id: chatRoom._id,
        title: chatRoom.title,
        madeBy: chatRoom.madeBy,
        createdDate: chatRoom.createdDate,
        users: chatRoom.users,
        index: totalChatRooms - (skip + index),
      };
    });

    res.status(200).json({
      chatRooms: chatRoomsWithIndex,
      totalChatRooms: totalChatRooms,
      totalPages: Math.ceil(totalChatRooms / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getChatRoom = async (req, res, next) => {
  const { userId, roomId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const chatRoom = await ChatRoom.findById(roomId)
      .populate("users")
      .populate({
        path: "chats",
        model: "Chat",
        populate: {
          path: "writer",
          model: "User",
        },
      });

    if (!chatRoom) {
      return res.status(404).json({ error: "Room Not Found" });
    }

    res.status(200).json({ chatRoom });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createChatRoom = async (req, res, next) => {
  const { userId } = req.params;
  const title = req.body.title;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const existingChatRoom = await ChatRoom.findOne({ title: title });

    if (existingChatRoom) {
      return res.status(400).json({ message: "이미 해당 이름을 가진 대화방이 존재합니다." });
    }

    const chatRoom = new ChatRoom({
      title: title,
      madeBy: user._id,
    });

    const totalChatRooms = await ChatRoom.countDocuments();

    await chatRoom.save();

    res.status(201).json({ chatRoom, totalChatRooms });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.deleteChatRoom = async (req, res, next) => {
  const { userId, roomId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return res.status(404).json({ error: "ChatRoom Not Found" });
    }

    await Promise.all(
      chatRoom.chats.map(async (chat) => {
        await Chat.findByIdAndDelete(chat);
      }),
    );

    await ChatRoom.findByIdAndDelete(roomId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
