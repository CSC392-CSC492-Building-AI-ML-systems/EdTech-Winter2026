import express from 'express';
import config from './config/config.js';

const { port, nodeEnv } = config;

const app = express();


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app;

