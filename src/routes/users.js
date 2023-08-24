const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const postController = require("../controllers/posts.controller");
const messageController = require("../controllers/messages.controller");
const chatRoomController = require("../controllers/chatRoom.controller");

router.get("/:userId/posts", postController.getPosts);
router.post("/:userId/posts", upload.any(), postController.createPost);

router.get("/:userId/posts/:postId", postController.getPost);
router.put("/:userId/posts/:postId", upload.any(), postController.editPost);
router.delete("/:userId/posts/:postId", postController.deletePost);

router.get("/:userId/messages", messageController.getMessages);
router.post("/:userId/messages", upload.any(), messageController.createMessage);

router.get("/:userId/messages/:messageId", messageController.getMessage);

router.get("/:userId/chat-rooms", chatRoomController.getChatRooms);

router.get("/:userId/chat-rooms/:roomId", chatRoomController.getChatRoom);

module.exports = router;
