const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const postsController = require("../controllers/posts.controller");
const messageController = require("../controllers/messages.controller");

router.get("/:userId/posts", postsController.getPosts);
router.post("/:userId/posts", upload.any(), postsController.createPost);

router.get("/:userId/posts/:postId", postsController.getPost);
router.put("/:userId/posts/:postId", upload.any(), postsController.editPost);
router.delete("/:userId/posts/:postId", postsController.deletePost);

router.get("/:userId/messages", messageController.getMessages);
router.post("/:userId/messages", upload.any(), messageController.createMessage);

router.get("/:userId/messages/:messageId", messageController.getMessage);

module.exports = router;
