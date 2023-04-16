const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

//* Serve static files from the root directory
app.use(express.static("./"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "./index.html"));
});

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});
