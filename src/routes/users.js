const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const postController = require("../controllers/posts.controller");
const messageController = require("../controllers/messages.controller");
const chatRoomController = require("../controllers/chatRoom.controller");

const verifyToken = require("../middlewares/verifyToken");

router.get("/:userId/posts", verifyToken, postController.getPosts);
router.post("/:userId/posts", verifyToken, upload.any(), postController.createPost);

router.get("/:userId/posts/:postId", verifyToken, postController.getPost);
router.put("/:userId/posts/:postId", verifyToken, upload.any(), postController.editPost);
router.delete("/:userId/posts/:postId", verifyToken, postController.deletePost);

router.get("/:userId/messages", verifyToken, messageController.getMessages);
router.post("/:userId/messages", verifyToken, upload.any(), messageController.createMessage);

router.get("/:userId/messages/:messageId", verifyToken, messageController.getMessage);

router.get("/:userId/chat-rooms", verifyToken, chatRoomController.getChatRooms);
router.post("/:userId/chat-rooms", verifyToken, chatRoomController.createChatRoom);

router.get("/:userId/chat-rooms/:roomId", verifyToken, chatRoomController.getChatRoom);
router.delete("/:userId/chat-rooms/:roomId", verifyToken, chatRoomController.deleteChatRoom);

module.exports = router;
