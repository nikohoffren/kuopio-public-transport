const app = require("./functions/api");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is listening at http://localhost:${PORT}`);
});
