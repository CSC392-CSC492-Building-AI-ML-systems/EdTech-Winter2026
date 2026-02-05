import express from 'express';
import config from './config/config.js';
const { port, nodeEnv } = config;
const app = express();
app.get("/", (req, res) => {
    res.status(200).send("Hello from the EdTech API!");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
export default app;
//# sourceMappingURL=app.js.map