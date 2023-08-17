const express = require("express");
const multer = require("multer");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const postsController = require("../controllers/posts.controller");

router.post("/:userId/posts", upload.any(), postsController.createPost);
router.get("/:userId/posts", postsController.getPosts);

module.exports = router;
