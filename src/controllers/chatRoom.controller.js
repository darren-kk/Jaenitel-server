const User = require("../models/User");
const Chat = require("../models/Chat");
const ChatRoom = require("../models/ChatRoom");

exports.getChatRooms = async (req, res, next) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
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
    error.status = 500;
    error.message = "Internal Server Error";
    next(error);
  }
};

exports.getChatRoom = async (req, res, next) => {
  const { userId, roomId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
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
      const error = new Error("존재하지 않는 대화방 입니다.");
      error.status = 404;

      next(error);
    }

    res.status(200).json({ chatRoom });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";
    next(error);
  }
};

exports.createChatRoom = async (req, res, next) => {
  const { userId } = req.params;
  const title = req.body.title;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    const existingChatRoom = await ChatRoom.findOne({ title: title });

    if (existingChatRoom) {
      const error = new Error("이미 해당 이름을 가진 대화방이 존재합니다.");
      error.status = 400;

      next(error);
    }

    const chatRoom = new ChatRoom({
      title: title,
      madeBy: user._id,
    });

    const totalChatRooms = await ChatRoom.countDocuments();

    await chatRoom.save();

    res.status(201).json({ chatRoom, totalChatRooms });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";
    next(error);
  }
};

exports.deleteChatRoom = async (req, res, next) => {
  const { userId, roomId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      const error = new Error("존재하지 않는 사용자 입니다.");
      error.status = 404;

      next(error);
    }

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      const error = new Error("존재하지 않는 대화방 입니다.");
      error.status = 404;

      next(error);
    }

    await Promise.all(
      chatRoom.chats.map(async (chat) => {
        await Chat.findByIdAndDelete(chat);
      }),
    );

    await ChatRoom.findByIdAndDelete(roomId);

    res.status(200).json({ success: true });
  } catch (error) {
    error.status = 500;
    error.message = "Internal Server Error";

    next(error);
  }
};
