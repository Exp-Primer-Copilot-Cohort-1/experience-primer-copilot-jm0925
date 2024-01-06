// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const posts = {};

const handleEvent = (type, data) => {
  if (type === 'PostCreated') {
    const { id, title } = data;
    posts[id] = { id, title, comments: [] };
  } else if (type === 'CommentCreated') {
    const { postId, id, content, status } = data;
    const post = posts[postId];
    post.comments.push({ id, content, status });
  } else if (type === 'CommentUpdated') {
    const { postId, id, content, status } = data;
    const post = posts[postId];
    const comment = post.comments.find((comment) => {
      return comment.id === id;
    });
    comment.status = status;
    comment.content = content;
  }
};

// Get all posts
app.get('/posts', (req, res) => {
  res.send(posts);
});

// Receive events from event bus
app.post('/events', (req, res) => {
  const { type, data } = req.body;
  handleEvent(type, data);
  res.send({});
});

// Start server
app.listen(4002, async () => {
  console.log('Listening on port 4002');

  // Get all events from event bus
  const res = await axios.get('http://event-bus-srv:4005/events');

  // Handle events
  for (let event of res.data) {
    console.log('Processing event:', event.type);
    handleEvent(event.type, event.data);
  }
});