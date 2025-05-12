const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AuthRouter = require('./Routes/AuthRouter');
const ProductRouter = require('./Routes/ProductRouter');
const MerchantRouter = require('./Routes/MerchantAuthRoute')
const MerchantProductRouters = require('./Routes/MerchantProductRouters');
const uploadRoutes = require("./Routes/uploadRoutes");
const UserCart = require("./Routes/UserCart")
const WishList = require("./Routes/WishList")

require('dotenv').config();
require('./Models/db')
const PORT = process.env.PORT || 8080 //Fetch Port from .env file else take 8080 port default

app.get('/ping', (req, res) => {
    res.send('pong')
})

app.use(bodyParser.json())
app.use(cors())
app.use('/auth', AuthRouter)
app.use('/products', ProductRouter)
app.use('/auth/merchant', MerchantRouter)
app.use('/merchant', MerchantProductRouters)
app.use("/api", uploadRoutes);
app.use("/usercart", UserCart);
app.use("/wishlist", WishList)

app.listen(PORT, () => {
    console.log(`Server is Running on port ${PORT}`);
})