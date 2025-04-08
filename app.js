const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const getPage = require('./routes/getpages');
const search = require('./routes/search'); 

app.use(express.json());

app.use('/api/page', getPage); 
app.use('/api/search', search);     

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
